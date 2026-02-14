import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import { normalizeIds, validateSubscriptionId, buildSafeInClause } from '@/lib/validation';
import { parseSubscriptionIds, parseBooleanParam } from '@/lib/metrics-helpers';
import type { MonthlySpendData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { ids, error } = parseSubscriptionIds(request);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const includeCurrentMonth = parseBooleanParam(
      request.nextUrl.searchParams.get('includeCurrentMonth'),
      true
    );
    const subscriptionId = ids.length === 1 ? ids[0]! : ids;

    const normalizedIds = normalizeIds(subscriptionId);
    const monthFilter = includeCurrentMonth
      ? "AND month_start <= date_trunc('month', current_date())"
      : "AND month_start < date_trunc('month', current_date())";

    let subFilter: string;
    let params: Record<string, string> | undefined;
    if (normalizedIds.length === 1) {
      subFilter = 'sf_subscription_id = :subscription_id';
      params = { subscription_id: validateSubscriptionId(normalizedIds[0]!) };
    } else {
      const inClause = buildSafeInClause(normalizedIds, validateSubscriptionId);
      subFilter = `sf_subscription_id IN (${inClause})`;
    }

    const query = `
      SELECT
        date_format(month_start, 'yyyy-MM') AS month,
        COALESCE(SUM(api_cost_usd_month), 0) AS api_cost_usd_month,
        COALESCE(SUM(cursor_token_fee_calc_usd_month), 0) AS cursor_token_fee_calc_usd_month,
        COALESCE(SUM(api_cost_usd_month), 0) + COALESCE(SUM(cursor_token_fee_calc_usd_month), 0)
          AS total_spend_usd_month
      FROM main.dbt.fct_revops_monthly_team_metrics
      WHERE ${subFilter} ${monthFilter}
      GROUP BY 1 ORDER BY month ASC
    `;

    const data = await executeQuery<MonthlySpendData>(query, params);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

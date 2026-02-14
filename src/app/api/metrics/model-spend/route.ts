import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import { normalizeIds, validateSubscriptionId, buildSafeInClause } from '@/lib/validation';
import { parseSubscriptionIds, parseBooleanParam } from '@/lib/metrics-helpers';
import type { ModelSpendData } from '@/types';

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
    const isMulti = normalizedIds.length > 1;
    const dateFilter = includeCurrentMonth
      ? "AND month <= date_trunc('month', current_date())"
      : "AND month < date_trunc('month', current_date())";

    let subFilter: string;
    if (isMulti) {
      const inClause = buildSafeInClause(normalizedIds, validateSubscriptionId);
      subFilter = `subscription_id IN (${inClause})`;
    } else {
      subFilter = `subscription_id = :subscription_id`;
    }

    const query = isMulti
      ? `
      SELECT
        date_format(month, 'yyyy-MM') AS month,
        'combined' AS cursor_team_id, 'combined' AS subscription_id, 'combined' AS account_id,
        standardized_model, standardized_model_clean, model_family,
        SUM(total_requests) AS total_requests,
        SUM(api_cost_usd_month) AS api_cost_usd_month,
        SUM(cursor_token_fee_calc_usd_month) AS cursor_token_fee_calc_usd_month,
        SUM(total_usage_revenue_tokens_usd_month) AS total_usage_revenue_tokens_usd_month
      FROM revops.analytics.temp_model_usage_monthly_sfdc
      WHERE ${subFilter} ${dateFilter}
      GROUP BY date_format(month, 'yyyy-MM'), standardized_model, standardized_model_clean, model_family
      ORDER BY month ASC
    `
      : `
      SELECT
        date_format(month, 'yyyy-MM') AS month,
        cursor_team_id, subscription_id, account_id,
        standardized_model, standardized_model_clean, model_family,
        total_requests, api_cost_usd_month,
        cursor_token_fee_calc_usd_month, total_usage_revenue_tokens_usd_month
      FROM revops.analytics.temp_model_usage_monthly_sfdc
      WHERE ${subFilter} ${dateFilter}
      ORDER BY month ASC
    `;

    const data = await executeQuery<ModelSpendData>(
      query,
      isMulti ? undefined : { subscription_id: validateSubscriptionId(normalizedIds[0]!) }
    );
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

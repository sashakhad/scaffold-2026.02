import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import { normalizeIds, buildSubscriptionFilter } from '@/lib/validation';
import { parseSubscriptionIds, parseBooleanParam } from '@/lib/metrics-helpers';
import type { MAUGrowthData } from '@/types';

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
    const { clause: subFilter, params } = buildSubscriptionFilter(
      subscriptionId,
      'sf_subscription_id'
    );
    const endDateExpr = includeCurrentMonth
      ? 'current_date()'
      : 'last_day(add_months(current_date(), -1))';

    const groupBySubscription = isMulti ? ', sf_subscription_id' : '';
    const aggregation = isMulti ? 'SUM' : 'MAX';

    const query = `
      WITH last_full_month AS (
        SELECT ${endDateExpr} AS end_date
      ),
      month_latest AS (
        SELECT
          date_format(dt, 'yyyy-MM') AS month,
          ${isMulti ? 'sf_subscription_id,' : ''}
          MAX(dt) AS latest_date
        FROM main.dbt.fct_revops_daily_team_metrics
        CROSS JOIN last_full_month
        WHERE ${subFilter}
          AND dt >= add_months(trunc(current_date(), 'MONTH'), -11)
          AND dt <= last_full_month.end_date
        GROUP BY date_format(dt, 'yyyy-MM')${groupBySubscription}
      )
      SELECT
        m.month,
        ${aggregation}(d.num_active_core_users_l30d) AS MAUs
      FROM month_latest m
      JOIN main.dbt.fct_revops_daily_team_metrics d
        ON d.dt = m.latest_date
       AND d.${subFilter.includes('IN') ? `sf_subscription_id = m.sf_subscription_id` : `sf_subscription_id = ${params ? `'${params.subscription_id}'` : 'NULL'}`}
      GROUP BY m.month
      ORDER BY m.month ASC
    `;

    const data = await executeQuery<MAUGrowthData>(query, params);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

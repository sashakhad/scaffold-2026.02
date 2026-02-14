import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import { normalizeIds, validateSubscriptionId, buildSafeInClause } from '@/lib/validation';
import { parseSubscriptionIds, parseBooleanParam } from '@/lib/metrics-helpers';
import type { FeatureAdoptionData } from '@/types';

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
      ? 'dt >= date_sub(current_date(), 60)'
      : 'dt >= date_sub(current_date(), 60) AND dt <= last_day(add_months(current_date(), -1))';

    let subFilter: string;
    let params: Record<string, string> | undefined;
    if (isMulti) {
      const inClause = buildSafeInClause(normalizedIds, validateSubscriptionId);
      subFilter = `t.sf_subscription_id IN (${inClause})`;
    } else {
      subFilter = 't.sf_subscription_id = :subscription_id';
      params = { subscription_id: validateSubscriptionId(normalizedIds[0]!) };
    }

    const query = `
      WITH subscription_users AS (
        SELECT DISTINCT CAST(ut.user_id AS STRING) AS user_id
        FROM main.dbt.stg_user_team ut
        LEFT JOIN main.dbt.dim_teams t on t.id = ut.team_id
        WHERE ${subFilter}
      ),
      weekly_data AS (
        SELECT
          date_trunc('week', dt) AS week_start,
          COUNT(DISTINCT CASE WHEN activity_type = 'rules' THEN a.user_id END) AS rule_users,
          COUNT(DISTINCT CASE WHEN activity_type = 'mcp' THEN a.user_id END) AS mcp_users
        FROM main.dbt.int_revops_daily_user_activity a
        INNER JOIN subscription_users su ON a.user_id = su.user_id
        WHERE ${dateFilter}
        GROUP BY date_trunc('week', dt)
      )
      SELECT date_format(week_start, 'yyyy-MM-dd') AS week_start, rule_users, mcp_users
      FROM weekly_data ORDER BY week_start ASC
    `;

    const data = await executeQuery<FeatureAdoptionData>(query, params);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

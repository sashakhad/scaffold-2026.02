import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import { normalizeIds, validateSubscriptionId, buildSafeInClause } from '@/lib/validation';
import { parseSubscriptionIds, parseBooleanParam } from '@/lib/metrics-helpers';
import type { FeatureAdoptionPercentageData } from '@/types';

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
      ? 'dt >= date_sub(current_date(), 90)'
      : 'dt >= date_sub(current_date(), 90) AND dt <= last_day(add_months(current_date(), -1))';

    let subFilterSfdc: string;
    let subFilterTeam: string;
    let params: Record<string, string> | undefined;

    if (isMulti) {
      const inClause = buildSafeInClause(normalizedIds, validateSubscriptionId);
      subFilterSfdc = `s.Id IN (${inClause})`;
      subFilterTeam = `t.sf_subscription_id IN (${inClause})`;
    } else {
      subFilterSfdc = 's.Id = :subscription_id';
      subFilterTeam = 't.sf_subscription_id = :subscription_id';
      params = { subscription_id: validateSubscriptionId(normalizedIds[0]!) };
    }

    const seatsAgg = isMulti
      ? 'COALESCE(SUM(s.Total_Licensed_Seats__c), 0)'
      : 'COALESCE(s.Total_Licensed_Seats__c, 0)';

    const query = `
      WITH subscription_info AS (
        SELECT ${seatsAgg} AS total_licensed_seats
        FROM revops_share.pt_salesforce.subscription__c s
        WHERE ${subFilterSfdc}
      ),
      subscription_users AS (
        SELECT DISTINCT CAST(ut.user_id AS STRING) AS user_id
        FROM main.dbt.stg_user_team ut
        LEFT JOIN main.dbt.dim_teams t ON t.id = ut.team_id
        WHERE ${subFilterTeam}
      ),
      weekly_data AS (
        SELECT
          date_trunc('week', dt) AS week_start,
          COUNT(DISTINCT a.user_id) AS weekly_active_users,
          COUNT(DISTINCT CASE WHEN activity_type = 'rules' THEN a.user_id END) AS rules_users,
          COUNT(DISTINCT CASE WHEN activity_type = 'mcp' THEN a.user_id END) AS mcp_users,
          COUNT(DISTINCT CASE WHEN activity_type = 'plan_mode' THEN a.user_id END) AS plan_mode_users,
          COUNT(DISTINCT CASE WHEN activity_type = 'agent' THEN a.user_id END) AS agent_users,
          COUNT(DISTINCT CASE WHEN activity_type = 'composer' THEN a.user_id END) AS commands_users
        FROM main.dbt.int_revops_daily_user_activity a
        INNER JOIN subscription_users su ON a.user_id = su.user_id
        WHERE ${dateFilter}
        GROUP BY date_trunc('week', dt)
      )
      SELECT
        date_format(w.week_start, 'yyyy-MM-dd') AS week_start,
        si.total_licensed_seats, w.weekly_active_users,
        w.rules_users, w.mcp_users, w.plan_mode_users, w.agent_users, w.commands_users,
        ROUND(w.rules_users * 100.0 / NULLIF(si.total_licensed_seats, 0), 1) AS rules_pct,
        ROUND(w.mcp_users * 100.0 / NULLIF(si.total_licensed_seats, 0), 1) AS mcp_pct,
        ROUND(w.plan_mode_users * 100.0 / NULLIF(si.total_licensed_seats, 0), 1) AS plan_mode_pct,
        ROUND(w.agent_users * 100.0 / NULLIF(si.total_licensed_seats, 0), 1) AS agent_pct,
        ROUND(w.commands_users * 100.0 / NULLIF(si.total_licensed_seats, 0), 1) AS commands_pct,
        ROUND(w.weekly_active_users * 100.0 / NULLIF(si.total_licensed_seats, 0), 1) AS wau_pct,
        ROUND(w.rules_users * 100.0 / NULLIF(w.weekly_active_users, 0), 1) AS rules_pct_of_wau,
        ROUND(w.mcp_users * 100.0 / NULLIF(w.weekly_active_users, 0), 1) AS mcp_pct_of_wau,
        ROUND(w.plan_mode_users * 100.0 / NULLIF(w.weekly_active_users, 0), 1) AS plan_mode_pct_of_wau,
        ROUND(w.agent_users * 100.0 / NULLIF(w.weekly_active_users, 0), 1) AS agent_pct_of_wau,
        ROUND(w.commands_users * 100.0 / NULLIF(w.weekly_active_users, 0), 1) AS commands_pct_of_wau
      FROM weekly_data w
      CROSS JOIN subscription_info si
      ORDER BY w.week_start ASC
    `;

    const data = await executeQuery<FeatureAdoptionPercentageData>(query, params);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

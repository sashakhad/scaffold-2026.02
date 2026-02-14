import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import { normalizeIds, validateSubscriptionId, buildSafeInClause } from '@/lib/validation';
import { parseSubscriptionIds, parseBooleanParam } from '@/lib/metrics-helpers';
import type { ActiveUsersTrendData } from '@/types';

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
      ? ''
      : 'AND a.dt <= last_day(add_months(current_date(), -1))';
    const metricsDateFilter = includeCurrentMonth
      ? ''
      : 'AND dt <= last_day(add_months(current_date(), -1))';

    let subFilter: string;
    let params: Record<string, string> | undefined;
    if (isMulti) {
      const inClause = buildSafeInClause(normalizedIds, validateSubscriptionId);
      subFilter = `t.sf_subscription_id IN (${inClause})`;
    } else {
      subFilter = 't.sf_subscription_id = :subscription_id';
      params = { subscription_id: validateSubscriptionId(normalizedIds[0]!) };
    }

    const metricsSubFilter = isMulti
      ? `sf_subscription_id IN (${buildSafeInClause(normalizedIds, validateSubscriptionId)})`
      : 'sf_subscription_id = :subscription_id';
    const metricsAgg = isMulti ? 'SUM' : 'MAX';

    const query = `
      WITH core_activity_types AS (
        SELECT DISTINCT feature FROM main.dbt.dau_all
      ),
      daily_active AS (
        SELECT a.dt, COUNT(DISTINCT a.user_id) AS daily_active_users
        FROM main.dbt.int_revops_daily_user_activity a
        INNER JOIN main.dbt.dim_teams t ON a.cursor_team_id = t.id
        INNER JOIN core_activity_types c ON a.activity_type = c.feature
        WHERE ${subFilter}
          AND a.dt >= date_sub(current_date(), 180) ${dateFilter}
        GROUP BY a.dt
      ),
      weekly_metrics AS (
        SELECT dt,
          ${metricsAgg}(num_active_core_users_l7d) AS weekly_active_users,
          ${metricsAgg}(num_active_core_users_l30d) AS monthly_active_users,
          ${metricsAgg}(num_agent_power_users_l7d) AS power_users
        FROM main.dbt.fct_revops_daily_team_metrics
        WHERE ${metricsSubFilter}
          AND dt >= date_sub(current_date(), 180) ${metricsDateFilter}
          AND dayofweek(dt) = 1
        GROUP BY dt
      )
      SELECT
        date_format(w.dt, 'yyyy-MM-dd') AS date,
        COALESCE(d.daily_active_users, 0) AS daily_active_users,
        w.weekly_active_users, w.monthly_active_users, w.power_users
      FROM weekly_metrics w
      LEFT JOIN daily_active d ON w.dt = d.dt
      ORDER BY w.dt ASC
    `;

    const data = await executeQuery<ActiveUsersTrendData>(query, params);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

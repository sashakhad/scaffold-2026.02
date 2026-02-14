import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import { NUMERIC_ID_REGEX, buildTeamIdFilter } from '@/lib/validation';
import { parseBooleanParam } from '@/lib/metrics-helpers';
import type { DepthOfUsageData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const teamId = request.nextUrl.searchParams.get('teamId');
    const teamIds = request.nextUrl.searchParams.get('teamIds');

    const ids = teamIds ? teamIds.split(',').filter(id => id.trim()) : teamId ? [teamId] : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: 'teamId or teamIds is required' }, { status: 400 });
    }

    const validTeamIds = ids.filter(id => NUMERIC_ID_REGEX.test(id));
    if (validTeamIds.length === 0) {
      return NextResponse.json([]);
    }

    const months = Math.max(
      1,
      Math.min(24, Math.floor(Number(request.nextUrl.searchParams.get('months') ?? '3') || 3))
    );
    const includeCurrentMonth = parseBooleanParam(
      request.nextUrl.searchParams.get('includeCurrentMonth'),
      false
    );

    const teamIdFilter = buildTeamIdFilter(validTeamIds, 'team_id');
    const includeCurrentMonthClause = includeCurrentMonth ? 'TRUE' : 'FALSE';

    const query = `
      WITH team_users AS (
        SELECT DISTINCT user_id FROM main.dbt.stg_user_team WHERE ${teamIdFilter}
      ),
      bucketed_data AS (
        SELECT u.month, u.user_id, u.number_of_requests,
          CASE
            WHEN u.number_of_requests BETWEEN 0 AND 100 THEN '0-100'
            WHEN u.number_of_requests BETWEEN 101 AND 200 THEN '101-200'
            WHEN u.number_of_requests BETWEEN 201 AND 300 THEN '201-300'
            WHEN u.number_of_requests BETWEEN 301 AND 400 THEN '301-400'
            WHEN u.number_of_requests >= 500 THEN '500+'
            ELSE '401-499'
          END AS request_bucket
        FROM main.dbt.int_monthly_user_agent_usage AS u
        INNER JOIN team_users AS t ON u.user_id = t.user_id
        WHERE u.month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL ${months} MONTH)
          AND (${includeCurrentMonthClause} OR u.month < DATE_TRUNC('month', CURRENT_DATE))
      )
      SELECT request_bucket, month, DATE_FORMAT(month, 'MMM yyyy') AS month_name,
        COUNT(DISTINCT user_id) AS user_count
      FROM bucketed_data
      GROUP BY request_bucket, month_name, month
      ORDER BY month,
        CASE request_bucket
          WHEN '0-100' THEN 1 WHEN '101-200' THEN 2 WHEN '201-300' THEN 3
          WHEN '301-400' THEN 4 WHEN '401-499' THEN 5 WHEN '500+' THEN 6
        END
    `;

    const data = await executeQuery<DepthOfUsageData>(query);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

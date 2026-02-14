import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import { NUMERIC_ID_REGEX, buildTeamIdFilter } from '@/lib/validation';

interface ModelRow {
  standardized_model: string;
  total_requests: number;
  api_cost_usd: number;
  cursor_token_fee_usd: number;
}

interface SpendBucketRow {
  bucket_label: string;
  user_count: number;
}

export async function GET(request: NextRequest) {
  try {
    const teamIdParam = request.nextUrl.searchParams.get('teamId');
    const startDate = request.nextUrl.searchParams.get('start_date');
    const endDate = request.nextUrl.searchParams.get('end_date');

    if (!teamIdParam) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    const teamIds = teamIdParam.split(',').map((id) => id.trim()).filter(Boolean);
    const validTeamIds = teamIds.filter((id) => NUMERIC_ID_REGEX.test(id));

    if (validTeamIds.length === 0) {
      return NextResponse.json({ error: 'No valid team IDs provided' }, { status: 400 });
    }

    // Step 1: Look up subscription IDs from team IDs
    const teamFilter = buildTeamIdFilter(validTeamIds, 't.id');
    const subLookupSql = `
      SELECT DISTINCT t.sf_subscription_id
      FROM main.dbt.dim_teams t
      WHERE ${teamFilter}
        AND t.sf_subscription_id IS NOT NULL
    `;
    const subRows = await executeQuery<{ sf_subscription_id: string }>(subLookupSql);
    const subscriptionIds = subRows.map((r) => r.sf_subscription_id).filter(Boolean);

    if (subscriptionIds.length === 0) {
      return NextResponse.json({
        success: true,
        dateRange: { start: startDate ?? '', end: endDate ?? '' },
        account: '',
        modelBreakdown: [],
        totalTokens: 0,
        costMetrics: { totalApiCost: 0, cursorTokenFee: 0, totalCost: 0 },
        medianCostPerUser: 0,
        spendDistribution: { buckets: [], statistics: { avgSpend: 0, medianSpend: 0, totalUsers: 0 } },
      });
    }

    // Build subscription filter
    const safeSubIds = subscriptionIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(',');
    const subFilter = `subscription_id IN (${safeSubIds})`;

    // Date filter for monthly data (filter months that overlap the date range)
    let monthFilter = '';
    if (startDate && endDate) {
      const safeStart = startDate.replace(/'/g, "''");
      const safeEnd = endDate.replace(/'/g, "''");
      monthFilter = `AND month >= DATE_TRUNC('month', DATE('${safeStart}'))
        AND month <= DATE_TRUNC('month', DATE('${safeEnd}'))`;
    }

    // Step 2: Get model breakdown from blessed source
    const modelSql = `
      SELECT
        standardized_model,
        SUM(total_requests) AS total_requests,
        SUM(api_cost_usd_month) AS api_cost_usd,
        SUM(cursor_token_fee_calc_usd_month) AS cursor_token_fee_usd
      FROM revops.analytics.temp_model_usage_monthly_sfdc
      WHERE ${subFilter} ${monthFilter}
      GROUP BY standardized_model
      ORDER BY api_cost_usd DESC
    `;

    const modelRows = await executeQuery<ModelRow>(modelSql);

    // Transform model data to match old anyusage format
    const modelBreakdown = modelRows.map((row) => ({
      model: row.standardized_model,
      requests: Number(row.total_requests),
      totalTokens: 0,
      tokenCostDollars: Number(row.api_cost_usd),
      cursorFeeDollars: Number(row.cursor_token_fee_usd),
      totalCostDollars: Number(row.api_cost_usd) + Number(row.cursor_token_fee_usd),
    }));

    // Compute cost metrics
    let totalApiCost = 0;
    let cursorTokenFee = 0;
    for (const row of modelBreakdown) {
      totalApiCost += row.tokenCostDollars;
      cursorTokenFee += row.cursorFeeDollars;
    }

    // Step 3: Get user spend distribution using depth-of-usage approach (request count buckets)
    const activityTeamFilter = buildTeamIdFilter(validTeamIds, 'team_id');
    let activityDateFilter = '';
    if (startDate && endDate) {
      const safeStart = startDate.replace(/'/g, "''");
      const safeEnd = endDate.replace(/'/g, "''");
      activityDateFilter = `AND u.month >= DATE_TRUNC('month', DATE('${safeStart}'))
        AND u.month <= DATE_TRUNC('month', DATE('${safeEnd}'))`;
    }

    const spendDistSql = `
      WITH team_users AS (
        SELECT DISTINCT user_id FROM main.dbt.stg_user_team WHERE ${activityTeamFilter}
      ),
      user_totals AS (
        SELECT u.user_id, SUM(u.number_of_requests) AS total_requests
        FROM main.dbt.int_monthly_user_agent_usage u
        INNER JOIN team_users t ON u.user_id = t.user_id
        WHERE 1=1 ${activityDateFilter}
        GROUP BY u.user_id
      ),
      bucketed AS (
        SELECT
          CASE
            WHEN total_requests = 0 THEN '$0'
            WHEN total_requests BETWEEN 1 AND 100 THEN '1-100 requests'
            WHEN total_requests BETWEEN 101 AND 500 THEN '101-500 requests'
            WHEN total_requests BETWEEN 501 AND 1000 THEN '501-1K requests'
            WHEN total_requests BETWEEN 1001 AND 5000 THEN '1K-5K requests'
            ELSE '5K+ requests'
          END AS bucket_label,
          user_id
        FROM user_totals
      )
      SELECT bucket_label, COUNT(DISTINCT user_id) AS user_count
      FROM bucketed
      GROUP BY bucket_label
      ORDER BY
        CASE bucket_label
          WHEN '$0' THEN 1
          WHEN '1-100 requests' THEN 2
          WHEN '101-500 requests' THEN 3
          WHEN '501-1K requests' THEN 4
          WHEN '1K-5K requests' THEN 5
          WHEN '5K+ requests' THEN 6
        END
    `;

    const bucketRows = await executeQuery<SpendBucketRow>(spendDistSql);
    let totalUsers = 0;
    for (const row of bucketRows) {
      totalUsers += Number(row.user_count);
    }

    const spendBuckets = bucketRows.map((row) => ({
      label: row.bucket_label,
      userCount: Number(row.user_count),
      percentage: totalUsers > 0 ? (Number(row.user_count) / totalUsers) * 100 : 0,
    }));

    const medianCostPerUser = totalUsers > 0 ? (totalApiCost + cursorTokenFee) / totalUsers : 0;

    return NextResponse.json({
      success: true,
      dateRange: { start: startDate ?? '', end: endDate ?? '' },
      account: '',
      modelBreakdown,
      totalTokens: 0,
      costMetrics: {
        totalApiCost,
        cursorTokenFee,
        totalCost: totalApiCost + cursorTokenFee,
      },
      medianCostPerUser,
      spendDistribution: {
        buckets: spendBuckets,
        statistics: {
          avgSpend: totalUsers > 0 ? (totalApiCost + cursorTokenFee) / totalUsers : 0,
          medianSpend: medianCostPerUser,
          totalUsers,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

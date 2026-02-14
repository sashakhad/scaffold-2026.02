import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import { normalizeIds, validateSubscriptionId, buildSafeInClause } from '@/lib/validation';
import { parseSubscriptionIds } from '@/lib/metrics-helpers';
import type { TopUserData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { ids, error } = parseSubscriptionIds(request);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const limit = Math.min(
      Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') ?? '10', 10)),
      100
    );
    const subscriptionId = ids.length === 1 ? ids[0]! : ids;

    const normalizedIds = normalizeIds(subscriptionId);

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
      SELECT email,
        total_requests AS agent_requests, total_agent_sessions AS ai_lines,
        total_days_active AS tab_lines, is_l4_user AS uses_rules,
        is_power_user AS uses_mcp, is_l4_user_l30d AS uses_links
      FROM main.dbt.fct_revops_user_metrics
      WHERE ${subFilter} AND last_active_at >= date_sub(current_date(), 30)
      ORDER BY total_requests DESC
      LIMIT ${limit}
    `;

    const data = await executeQuery<TopUserData>(query, params);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import { normalizeIds, validateSubscriptionId, buildSafeInClause } from '@/lib/validation';
import { parseSubscriptionIds } from '@/lib/metrics-helpers';
import type { OverageSpendData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { ids, error } = parseSubscriptionIds(request);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const subscriptionId = ids.length === 1 ? ids[0]! : ids;

    const normalizedIds = normalizeIds(subscriptionId);
    const isMulti = normalizedIds.length > 1;

    let subFilter: string;
    let params: Record<string, string> | undefined;
    if (normalizedIds.length === 1) {
      subFilter = 'Subscription__c = :subscription_id';
      params = { subscription_id: validateSubscriptionId(normalizedIds[0]!) };
    } else {
      const inClause = buildSafeInClause(normalizedIds, validateSubscriptionId);
      subFilter = `Subscription__c IN (${inClause})`;
    }

    const amountExpr = isMulti ? 'SUM(CAST(Amount__c AS DOUBLE))' : 'CAST(Amount__c AS DOUBLE)';
    const groupBy = isMulti ? "\n    GROUP BY date_format(Period_Start__c, 'yyyy-MM')" : '';

    const query = `
      SELECT
        date_format(Period_Start__c, 'yyyy-MM') AS month,
        ${amountExpr} AS amount
      FROM revops.pt_salesforce.subscription_overage__c
      WHERE ${subFilter}
        AND IsDeleted = false
        AND Period_Start__c <= last_day(add_months(current_date(), -1))${groupBy}
      ORDER BY month ASC
    `;

    const data = await executeQuery<OverageSpendData>(query, params);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

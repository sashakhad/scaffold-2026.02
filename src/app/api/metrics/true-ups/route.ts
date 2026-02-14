import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import { normalizeIds, validateSubscriptionId, buildSafeInClause } from '@/lib/validation';
import { parseSubscriptionIds } from '@/lib/metrics-helpers';
import type { TrueUpData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { ids, error } = parseSubscriptionIds(request);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const subscriptionId = ids.length === 1 ? ids[0]! : ids;

    const normalizedIds = normalizeIds(subscriptionId);

    let subFilter: string;
    let params: Record<string, string> | undefined;
    if (normalizedIds.length === 1) {
      subFilter = 'Subscription__c = :subscription_id';
      params = { subscription_id: validateSubscriptionId(normalizedIds[0]!) };
    } else {
      const inClause = buildSafeInClause(normalizedIds, validateSubscriptionId);
      subFilter = `Subscription__c IN (${inClause})`;
    }

    const query = `
      SELECT Id, Name, CloseDate, Subtype__c, True_Up_Number__c, Amount, License_Count__c
      FROM revops_share.pt_salesforce.opportunity
      WHERE ${subFilter}
        AND Subtype__c NOT IN ('Renewal - Annual', 'Early Renewal - Annual')
        AND IsWon = TRUE
      ORDER BY CloseDate ASC
    `;

    const data = await executeQuery<TrueUpData>(query, params);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

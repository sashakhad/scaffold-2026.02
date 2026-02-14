import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import { validateSubscriptionId } from '@/lib/validation';
import type { AccountOpportunity } from '@/types';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const validId = validateSubscriptionId(id);

    const sql = `
      SELECT Id, Name, StageName, CloseDate, Amount, Type, IsClosed, IsWon
      FROM revops_share.pt_salesforce.opportunity
      WHERE AccountId = :account_id
      ORDER BY CloseDate DESC
    `;

    const data = await executeQuery<AccountOpportunity>(sql, { account_id: validId });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

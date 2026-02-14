import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';

interface OpportunityRow {
  id: string;
  name: string;
  cursor_team_id_c: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const accountName = request.nextUrl.searchParams.get('accountName');

    if (!accountName) {
      return NextResponse.json({ error: 'accountName parameter is required' }, { status: 400 });
    }

    const safeAccountName = accountName.replace(/'/g, "''");

    const sql = `
      SELECT
        opp.Id AS id,
        opp.Name AS name,
        s.All_Cursor_Team_IDs__c AS cursor_team_id_c
      FROM revops_share.pt_salesforce.opportunity opp
      LEFT JOIN revops_share.pt_salesforce.account a ON opp.AccountId = a.Id
      LEFT JOIN revops_share.pt_salesforce.subscription__c s ON opp.Subscription__c = s.Id
      WHERE a.Name = '${safeAccountName}'
        AND opp.IsDeleted = false
      ORDER BY opp.CloseDate DESC
    `;

    const rows = await executeQuery<OpportunityRow>(sql);

    return NextResponse.json({ opportunities: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

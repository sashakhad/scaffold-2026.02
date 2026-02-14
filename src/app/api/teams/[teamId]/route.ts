import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import { validateTeamId } from '@/lib/validation';

interface TeamSubscription {
  sf_subscription_id: string;
  account_name: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const validTeamId = validateTeamId(teamId);

    const query = `
      SELECT
        t.sf_subscription_id,
        a.Name as account_name
      FROM main.dbt.dim_teams t
      LEFT JOIN revops_share.pt_salesforce.subscription__c s
        ON t.sf_subscription_id = s.Id
      LEFT JOIN revops_share.pt_salesforce.account a
        ON s.Account__c = a.Id
      WHERE t.id = :team_id
      LIMIT 1
    `;

    const results = await executeQuery<TeamSubscription>(query, {
      team_id: validTeamId,
    });

    if (results.length === 0) {
      return NextResponse.json(
        { error: `No subscription found for team ${teamId}` },
        { status: 404 }
      );
    }

    return NextResponse.json(results[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

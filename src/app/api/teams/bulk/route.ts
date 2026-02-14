import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import { NUMERIC_ID_REGEX, buildTeamIdFilter } from '@/lib/validation';

interface BulkTeamResult {
  team_id: string;
  sf_subscription_id: string;
  account_name: string;
}

export async function GET(request: NextRequest) {
  try {
    const teamIdsParam = request.nextUrl.searchParams.get('teamIds');

    if (!teamIdsParam) {
      return NextResponse.json({ error: 'teamIds query parameter is required' }, { status: 400 });
    }

    const teamIds = teamIdsParam.split(',').filter(id => id.trim());
    if (teamIds.length === 0) {
      return NextResponse.json({ error: 'At least one teamId is required' }, { status: 400 });
    }

    if (teamIds.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 team IDs allowed' }, { status: 400 });
    }

    const validTeamIds = teamIds.filter(id => NUMERIC_ID_REGEX.test(id.trim()));
    if (validTeamIds.length === 0) {
      return NextResponse.json([]);
    }

    const teamIdFilter = buildTeamIdFilter(validTeamIds, 't.id');

    const query = `
      SELECT
        CAST(t.id AS STRING) as team_id,
        t.sf_subscription_id,
        COALESCE(a.Name, t.name) as account_name
      FROM main.dbt.dim_teams t
      LEFT JOIN revops_share.pt_salesforce.subscription__c s
        ON t.sf_subscription_id = s.Id
      LEFT JOIN revops_share.pt_salesforce.account a
        ON s.Account__c = a.Id
      WHERE ${teamIdFilter}
    `;

    const data = await executeQuery<BulkTeamResult>(query);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import type { EnterpriseTeam } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const query = `
      SELECT
        id as team_id,
        name as team_name,
        COALESCE(sf_account_name, name) as display_name,
        seats,
        membership_type,
        sf_account_name
      FROM main.dbt.dim_teams
      WHERE is_enterprise = true
        OR membership_type IN ('CONTRACT', 'TOKEN_BASED_CONTRACT', 'LEGACY_CONTRACT')
        OR seats >= 50
      ORDER BY seats DESC
    `;

    const allTeams = await executeQuery<EnterpriseTeam>(query);

    const searchQuery = request.nextUrl.searchParams.get('q') ?? '';
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '25', 10), 100);

    let results: EnterpriseTeam[];
    if (!searchQuery.trim()) {
      results = allTeams.slice(0, limit);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      results = allTeams
        .filter(
          team =>
            team.display_name.toLowerCase().includes(lowerQuery) ||
            team.team_name.toLowerCase().includes(lowerQuery) ||
            (team.sf_account_name?.toLowerCase().includes(lowerQuery) ?? false) ||
            team.team_id.toString().includes(searchQuery)
        )
        .slice(0, limit);
    }

    return NextResponse.json({
      teams: results,
      count: results.length,
      total: allTeams.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

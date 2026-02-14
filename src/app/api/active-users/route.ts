import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import { NUMERIC_ID_REGEX, buildTeamIdFilter } from '@/lib/validation';

interface UniqueUserRow {
  unique_users: number;
}

export async function GET(request: NextRequest) {
  try {
    const teamIdParam = request.nextUrl.searchParams.get('teamId');
    const startDate = request.nextUrl.searchParams.get('start_date');
    const endDate = request.nextUrl.searchParams.get('end_date');

    if (!teamIdParam || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'teamId, start_date, and end_date are required' },
        { status: 400 }
      );
    }

    const teamIds = teamIdParam.split(',').map((id) => id.trim()).filter(Boolean);
    const validTeamIds = teamIds.filter((id) => NUMERIC_ID_REGEX.test(id));

    if (validTeamIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { unique_users: 0, team_id: teamIdParam, start_date: startDate, end_date: endDate },
      });
    }

    const teamFilter = buildTeamIdFilter(validTeamIds, 'a.cursor_team_id');
    const safeStart = startDate.replace(/'/g, "''");
    const safeEnd = endDate.replace(/'/g, "''");

    const sql = `
      SELECT COUNT(DISTINCT a.user_id) AS unique_users
      FROM main.dbt.int_revops_daily_user_activity a
      WHERE ${teamFilter}
        AND a.dt >= '${safeStart}'
        AND a.dt <= '${safeEnd}'
    `;

    const rows = await executeQuery<UniqueUserRow>(sql);
    const uniqueUsers = rows[0]?.unique_users ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        unique_users: uniqueUsers,
        team_id: teamIdParam,
        start_date: startDate,
        end_date: endDate,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

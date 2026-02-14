import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';

interface AccountRow {
  Name: string;
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ options: [] });
    }

    const safeTerm = query.replace(/'/g, "''").replace(/%/g, '\\%').replace(/_/g, '\\_');

    const sql = `
      SELECT DISTINCT Name
      FROM revops_share.pt_salesforce.account
      WHERE LOWER(Name) LIKE LOWER('%${safeTerm}%')
        AND IsDeleted = false
      ORDER BY Name ASC
      LIMIT 25
    `;

    const rows = await executeQuery<AccountRow>(sql);
    const options = rows.map((r) => r.Name);

    return NextResponse.json({ options });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message, options: [] }, { status: 500 });
  }
}

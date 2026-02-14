import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import type { AccountSearchResult } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'q query parameter is required' }, { status: 400 });
    }

    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const limit = Math.min(
      Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') ?? '20', 10)),
      100
    );

    const safeTerm = query.replace(/'/g, "''").replace(/%/g, '\\%').replace(/_/g, '\\_');

    const sql = `
      SELECT Id, Name, Industry, NumberofEmployees AS NumberOfEmployees
      FROM revops_share.pt_salesforce.account
      WHERE LOWER(Name) LIKE LOWER('%${safeTerm}%')
      ORDER BY Name ASC
      LIMIT ${limit}
    `;

    const data = await executeQuery<AccountSearchResult>(sql);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

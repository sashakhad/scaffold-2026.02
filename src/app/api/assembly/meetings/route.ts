import { NextResponse } from 'next/server';

/**
 * In-memory meeting store (MVP).
 * In production, this would use Prisma/PostgreSQL.
 */
type MeetingHistoryEntry = {
  id: string;
  topic: string;
  decision: string | null;
  unanimous: boolean;
  createdAt: string;
};

// Shared in-memory store — import from consult route would create circular dep in some setups,
// so we maintain a separate store and expose a registration function.
const meetings: MeetingHistoryEntry[] = [];

export function registerMeeting(entry: MeetingHistoryEntry): void {
  meetings.push(entry);
}

/**
 * GET /api/assembly/meetings
 * Returns past meeting summaries.
 */
export function GET(): NextResponse {
  return NextResponse.json({
    meetings: meetings.map((m) => ({
      id: m.id,
      topic: m.topic,
      decision: m.decision,
      unanimous: m.unanimous,
      createdAt: m.createdAt,
    })),
  });
}

import { NextResponse } from 'next/server';
import { ASSEMBLY_MEMBERS } from '@/lib/lsai/members';

/**
 * GET /api/assembly/members
 * Returns the nine assembly member definitions (public info only).
 */
export function GET(): NextResponse {
  const members = ASSEMBLY_MEMBERS.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    personality: m.personality,
    isWeakModel: m.isWeakModel,
  }));

  return NextResponse.json({ members });
}

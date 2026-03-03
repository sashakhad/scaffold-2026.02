import { ASSEMBLY_MEMBERS } from '@/lib/lsai/members';
import { MeetingRoom } from '@/components/assembly/MeetingRoom';

export const metadata = {
  title: 'Assembly Room | LSAI',
  description: 'Consultation room for the AI-powered Local Spiritual Assembly',
};

export default function AssemblyPage() {
  // Pass member info to the client component (no secrets, no model details)
  const members = ASSEMBLY_MEMBERS.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    personality: m.personality,
    isWeakModel: m.isWeakModel,
  }));

  return <MeetingRoom members={members} />;
}

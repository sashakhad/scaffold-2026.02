import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ASSEMBLY_MEMBERS } from '@/lib/lsai/members';
import { Badge } from '@/components/ui/badge';

const ROLE_LABELS: Record<string, string> = {
  chairperson: 'Chair',
  'vice-chairperson': 'Vice-Chair',
  secretary: 'Secretary',
  treasurer: 'Treasurer',
  member: 'Member',
};

export default function Home() {
  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Hero */}
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        {/* Nine-pointed star */}
        <div className="mb-8">
          <NinePointedStar />
        </div>

        <h1 className="text-5xl font-bold tracking-tight">LSAI</h1>
        <p className="text-muted-foreground mt-2 text-xl">
          Local Spiritual Assembly Intelligence
        </p>
        <p className="text-muted-foreground mx-auto mt-4 max-w-lg text-base">
          Nine AI agents consult on community matters using authentic
          Bah&aacute;&rsquo;&iacute; consultation principles — with prayer, frank discussion,
          and unity.
        </p>

        <Link href="/assembly" className="mt-8">
          <Button size="lg" className="text-base">
            Begin Consultation
          </Button>
        </Link>
      </div>

      {/* Assembly Members Preview */}
      <div className="mx-auto max-w-4xl px-8 pb-16">
        <h2 className="mb-6 text-center text-2xl font-semibold">The Assembly</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ASSEMBLY_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">{member.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {ROLE_LABELS[member.role] ?? 'Member'}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                {member.personality}
              </p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-16 space-y-8">
          <h2 className="text-center text-2xl font-semibold">
            How Consultation Works
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: '\u2727', label: 'Opening Prayer', desc: 'The assembly opens with a Bah\u00e1\u02bc\u00ed prayer' },
              { icon: '\uD83D\uDCCB', label: 'Gather Facts', desc: 'Members share relevant information' },
              { icon: '\uD83D\uDCAC', label: 'Consult', desc: 'Frank, loving discussion of the matter' },
              { icon: '\u2696\uFE0F', label: 'Decide', desc: 'Vote and reach a unified decision' },
              { icon: '\u2727', label: 'Closing Prayer', desc: 'The assembly closes with prayer and summary' },
            ].map((step) => (
              <div
                key={step.label}
                className="flex flex-col items-center gap-2 text-center"
              >
                <span className="text-3xl">{step.icon}</span>
                <span className="font-semibold">{step.label}</span>
                <span className="text-muted-foreground text-sm">{step.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Simple nine-pointed star SVG */
function NinePointedStar() {
  // Generate 9-pointed star vertices
  const points: string[] = [];
  const outerRadius = 60;
  const innerRadius = 28;

  for (let i = 0; i < 9; i++) {
    const outerAngle = (i * 40 - 90) * (Math.PI / 180);
    const innerAngle = ((i * 40 + 20) - 90) * (Math.PI / 180);
    const ox = 64 + outerRadius * Math.cos(outerAngle);
    const oy = 64 + outerRadius * Math.sin(outerAngle);
    const ix = 64 + innerRadius * Math.cos(innerAngle);
    const iy = 64 + innerRadius * Math.sin(innerAngle);
    points.push(`${ox},${oy}`);
    points.push(`${ix},${iy}`);
  }

  return (
    <svg
      width="128"
      height="128"
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-amber-600 dark:text-amber-400"
    >
      <polygon
        points={points.join(' ')}
        fill="currentColor"
        opacity="0.15"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

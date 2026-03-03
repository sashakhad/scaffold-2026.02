'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type MemberCardProps = {
  id: string;
  name: string;
  role: string;
  personality: string;
  isWeakModel: boolean;
  isSpeaking?: boolean;
  activeSpeakerId?: string | null;
};

const ROLE_COLORS: Record<string, string> = {
  chairperson: 'bg-amber-600 text-white',
  'vice-chairperson': 'bg-amber-500/80 text-white',
  secretary: 'bg-blue-600 text-white',
  treasurer: 'bg-emerald-600 text-white',
  member: 'bg-secondary text-secondary-foreground',
};

const ROLE_LABELS: Record<string, string> = {
  chairperson: 'Chair',
  'vice-chairperson': 'Vice-Chair',
  secretary: 'Secretary',
  treasurer: 'Treasurer',
  member: 'Member',
};

function getInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function MemberCard({
  id,
  name,
  role,
  personality,
  isWeakModel,
  activeSpeakerId,
}: MemberCardProps) {
  const isSpeaking = activeSpeakerId === id;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 transition-all duration-300',
        isSpeaking && 'border-amber-500 bg-amber-50/50 shadow-md dark:bg-amber-950/20',
        !isSpeaking && 'border-border bg-card',
      )}
    >
      <Avatar
        className={cn(
          'h-9 w-9 shrink-0',
          isSpeaking && 'ring-2 ring-amber-500 ring-offset-2',
          isWeakModel && 'opacity-90',
        )}
      >
        <AvatarFallback
          className={cn(
            'text-xs',
            isSpeaking ? 'bg-amber-200 text-amber-900' : 'bg-muted',
          )}
        >
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{name}</span>
          <Badge
            className={cn('shrink-0 text-[10px]', ROLE_COLORS[role] ?? ROLE_COLORS['member'])}
          >
            {ROLE_LABELS[role] ?? 'Member'}
          </Badge>
          {isSpeaking && (
            <span className="ml-auto flex items-center gap-1 text-xs text-amber-600">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              speaking
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{personality}</p>
      </div>
    </div>
  );
}

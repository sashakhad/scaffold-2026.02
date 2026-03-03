'use client';

import { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ConsultationMessage, ConsultationPhase } from '@/lib/lsai/types';

type ConsultationStreamProps = {
  messages: ConsultationMessage[];
  currentPhase: ConsultationPhase | null;
  isActive: boolean;
};

const PHASE_LABELS: Record<ConsultationPhase, string> = {
  'opening-prayer': 'Opening Prayer',
  'fact-gathering': 'Gathering Facts',
  discussion: 'Consultation',
  decision: 'Decision',
  'closing-prayer': 'Closing Prayer',
};

const PHASE_ICONS: Record<ConsultationPhase, string> = {
  'opening-prayer': '\u2727',
  'fact-gathering': '\uD83D\uDCCB',
  discussion: '\uD83D\uDCAC',
  decision: '\u2696\uFE0F',
  'closing-prayer': '\u2727',
};

const ROLE_COLORS: Record<string, string> = {
  chairperson: 'text-amber-700 dark:text-amber-400',
  'vice-chairperson': 'text-amber-600 dark:text-amber-500',
  secretary: 'text-blue-700 dark:text-blue-400',
  treasurer: 'text-emerald-700 dark:text-emerald-400',
  member: 'text-foreground',
};

export function ConsultationStream({
  messages,
  currentPhase,
  isActive,
}: ConsultationStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastPhaseRef = useRef<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0 && !isActive) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="space-y-3">
          <p className="text-4xl">{'\u2727'}</p>
          <p className="text-muted-foreground text-lg">
            Submit a topic to begin consultation
          </p>
          <p className="text-muted-foreground text-sm">
            The nine members of the assembly will gather in prayer and consult on
            your topic using Bah&aacute;&rsquo;&iacute; consultation principles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea ref={scrollRef} className="h-full p-4">
      <div className="space-y-4">
        {messages.map((msg, index) => {
          const showPhaseHeader =
            index === 0 || messages[index - 1]?.phase !== msg.phase;

          // Track phase changes
          if (showPhaseHeader && msg.phase !== lastPhaseRef.current) {
            lastPhaseRef.current = msg.phase;
          }

          return (
            <div key={index}>
              {showPhaseHeader && (
                <>
                  {index > 0 && <Separator className="my-6" />}
                  <div className="my-4 flex items-center justify-center gap-2">
                    <span className="text-lg">{PHASE_ICONS[msg.phase]}</span>
                    <Badge variant="outline" className="text-sm font-medium">
                      {PHASE_LABELS[msg.phase]}
                    </Badge>
                  </div>
                </>
              )}

              <MessageBubble message={msg} />
            </div>
          );
        })}

        {isActive && (
          <div className="flex items-center gap-2 py-4 text-sm">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            <span className="text-muted-foreground">
              {currentPhase ? PHASE_LABELS[currentPhase] : 'Consulting'}...
            </span>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function MessageBubble({ message }: { message: ConsultationMessage }) {
  const isPrayer = message.type === 'prayer';
  const isSummary = message.type === 'summary';
  const isVote = message.type === 'vote';

  if (isPrayer) {
    return (
      <div className="bg-muted/50 mx-auto max-w-lg rounded-lg p-4 text-center italic">
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          Offered by {message.memberName}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        isSummary && 'bg-muted/30 border-dashed',
        isVote && 'bg-primary/5',
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className={cn(
            'text-sm font-semibold',
            ROLE_COLORS[message.memberRole] ?? ROLE_COLORS['member'],
          )}
        >
          {message.memberName}
        </span>
        <span className="text-muted-foreground text-xs capitalize">
          {message.memberRole.replace('-', ' ')}
        </span>
        {isVote && (
          <Badge variant="outline" className="ml-auto text-xs">
            Vote
          </Badge>
        )}
        {isSummary && (
          <Badge variant="secondary" className="ml-auto text-xs">
            Summary
          </Badge>
        )}
      </div>
      <p className="text-sm leading-relaxed">{message.content}</p>
    </div>
  );
}

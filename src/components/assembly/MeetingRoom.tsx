'use client';

import { useCallback, useRef, useState } from 'react';
import { MemberCard } from './MemberCard';
import { ConsultationStream } from './ConsultationStream';
import { TopicForm } from './TopicForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ConsultationMessage, ConsultationPhase } from '@/lib/lsai/types';

type MemberInfo = {
  id: string;
  name: string;
  role: string;
  personality: string;
  isWeakModel: boolean;
};

type MeetingRoomProps = {
  members: MemberInfo[];
};

type ConsultationState = 'idle' | 'running' | 'complete' | 'error';

const PHASE_LABELS: Record<ConsultationPhase, string> = {
  'opening-prayer': 'Opening Prayer',
  'fact-gathering': 'Gathering Facts',
  discussion: 'Consultation',
  decision: 'Decision',
  'closing-prayer': 'Closing Prayer',
};

export function MeetingRoom({ members }: MeetingRoomProps) {
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState<ConsultationPhase | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [state, setState] = useState<ConsultationState>('idle');
  const [decision, setDecision] = useState<string | null>(null);
  const [isUnanimous, setIsUnanimous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startConsultation = useCallback(
    async (data: { topic: string; description: string; facts: string[] }) => {
      // Reset state
      setMessages([]);
      setCurrentPhase(null);
      setActiveSpeakerId(null);
      setDecision(null);
      setIsUnanimous(false);
      setError(null);
      setState('running');

      // Abort any previous consultation
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch('/api/assembly/consult', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Consultation failed: ${errorBody}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.trim()) {
              continue;
            }

            try {
              const event = JSON.parse(line) as {
                type: string;
                data: Record<string, unknown>;
              };

              switch (event.type) {
                case 'phase-change': {
                  const phase = event.data.phase as ConsultationPhase;
                  setCurrentPhase(phase);
                  break;
                }
                case 'message': {
                  const msg = event.data as unknown as ConsultationMessage;
                  setMessages((prev) => [...prev, msg]);
                  setActiveSpeakerId(msg.memberId);
                  break;
                }
                case 'decision': {
                  const d = event.data as { decision: string; unanimous: boolean };
                  setDecision(d.decision);
                  setIsUnanimous(d.unanimous);
                  break;
                }
                case 'complete': {
                  setState('complete');
                  setActiveSpeakerId(null);
                  break;
                }
                case 'error': {
                  const e = event.data as { error: string };
                  setError(e.error);
                  setState('error');
                  setActiveSpeakerId(null);
                  break;
                }
              }
            } catch {
              // Skip malformed lines
            }
          }
        }

        if (state !== 'error') {
          setState('complete');
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setState('error');
      } finally {
        setActiveSpeakerId(null);
      }
    },
    [state],
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      {/* Left sidebar — Members */}
      <div className="flex w-72 shrink-0 flex-col gap-3 overflow-auto">
        <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Assembly Members
        </h2>
        {members.map((member) => (
          <MemberCard
            key={member.id}
            id={member.id}
            name={member.name}
            role={member.role}
            personality={member.personality}
            isWeakModel={member.isWeakModel}
            activeSpeakerId={activeSpeakerId}
          />
        ))}
      </div>

      {/* Center — Consultation stream */}
      <div className="flex min-w-0 flex-1 flex-col rounded-xl border">
        {/* Phase indicator bar */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h2 className="font-semibold">Consultation</h2>
          <div className="flex items-center gap-2">
            {currentPhase && (
              <Badge variant="outline">{PHASE_LABELS[currentPhase]}</Badge>
            )}
            {state === 'running' && (
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            )}
            {state === 'complete' && (
              <Badge className="bg-emerald-600 text-white">Complete</Badge>
            )}
            {state === 'error' && (
              <Badge className="bg-destructive text-white">Error</Badge>
            )}
          </div>
        </div>

        {/* Message stream */}
        <div className="flex-1 overflow-hidden">
          <ConsultationStream
            messages={messages}
            currentPhase={currentPhase}
            isActive={state === 'running'}
          />
        </div>

        {/* Error display */}
        {error && (
          <div className="border-t bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Right sidebar — Topic form + Decision */}
      <div className="flex w-80 shrink-0 flex-col gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Consultation</CardTitle>
          </CardHeader>
          <CardContent>
            <TopicForm
              onSubmit={startConsultation}
              isDisabled={state === 'running'}
            />
          </CardContent>
        </Card>

        {decision && (
          <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                Decision
                {isUnanimous && (
                  <Badge className="bg-emerald-600 text-white text-xs">
                    Unanimous
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{decision}</p>
            </CardContent>
          </Card>
        )}

        {state === 'idle' && (
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="space-y-2 text-center text-sm text-muted-foreground">
                <p className="text-lg">{'\u2727'}</p>
                <p>
                  The assembly awaits a topic for consultation. Submit a matter
                  above and nine AI agents will consult using Bah&aacute;&rsquo;&iacute;
                  principles.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {state === 'running' && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="space-y-2 text-center text-sm">
                <p className="text-lg">{'\uD83D\uDCAC'}</p>
                <p className="text-muted-foreground">
                  The assembly is in consultation. Each of the nine members is
                  contributing their perspective...
                </p>
                {currentPhase && (
                  <>
                    <Separator className="my-2" />
                    <p className="text-xs font-medium uppercase tracking-wide">
                      Current Phase
                    </p>
                    <p className="font-semibold">
                      {PHASE_LABELS[currentPhase]}
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

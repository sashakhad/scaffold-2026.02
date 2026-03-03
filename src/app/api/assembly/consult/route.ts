import { z } from 'zod';
import { runConsultation } from '@/lib/lsai/orchestrator';
import type { ConsultationTopic, StreamedConsultationEvent } from '@/lib/lsai/types';

const consultRequestSchema = z.object({
  topic: z.string().min(1, 'Topic title is required'),
  description: z.string().min(1, 'Topic description is required'),
  facts: z.array(z.string()).optional().default([]),
  maxDiscussionRounds: z.number().min(1).max(5).optional().default(3),
});

/**
 * POST /api/assembly/consult
 * Starts a consultation and streams messages as NDJSON (newline-delimited JSON).
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const parsed = consultRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { topic: title, description, facts, maxDiscussionRounds } = parsed.data;

  const topicId = `meeting-${Date.now()}`;
  const consultationTopic: ConsultationTopic = {
    id: topicId,
    title,
    description,
    facts,
    relevantGuidance: [],
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(event: StreamedConsultationEvent): void {
        const line = `${JSON.stringify(event)}\n`;
        controller.enqueue(encoder.encode(line));
      }

      try {
        const consultation = runConsultation(consultationTopic, { maxDiscussionRounds });
        let currentPhase = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await consultation.next();

          if (done) {
            // `value` is the MeetingRecord when done
            const meetingRecord = value;
            if (meetingRecord) {
              // Store in memory (MVP — replace with Prisma later)
              addMeetingToHistory(meetingRecord.id, consultationTopic.title, meetingRecord.decision, meetingRecord.unanimous);

              sendEvent({
                type: 'decision',
                data: {
                  decision: meetingRecord.decision ?? 'No decision reached',
                  unanimous: meetingRecord.unanimous,
                },
              });

              sendEvent({
                type: 'complete',
                data: { meetingId: meetingRecord.id },
              });
            }
            break;
          }

          if (value) {
            // Emit phase change if the phase has changed
            if (value.phase !== currentPhase) {
              currentPhase = value.phase;
              sendEvent({
                type: 'phase-change',
                data: { phase: value.phase },
              });
            }

            sendEvent({
              type: 'message',
              data: value,
            });
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        sendEvent({
          type: 'error',
          data: { error: errorMessage },
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// ── In-Memory Meeting History (MVP) ──────────────────────────────

type MeetingHistoryEntry = {
  id: string;
  topic: string;
  decision: string | null;
  unanimous: boolean;
  createdAt: string;
};

const meetingHistory: MeetingHistoryEntry[] = [];

function addMeetingToHistory(
  id: string,
  topic: string,
  decision: string | null,
  unanimous: boolean,
): void {
  meetingHistory.push({
    id,
    topic,
    decision,
    unanimous,
    createdAt: new Date().toISOString(),
  });
}

/** Exported for the meetings endpoint */
export { meetingHistory };

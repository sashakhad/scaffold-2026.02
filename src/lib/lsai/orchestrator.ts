/**
 * LSAI Consultation Orchestrator
 *
 * Runs a full Bahá'í consultation cycle through five phases:
 * 1. Opening Prayer
 * 2. Fact Gathering
 * 3. Discussion (multiple rounds)
 * 4. Decision (vote)
 * 5. Closing Prayer
 *
 * Implemented as an async generator that yields ConsultationMessage objects
 * for real-time streaming to the UI.
 */

import { generateText } from 'ai';
import type {
  AssemblyMember,
  ConsultationConfig,
  ConsultationMessage,
  ConsultationPhase,
  ConsultationTopic,
  MemberVote,
  MeetingRecord,
} from './types';
import { ASSEMBLY_MEMBERS, getChairperson, getSecretary, getSystemPrompt } from './members';
import { getModelInstance } from './models';
import { OPENING_PRAYERS, CLOSING_PRAYERS } from './knowledge/prayers';

const DEFAULT_CONFIG: ConsultationConfig = {
  maxDiscussionRounds: 3,
  maxTokensPerResponse: 300,
};

/** Shuffle an array (Fisher-Yates) to randomize speaking order */
function shuffle<T>(array: ReadonlyArray<T>): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}

/** Format previous messages as conversation context for an agent */
function formatContext(messages: ConsultationMessage[], topic: ConsultationTopic): string {
  const topicBlock = `TOPIC: ${topic.title}\n${topic.description}`;
  const factsBlock =
    topic.facts.length > 0 ? `\nKNOWN FACTS:\n${topic.facts.map((f) => `- ${f}`).join('\n')}` : '';

  if (messages.length === 0) {
    return `${topicBlock}${factsBlock}`;
  }

  const conversationBlock = messages
    .map((m) => `[${m.memberName} (${m.memberRole})] ${m.content}`)
    .join('\n\n');

  return `${topicBlock}${factsBlock}\n\nCONVERSATION SO FAR:\n${conversationBlock}`;
}

/** Call an individual agent and get their response */
async function callAgent(
  member: AssemblyMember,
  userPrompt: string,
  maxTokens: number,
): Promise<string> {
  const model = getModelInstance(member.provider, member.modelId);
  const systemPrompt = getSystemPrompt(member);

  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    maxTokens,
  });

  return text.trim();
}

/** Create a ConsultationMessage */
function createMessage(
  member: AssemblyMember,
  content: string,
  phase: ConsultationPhase,
  round: number,
  type: ConsultationMessage['type'],
): ConsultationMessage {
  return {
    memberId: member.id,
    memberName: member.name,
    memberRole: member.role,
    content,
    phase,
    round,
    type,
  };
}

/**
 * Run a full consultation as an async generator.
 * Yields ConsultationMessage objects as the consultation progresses.
 */
export async function* runConsultation(
  topic: ConsultationTopic,
  config: Partial<ConsultationConfig> = {},
): AsyncGenerator<ConsultationMessage, MeetingRecord, undefined> {
  const fullConfig: ConsultationConfig = { ...DEFAULT_CONFIG, ...config };
  const messages: ConsultationMessage[] = [];
  const chairperson = getChairperson();
  const secretary = getSecretary();

  // Helper to yield and record a message
  function* emit(msg: ConsultationMessage): Generator<ConsultationMessage> {
    messages.push(msg);
    yield msg;
  }

  // ── Phase 1: Opening Prayer ──────────────────────────────────────

  const prayer = OPENING_PRAYERS[Math.floor(Math.random() * OPENING_PRAYERS.length)]!;
  const prayerMsg = createMessage(
    secretary,
    `Let us begin with a prayer.\n\n${prayer.text}\n\n— ${prayer.source}`,
    'opening-prayer',
    0,
    'prayer',
  );
  yield* emit(prayerMsg);

  // Chairperson welcomes and states the topic
  const welcomeContent = await callAgent(
    chairperson,
    `You are opening an assembly meeting. The topic for consultation is:\n\nTitle: ${topic.title}\nDescription: ${topic.description}\n\nWelcome the assembly members, briefly acknowledge the prayer, and introduce the topic. Keep it to 3-4 sentences.`,
    fullConfig.maxTokensPerResponse,
  );
  yield* emit(createMessage(chairperson, welcomeContent, 'opening-prayer', 0, 'procedural'));

  // ── Phase 2: Fact Gathering ──────────────────────────────────────

  // Chairperson invites fact sharing
  const factInvite = await callAgent(
    chairperson,
    `${formatContext(messages, topic)}\n\nYou've introduced the topic. Now invite the assembly members to share any relevant facts, information, or context they have about this matter. Keep it to 1-2 sentences.`,
    fullConfig.maxTokensPerResponse,
  );
  yield* emit(createMessage(chairperson, factInvite, 'fact-gathering', 0, 'procedural'));

  // Each non-chair member shares facts (randomized order)
  const nonChairMembers = ASSEMBLY_MEMBERS.filter((m) => m.id !== chairperson.id);
  const factOrder = shuffle(nonChairMembers);

  for (const member of factOrder) {
    const factContent = await callAgent(
      member,
      `${formatContext(messages, topic)}\n\nThe Chairperson has asked the assembly to share relevant facts and context about this topic. Share any facts, observations, or relevant information you have. If you don't have specific facts, share what you've observed or heard from the community. Keep it brief — 2-3 sentences.`,
      fullConfig.maxTokensPerResponse,
    );
    yield* emit(createMessage(member, factContent, 'fact-gathering', 0, 'fact'));
  }

  // Secretary summarizes facts
  const factSummary = await callAgent(
    secretary,
    `${formatContext(messages, topic)}\n\nAll members have shared their facts and observations. Provide a concise summary of the key facts and information that has been shared. Organize them clearly. Keep it to 4-6 sentences.`,
    fullConfig.maxTokensPerResponse * 2,
  );
  yield* emit(createMessage(secretary, factSummary, 'fact-gathering', 0, 'summary'));

  // ── Phase 3: Discussion ──────────────────────────────────────────

  // Chairperson opens discussion
  const discussionOpen = await callAgent(
    chairperson,
    `${formatContext(messages, topic)}\n\nThe facts have been gathered and summarized. Now open the floor for full consultation. Remind members of the consultation principles briefly and invite them to share their views. Keep it to 2-3 sentences.`,
    fullConfig.maxTokensPerResponse,
  );
  yield* emit(createMessage(chairperson, discussionOpen, 'discussion', 1, 'procedural'));

  for (let round = 1; round <= fullConfig.maxDiscussionRounds; round++) {
    // Each member speaks in randomized order (excluding chairperson who summarizes)
    const speakingOrder = shuffle(nonChairMembers);

    for (const member of speakingOrder) {
      const isLastRound = round === fullConfig.maxDiscussionRounds;
      const roundContext = isLastRound
        ? 'This is the final round of discussion before the assembly moves to a decision.'
        : `This is round ${round} of discussion.`;

      const discussionContent = await callAgent(
        member,
        `${formatContext(messages, topic)}\n\n${roundContext} Share your view on this topic. You may agree or disagree with points already made, offer new perspectives, or build on others' contributions. Remember to be frank but courteous. Keep it to 2-4 sentences.`,
        fullConfig.maxTokensPerResponse,
      );
      yield* emit(createMessage(member, discussionContent, 'discussion', round, 'opinion'));
    }

    // Chairperson summarizes the round
    const roundSummaryPrompt =
      round < fullConfig.maxDiscussionRounds
        ? `${formatContext(messages, topic)}\n\nRound ${round} of discussion has concluded. Briefly summarize the key viewpoints expressed and any emerging consensus or areas of disagreement. Then invite continued discussion. Keep it to 3-4 sentences.`
        : `${formatContext(messages, topic)}\n\nThe final round of discussion has concluded. Summarize the overall consultation — the main viewpoints, areas of agreement, and any remaining differences. Then propose a specific decision for the assembly to vote on. Keep it to 4-6 sentences.`;

    const roundSummary = await callAgent(
      chairperson,
      roundSummaryPrompt,
      fullConfig.maxTokensPerResponse * 2,
    );
    yield* emit(
      createMessage(
        chairperson,
        roundSummary,
        round < fullConfig.maxDiscussionRounds ? 'discussion' : 'decision',
        round,
        'summary',
      ),
    );
  }

  // ── Phase 4: Decision ────────────────────────────────────────────

  const votes: MemberVote[] = [];
  const voteOrder = shuffle([...ASSEMBLY_MEMBERS]);

  for (const member of voteOrder) {
    const voteContent = await callAgent(
      member,
      `${formatContext(messages, topic)}\n\nThe Chairperson has proposed a decision. Cast your vote: do you support this decision? Respond in the format: "I vote [in favor / against]. [Brief 1-2 sentence reason]." Remember: even if you have reservations, consider whether the proposed decision serves the community.`,
      fullConfig.maxTokensPerResponse,
    );

    yield* emit(createMessage(member, voteContent, 'decision', 0, 'vote'));

    // Parse the vote (look for "in favor" or "against")
    const lowerContent = voteContent.toLowerCase();
    const inFavor = lowerContent.includes('in favor') || lowerContent.includes('i support') || lowerContent.includes('i agree') || !lowerContent.includes('against');

    votes.push({
      memberId: member.id,
      memberName: member.name,
      inFavor,
      reasoning: voteContent,
    });
  }

  // Chairperson announces the decision
  const inFavorCount = votes.filter((v) => v.inFavor).length;
  const unanimous = inFavorCount === 9;
  const passed = inFavorCount >= 5;

  const decisionAnnouncementPrompt = unanimous
    ? `${formatContext(messages, topic)}\n\nAll nine members have voted IN FAVOR. The decision is unanimous! Announce this joyfully, celebrate the unity of the assembly, and state the decision clearly. Keep it to 3-4 sentences.`
    : passed
      ? `${formatContext(messages, topic)}\n\n${inFavorCount} out of 9 members voted in favor. The decision passes by majority. Announce the decision, acknowledge the diverse viewpoints, and remind the assembly of the principle that all members now support the decision wholeheartedly. Keep it to 3-4 sentences.`
      : `${formatContext(messages, topic)}\n\nOnly ${inFavorCount} out of 9 members voted in favor. The decision does not pass. Acknowledge this with grace, suggest the matter may need further consultation at a future meeting, and thank members for their frank participation. Keep it to 3-4 sentences.`;

  const decisionAnnouncement = await callAgent(
    chairperson,
    decisionAnnouncementPrompt,
    fullConfig.maxTokensPerResponse * 2,
  );
  yield* emit(createMessage(chairperson, decisionAnnouncement, 'decision', 0, 'procedural'));

  // ── Phase 5: Closing Prayer ──────────────────────────────────────

  // Secretary presents final summary
  const finalSummary = await callAgent(
    secretary,
    `${formatContext(messages, topic)}\n\nThe consultation and vote are complete. Present a formal summary of the meeting for the record. Include: the topic, key points from the discussion, the decision reached, and the vote count. Keep it to 5-8 sentences.`,
    fullConfig.maxTokensPerResponse * 3,
  );
  yield* emit(createMessage(secretary, finalSummary, 'closing-prayer', 0, 'summary'));

  // Closing prayer
  const closingPrayer =
    CLOSING_PRAYERS[Math.floor(Math.random() * CLOSING_PRAYERS.length)]!;
  const closingMsg = createMessage(
    secretary,
    `Let us close with a prayer.\n\n${closingPrayer.text}\n\n— ${closingPrayer.source}`,
    'closing-prayer',
    0,
    'prayer',
  );
  yield* emit(closingMsg);

  // Extract the decision text from the chairperson's announcement
  const decision = passed ? decisionAnnouncement : null;

  // Return the complete meeting record
  return {
    id: topic.id,
    topic,
    messages,
    phase: 'closing-prayer',
    decision,
    votes,
    unanimous,
    createdAt: new Date(),
  };
}

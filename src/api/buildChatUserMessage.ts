import { AGENT_MAP } from '../data/agents';
import { formatFalconExcerptBlock } from '../data/kb/falconKb';
import type { AgentType } from '../types';
import type { buildChatContext } from './buildChatContext';

type ChatContext = ReturnType<typeof buildChatContext>;

/** Wrap the user's question with delegation instructions for Claude */
export function buildChatUserMessage(
  userText: string,
  ctx: ChatContext,
  options?: { historyLength?: number },
): string {
  const question = userText.trim();
  const historyLength = options?.historyLength ?? 0;
  const firstName = ctx.executiveFirstName ?? 'Neeraj';

  if (ctx.conversationalMode === 'greeting') {
    // System prompt already forces the exact single-sentence reply.
    // Pass just the raw message so the system prompt is not overridden.
    return question;
  }

  if (ctx.conversationalMode === 'catchup') {
    const gstPhrase = ctx.gstGreeting ?? 'Good morning';
    const gstClock = ctx.gstTimeLabel ?? 'GST';
    return `DAILY CHECK-IN — Chief of Staff AI leads this turn.

USER MESSAGE:
"${question}"

Instructions:
- Open with a warm greeting for ${firstName} using Dubai time (${gstClock}): e.g. "${gstPhrase}, ${firstName}"
- Summarise today from the action register and market snapshot — cite source handles inline ([MKT-…], [ACT-…]).
- CALENDAR NOT CONNECTED: do NOT mention meetings or a next meeting; no calendar is connected. You may add one short line: "Connect your calendar and I'll include your meetings here too."
- Use markdown: one short plain-terms line, then **What's happened today** as a bold heading, then bullet list (Markets / Teams / Actions).
- Do not prefix market lines with "GCC" if the snapshot already includes it.
- Tone: personal executive assistant. ~100–140 words max.
- Do NOT list sample prompts or capabilities unless asked.
- End with ONE natural offer (regulatory compare, performance look, or drafting help).
${historyLength > 0 ? '- This chat already has history — continue the thread; do not repeat a full intro.' : ''}`;
  }

  if (ctx.conversationalMode === 'thanks') {
    return `CONVERSATIONAL — user said thanks.

USER MESSAGE: "${question}"

Reply briefly and warmly to ${firstName}. Offer to continue with context from this chat. One short paragraph.`;
  }

  const delegation = ctx.agentDelegation ?? [];
  const primary = delegation[0];
  const supporting = delegation.slice(1);

  // Explorer AI: pass raw question — Explorer system prompt handles everything.
  // Adding CSO delegation instructions here would override the Explorer prompt
  // and produce executive-format answers for general knowledge / web search queries.
  if (primary?.id === 'explorer') {
    return question;
  }

  const agentList =
    delegation.length > 0
      ? delegation.map((a) => `${a.name} (${a.role})`).join('; ')
      : 'Chief of Staff AI (Orchestrator)';

  const supportLine =
    supporting.length > 0
      ? supporting.map((a) => a.name).join(', ')
      : 'none — primary agent only';

  const continuity =
    historyLength > 0
      ? `\n- CONVERSATION CONTEXT: ${historyLength} prior turn(s) in this chat — answer in context; reference earlier topics when the user says "it", "that", "the meeting", or asks a follow-up. Do not restart with a generic greeting unless they said hi again.`
      : '';

  const hasFalconKb = Boolean(ctx.falconExcerpts?.length);
  const falconBlock = hasFalconKb
    ? `${formatFalconExcerptBlock(ctx.falconExcerpts!)}
- Apparel Group KB is loaded: answer NOW from the excerpts above and grounded KB handles ([KB-006], [KB-007], etc.).
- Do NOT ask which Apparel Group document the user means. Do NOT say Group Strategy is missing from the KB.
- If a specific fact is absent from excerpts, say so for that fact only — still summarise what the excerpts do contain.
- Do not use uncited metrics or generic strategy scorecards.`
    : '';
  const clarifyLine = hasFalconKb
    ? '- KB excerpts are present — do NOT ask clarifying questions; answer from the excerpts.'
    : '- If unclear, ask ONE short clarifying question — do not change topic.';

  const contextAgent = ctx.contextAgent as AgentType | undefined;
  const contextBlock = contextAgent
    ? `\n- USER CONTEXT FOCUS: ${AGENT_MAP[contextAgent]?.name ?? contextAgent} — the user selected this specialist on the home/chat screen. Lead with this agent's lens, tone, and tools. Stay in this context unless the question clearly requires another specialist.`
    : '';

  return `MANDATORY: Apply the **AGI Executive OS** master system prompt and all Response Standards from the system message — for any user question, without exception.

DELEGATED AGENTS FOR THIS TURN: ${agentList}

USER QUESTION — answer ONLY this (do not change topic or produce unrelated content):
"${question}"

Routing instructions (CSO Prompt Pack):
- Produce **one unified** answer — not separate agent sections unless briefly labelled for clarity.
- Primary lead: ${primary?.name ?? 'Chief of Staff AI'} — open with executive takeaway (2–3 lines).
- Supporting specialists (merge, dedupe): ${supportLine}
- Answer the exact question using grounded source handles only; separate facts, interpretation, and recommendations.
- Apparel Group is headquartered in Dubai, UAE. Use GCC retail expansion alignment only when sources support it.
- Do NOT output generic guides, product overviews, or sample prompts unless explicitly asked.
${clarifyLine}${contextBlock}${continuity}${falconBlock}`;
}

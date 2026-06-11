import { formatFalconExcerptBlock } from '../data/kb/falconKb';
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
  const firstName = ctx.executiveFirstName ?? 'Rajiv';

  if (ctx.conversationalMode === 'greeting') {
    // System prompt already forces the exact single-sentence reply.
    // Pass just the raw message so the system prompt is not overridden.
    return question;
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

  const falconBlock =
    ctx.falconExcerpts?.length
      ? `${formatFalconExcerptBlock(ctx.falconExcerpts)}
- For Falcon Economy / Falcon Strategy / Abu Dhabi economic vision: answer ONLY from the excerpts above and grounded KB handles. If the excerpts do not contain the fact, say it is not in the knowledge base — do not use uncited metrics or generic Falcon scores.`
      : '';

  return `MANDATORY: Apply **1. GLOBAL SYSTEM PROMPT** and all Response Standards from the system message to this answer — for any user question, without exception.

DELEGATED AGENTS FOR THIS TURN: ${agentList}

USER QUESTION — answer ONLY this (do not change topic or produce unrelated content):
"${question}"

Routing instructions (CSO Prompt Pack):
- Produce **one unified** answer — not separate agent sections unless briefly labelled for clarity.
- Primary lead: ${primary?.name ?? 'Chief of Staff AI'} — open with executive takeaway (2–3 lines).
- Supporting specialists (merge, dedupe): ${supportLine}
- Answer the exact question using grounded source handles only; separate facts, interpretation, and recommendations.
- Do not reference D33 (Dubai); ADGM is Abu Dhabi. Use Falcon Economy only when sources support it.
- Do NOT output generic guides, product overviews, or sample prompts unless explicitly asked.
- If unclear, ask ONE short clarifying question — do not change topic.${continuity}${falconBlock}`;
}

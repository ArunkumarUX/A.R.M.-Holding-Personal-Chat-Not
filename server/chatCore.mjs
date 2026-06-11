/**
 * Shared Claude chat streaming — used by dev-api and Netlify Functions.
 */

import { ANSWER_FORMAT_RULES } from './answerFormatRules.mjs';
import {
  CSO_GLOBAL_SYSTEM_PROMPT,
  CSO_ORCHESTRATOR_PROMPT,
  CSO_SOURCE_CONFIDENCE_RULES,
  buildOutputContractBlock,
  buildSpecialistPromptBlocks,
} from './csoPromptPack.mjs';
import {
  falconExcerptsToGroundedRecords,
  formatFalconExcerptBlock,
  isFalconKbQuery,
  retrieveFalconExcerpts,
} from './kb/falconKb.mjs';
import { buildGroundedRecordsFromContext, formatGroundedContextBlock } from './sourceHandles.mjs';
import { formatGstClock, greetingForGstTime } from './gstGreeting.mjs';
import { smartSearch, braveSearchBroad, freeRssSearch, formatSearchResultsBlock, shouldWebSearch } from './webSearch.mjs';

export function getAnthropicConfig() {
  return {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
  };
}


export function buildSystemPrompt(ctx, language) {
  const ar = language === 'ar';
  const firstName = ctx?.executiveFirstName ?? 'Rajiv';
  const gstGreeting = ctx?.gstGreeting ?? greetingForGstTime('en');

  // ── GREETING: return a minimal prompt — no grounded records, no briefing context ──
  if (ctx?.conversationalMode === 'greeting') {
    return `You are the CSO Personal AI Assistant for ${firstName}.
Your ONLY task right now is to reply with EXACTLY this single sentence — nothing more, nothing less:
${gstGreeting}, ${firstName}. I am your Personal AI Agent. How can I help you today?
Do NOT add any other text. Do NOT summarise calendar or actions. Do NOT ask follow-up questions. Output that one sentence and stop.`;
  }

  // ── DAILY CATCH-UP: structured day opener with calendar, actions, markets ──
  if (ctx?.conversationalMode === 'catchup') {
    const gstClock = ctx?.gstTimeLabel ?? 'GST';
    return `You are the CSO Personal AI Assistant for ${firstName}.
The user wants a concise daily catch-up (${gstClock}).

Reply in clear markdown:
1. Warm greeting with correct time-of-day for Abu Dhabi.
2. One short "In plain terms" blockquote (one sentence).
3. **What's happened today** as a bold heading, then bullets for Markets / Teams / Actions / Next meeting.
4. Cite only handles present in context ([MKT-…], [CAL-…], [ACT-…]). Do not invent facts.
5. Do not duplicate "GCC" if the market snapshot already includes it.
6. ~100–140 words. End with ONE natural offer to help further.
7. No sample prompts, no agent roster footer, no "Sources:" block at the end.`;
  }

  // ── GENERAL KNOWLEDGE FALLBACK: answer like a capable AI assistant ──
  if (ctx?.conversationalMode === 'irrelevant') {
    return `You are the Personal AI Assistant for ${firstName} at ${ctx?.organisation || 'ADGM'}.
The user has asked a general knowledge question outside the specialist CSO scope, but you are still a highly capable AI — answer helpfully and accurately from your training knowledge, exactly as a knowledgeable assistant would.
- Be concise, clear and friendly.
- Stay in your persona as the Personal AI Assistant.
- Do NOT say "outside my scope" or refuse to answer.
- If the answer may be time-sensitive or the user would benefit from latest info, add a brief note: "(Verify for the most current data.)"
- You may briefly offer to also help with strategy, market intel, policy or executive comms if relevant.`;
  }

  // ── THANKS: return a minimal prompt ──
  if (ctx?.conversationalMode === 'thanks') {
    return `You are the CSO Personal AI Assistant for ${firstName}. Reply with one warm, brief sentence thanking them and offering to help further. Nothing else.`;
  }

  const userQ = ctx?.userQuestion?.trim() ?? '';

  // ── EXPLORER AI: clean conversational prompt — web results injected if available ──
  // Bypasses ALL CSO executive formatting, follow-ups, and source disclaimers.
  const isExplorerAgent =
    Array.isArray(ctx?.agentDelegation) &&
    ctx.agentDelegation.some((a) => a?.id === 'explorer');

  if (isExplorerAgent && !ctx?.briefingFormat) {
    const langNote = ar
      ? 'Respond in clear Modern Standard Arabic.'
      : 'Respond in clear, friendly English.';
    const webBlock = ctx?.webSearchBlock ? `\n\n${ctx.webSearchBlock}` : '';
    const hasWebResults = Boolean(ctx?.webSearchBlock);
    return `You are the Personal AI Assistant for ${firstName}. You have live web search capability and access to an internal knowledge base.
${langNote}

SOURCE PRIORITY — always follow this order:
1. Internal knowledge base (KB): If the question touches ADGM, FSRA, Falcon Economy, Abu Dhabi strategy, or any institution-specific data, check the KB records injected in the system prompt first and answer from them.
2. Live web search results: injected below if available. Use these to answer general knowledge, news, prices, or any topic not covered by KB. Cite as [WEB-01], [WEB-02] etc. with URL.
3. Training knowledge: use only when neither KB nor web results cover the topic.

IMPORTANT — NEVER say "I can't browse the internet" or "I don't have access to the web." You DO have web search.

If the user's message is a vague web search request (e.g. "can you check the internet", "search online", "look it up") with NO specific topic mentioned, reply with exactly:
"Sure! What would you like me to look up? Just tell me the topic or question and I'll search it for you."
Do NOT add anything else in that case.

For all other questions:
- Answer directly and concisely — like a knowledgeable assistant, not a strategy advisor.
- Do NOT use executive sections: no "Executive Takeaway", "Source Basis", "Strategic Implication", or any CSO structure.
- Do NOT add follow-up suggestions or ADGM-related prompts at the end.
- If web results are injected, cite them inline. If KB covers the topic, cite KB handles.
- If a fact could be outdated, weave a brief "(verify for latest)" naturally into a sentence.
${hasWebResults ? '' : '(No live web results this turn — answer from KB or training knowledge.)'}${webBlock}`;
  }

  const falconExcerpts =
    ctx?.falconExcerpts?.length > 0
      ? ctx.falconExcerpts
      : userQ && isFalconKbQuery(userQ)
        ? retrieveFalconExcerpts(userQ)
        : [];

  let groundedRecords =
    Array.isArray(ctx?.groundedRecords) && ctx.groundedRecords.length > 0
      ? [...ctx.groundedRecords]
      : buildGroundedRecordsFromContext(ctx);

  if (falconExcerpts.length) {
    const existing = new Set(groundedRecords.map((r) => r.handle));
    for (const rec of falconExcerptsToGroundedRecords(falconExcerpts)) {
      if (!existing.has(rec.handle)) groundedRecords.push(rec);
    }
  }

  const hasGrounding = groundedRecords.length > 0;
  const groundedBlock =
    formatGroundedContextBlock(groundedRecords) +
    (falconExcerpts.length ? formatFalconExcerptBlock(falconExcerpts) : '');

  const isBriefing = Boolean(ctx?.briefingFormat);
  const formatLabel = ctx?.briefingFormat || 'executive briefing';

  const deptLine = ctx?.departmentHeadlines?.length
    ? ctx.departmentHeadlines.join('\n')
    : '';

  const delegation =
    ctx?.agentDelegation?.length > 0
      ? ctx.agentDelegation
          .map((a) => `- **${a.name}** (${a.role}): ${a.tagline}`)
          .join('\n')
      : '- **Chief of Staff AI** (Orchestrator): routes and synthesises';

  const userQuestionBlock = ctx?.userQuestion?.trim()
    ? `\nCURRENT USER QUESTION (answer ONLY this — do not change topic):\n"${ctx.userQuestion.trim()}"\n`
    : '';

  const primary = ctx?.agentDelegation?.[0]?.name ?? 'Chief of Staff AI';
  const agentIds = (ctx?.agentDelegation ?? []).map((a) => a.id).filter(Boolean);
  const specialistBlock = buildSpecialistPromptBlocks(agentIds);
  const contractBlock = buildOutputContractBlock(ctx?.userQuestion ?? '');
  const gstClock = ctx?.gstTimeLabel ?? `${formatGstClock()} GST`;

  const now = new Date();
  const currentDate = now.toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Dubai',
  });
  const currentTime = now.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai',
  });

  return `${CSO_GLOBAL_SYSTEM_PROMPT}

TODAY: ${currentDate} · ${currentTime} GST
Executive: ${ctx?.executiveName || 'Rajiv Sehgal'}, Chief Strategy Officer, ${ctx?.organisation || 'Abu Dhabi Global Market (ADGM)'}.

${CSO_ORCHESTRATOR_PROMPT}

${CSO_SOURCE_CONFIDENCE_RULES}

${isBriefing ? `You are generating a **${formatLabel}** briefing (not casual chat). Scan in under 2 minutes. No generic closings.` : ''}

${ANSWER_FORMAT_RULES}

═══════════════════════════════════════════════════════
OUTPUT FORMAT — MANDATORY (follow EXACTLY, no exceptions)
═══════════════════════════════════════════════════════
You MUST use the EXACT bold section headings listed below, in the EXACT order shown.
Do NOT rename sections. Do NOT skip any section. Do NOT merge sections. Do NOT add new sections.
Complete every section fully before moving to the next.

${contractBlock}

═══════════════════════════════
DELEGATED SPECIALISTS THIS TURN
═══════════════════════════════
Primary lead: **${primary}**
${delegation}

${specialistBlock}
${userQuestionBlock}
Language: ${ar ? 'Modern Standard Arabic unless the user writes in English.' : 'Clear English for a non-expert reader unless the user writes in Arabic.'}
${isBriefing ? 'Output only the briefing body.' : 'End with Sources + Grounding lines, then a **Follow-up** section: exactly 2–3 specific action-oriented bullets.'}

═══════════════════════════════
GROUNDED SOURCE RECORDS (cite ONLY these handles)
═══════════════════════════════

${groundedBlock}

${ctx?.webSearchBlock ? ctx.webSearchBlock : ''}

SOURCE CITATION FORMAT (mandatory for every response):
When citing a KB source, always include the real URL from the excerpt header. Format:
  [KB-006] Falcon Economy Strategy 2025–2045 | added.gov.ae | /kb/20240923_FalconEconomy-Eng.pdf
  [KB-008] ADGM Law No. 1547 | adgm.com/rules-and-regulations | /kb/adgm-1547-3267-v3-14.pdf
At the end of every response, the "Sources Used" section must list each cited handle with its real URL so stakeholders can verify. Example format:
  - [KB-006] Falcon Economy Strategy 2025–2045 → added.gov.ae (PDF available)
  - [KB-008] ADGM Law No. 1547 v3.14 → adgm.com/rules-and-regulations (PDF available)
  - [MKT-...] Market data → Yahoo Finance / CoinGecko (live)

DATA INTEGRITY — THREE-TIER ANSWERING (mandatory):

TIER 1 — INTERNAL KB / GROUNDED RECORDS (highest priority):
${hasGrounding
  ? '✅ Grounded records ARE injected this turn. Cite handles inline (KB-, MKT-, CAL-, ACT-, CRM-, BBG-). Do NOT invent licence growth %, Falcon scores, market prices, or ADGM legal clauses. For market figures: add "as of [date], Source: Yahoo Finance / CoinGecko".'
  : '⚠️  No internal records injected this turn — proceed to Tier 2 or Tier 3.'}

TIER 2 — LIVE WEB SEARCH RESULTS (if injected above):
${ctx?.webSearchBlock
  ? '✅ Web search results ARE available above. Use them to answer. Cite as [WEB-01], [WEB-02] etc. Always include the URL. Label as "Source: [publication name] (live web)".'
  : '⚠️  No web search results this turn — proceed to Tier 3 if needed.'}

TIER 3 — GENERAL KNOWLEDGE (when Tiers 1 and 2 have no relevant data):
If the question has no match in grounded records AND no web search results, answer FREELY and HELPFULLY from your training knowledge — exactly like a capable AI assistant would. Do NOT say "not in approved source material." Do NOT say "I don't have enough source material." Do NOT refuse. Just answer directly and accurately. Label knowledge-only answers with "Source: General knowledge (verify for time-sensitive facts)."

══════════════════════════════════════════
CRITICAL OVERRIDE — GENERAL KNOWLEDGE RULE
══════════════════════════════════════════
The source rules and "do not invent" rules in this prompt apply ONLY to ADGM-specific internal facts:
  - Internal KPIs, targets, or performance numbers
  - Official ADGM/FSRA positions or decisions
  - Private meeting details or stakeholder commitments
  - Unpublished internal documents or strategies

They do NOT apply to general world knowledge. For any question about:
  - Geography, places, landmarks, directions (e.g. "where is the Gold Souk in Dubai")
  - History, science, culture, general business concepts
  - Public facts about countries, companies, people, events
  - How-to questions, definitions, explanations
→ Answer immediately and helpfully from training knowledge. Do NOT treat these as "missing source material." This is mandatory.

If you know the answer from general knowledge, give it. Only flag missing data for facts that are genuinely ADGM-internal and cannot be known without an approved source.

${ctx?.bloombergLive
  ? '- Bloomberg headlines (BBG- handles) are LIVE — cite freely.'
  : ctx?.marketSnapshot?.isLive
    ? `- Market data (MKT-) is LIVE from Yahoo Finance / CoinGecko as of ${ctx?.marketSnapshot?.asOf ?? 'today'}. Always add "as of [date], Source: Yahoo Finance / CoinGecko".`
    : '- No live market data is connected this turn. Do NOT cite MKT- handles or quote specific market figures unless they appear in the grounded records above. If asked about live prices, say: "Live market data is not connected — please verify current figures via a financial terminal."'}

Institutional metrics (cite matching handle if used):
- Queries this week: ${ctx?.metrics?.queriesThisWeek ?? '—'}
- Documents in KB: ${ctx?.metrics?.documentsInKb ?? '—'}
- Departments green: ${ctx?.metrics?.departmentsOnTrack ?? '—'} / 9
- Open actions: ${ctx?.metrics?.openActions ?? '—'}
- Falcon / ADGM Law questions: use KB-006–KB-015 excerpts if available; otherwise answer from general knowledge.

Department headlines (ERP):
${deptLine || '(none injected — answer from general knowledge if asked)'}`;
}

/**
 * Stream Claude SSE events via writeEvent({ type, text?, message?, model? }).
 */
export async function streamChat(payload, writeEvent) {
  const { apiKey, model } = getAnthropicConfig();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured on the server.');
  }

  const { message, language = 'en', history = [], context = {} } = payload || {};
  if (!message?.trim()) {
    throw new Error('message is required');
  }

  // Detect if Explorer AI agent is active (general knowledge / out-of-scope queries)
  const isExplorerQuery =
    Array.isArray(context?.agentDelegation) &&
    context.agentDelegation.some((a) => a?.id === 'explorer');

  // ── WEB SEARCH STRATEGY: KB first, external search supplements gaps ──
  // Every query now attempts live web search so Claude always has fresh external
  // data to supplement the internal knowledge base.
  // - Explorer (general / outside-ADGM): broad unscoped search for any topic.
  // - CSO agents (ADGM-specific): scoped search on approved financial/regulatory sources.
  // Internal KB / grounded records are injected via the system prompt separately;
  // Claude is instructed to prefer KB for ADGM-internal facts and use web for the rest.
  let webSearchBlock = '';
  try {
    if (isExplorerQuery) {
      // Broad search — no domain scoping, answers any topic
      const braveKey = process.env.BRAVE_SEARCH_API_KEY?.trim();
      const results = braveKey
        ? await braveSearchBroad(message, 6)
        : await freeRssSearch(message, 6);
      if (results?.length) {
        webSearchBlock = formatSearchResultsBlock(results, message);
        console.log(`[explorerSearch] ${results.length} results for: "${message.slice(0, 60)}"`);
      }
    } else {
      // CSO query — always search even if shouldWebSearch is false;
      // scoped to ADGM-relevant financial/regulatory sources
      const results = await smartSearch(message, 5);
      if (results?.length) {
        webSearchBlock = formatSearchResultsBlock(results, message);
        console.log(`[csoWebSearch] ${results.length} results for: "${message.slice(0, 60)}"`);
      }
    }
  } catch (err) {
    console.warn('[webSearch] skipped:', err?.message);
  }

  // Build system prompt — inject web search results if available
  const systemPrompt = buildSystemPrompt(
    { ...context, webSearchBlock: webSearchBlock || undefined },
    language,
  );

  const messages = [
    ...history
      .filter((m) => m?.role && m?.content)
      .map((m) => ({
        role: m.role === 'assistant' || m.role === 'ai' ? 'assistant' : 'user',
        content: String(m.content),
      })),
    { role: 'user', content: message.trim() },
  ];

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    let detail = errText || anthropicRes.statusText;
    try {
      const parsed = JSON.parse(errText);
      detail = parsed?.error?.message || parsed?.message || detail;
    } catch {
      /* raw text */
    }
    throw new Error(detail);
  }

  if (!anthropicRes.body) {
    throw new Error('No response body from Claude');
  }

  const reader = anthropicRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') continue;
      let evt;
      try {
        evt = JSON.parse(raw);
      } catch {
        continue;
      }
      if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
        writeEvent({ type: 'token', text: evt.delta.text });
      }
      if (evt.type === 'message_stop') {
        writeEvent({ type: 'done', model });
      }
    }
  }
  writeEvent({ type: 'done', model });
}

/** Netlify / Web — returns SSE Response */
export async function createChatHttpResponse(request) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const writeEvent = (obj) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };
        try {
          await streamChat(payload, writeEvent);
        } catch (err) {
          writeEvent({ type: 'error', message: err?.message || 'Stream failed' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const status = err.message?.includes('ANTHROPIC_API_KEY') ? 503 : 500;
    return new Response(JSON.stringify({ error: err.message }), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Shared Claude chat streaming — used by dev-api and Netlify Functions.
 */

import { ANSWER_FORMAT_RULES } from './answerFormatRules.mjs';
import {
  CSO_GLOBAL_SYSTEM_PROMPT,
  CSO_ORCHESTRATOR_PROMPT,
  CSO_SOURCE_CONFIDENCE_RULES,
  buildBriefingTemplateBlock,
  buildOutputContractBlock,
  buildSpecialistPromptBlocks,
} from './csoPromptPack.mjs';
import {
  falconExcerptsToGroundedRecords,
  formatFalconExcerptBlock,
  retrieveFalconExcerpts,
} from './kb/falconKb.mjs';
import { buildGroundedRecordsFromContext, formatGroundedContextBlock } from './sourceHandles.mjs';
import { formatGstClock, greetingForGstTime } from './gstGreeting.mjs';
import { smartSearch, braveSearchBroad, freeRssSearch, formatSearchResultsBlock, shouldWebSearch } from './webSearch.mjs';

export function normalizeAnthropicApiKey(raw) {
  if (!raw) return '';
  let key = String(raw).trim().replace(/^\uFEFF/, '');
  key = key.replace(/^ANTHROPIC_API_KEY\s*=\s*/i, '');
  key = key.replace(/^['"]|['"]$/g, '').replace(/\s+/g, '');
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key;
}

/** Real Anthropic keys are sk-ant-…; Netlify often gets a JWT or OAuth token by mistake. */
export function isPlausibleAnthropicApiKey(apiKey) {
  const key = normalizeAnthropicApiKey(apiKey);
  return Boolean(key && key.startsWith('sk-ant-') && key.length >= 40 && key.length <= 200);
}

export function describeAnthropicKeyProblem(apiKey) {
  const key = normalizeAnthropicApiKey(apiKey);
  if (!key) return 'ANTHROPIC_API_KEY is not set.';
  if (key.startsWith('eyJ')) {
    return 'ANTHROPIC_API_KEY looks like a JWT/session token (starts with eyJ…), not an Anthropic API key. Use an sk-ant-… key from console.anthropic.com.';
  }
  if (!key.startsWith('sk-ant-')) {
    return 'ANTHROPIC_API_KEY must start with sk-ant- (from console.anthropic.com → API Keys).';
  }
  if (key.length > 200) {
    return 'ANTHROPIC_API_KEY is too long — paste only the sk-ant-… key, not JSON or a full env file.';
  }
  return null;
}

export function anthropicKeyFingerprint(apiKey) {
  const key = normalizeAnthropicApiKey(apiKey);
  if (!key) return null;
  return {
    length: key.length,
    prefix: key.slice(0, 12),
    suffix: key.slice(-4),
    plausible: isPlausibleAnthropicApiKey(key),
  };
}

export function getAnthropicConfig() {
  const model = String(process.env.ANTHROPIC_MODEL || '').trim();
  return {
    apiKey: normalizeAnthropicApiKey(process.env.ANTHROPIC_API_KEY),
    model: model || 'claude-sonnet-4-6',
  };
}

/** Lightweight key check — used by /api/health?verify=1 (does not stream). */
export async function verifyAnthropicApiKey() {
  const { apiKey, model } = getAnthropicConfig();
  if (!apiKey) return { status: 'missing' };

  const formatProblem = describeAnthropicKeyProblem(apiKey);
  if (formatProblem) {
    return { status: 'invalid_format', httpStatus: 401, detail: formatProblem };
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1,
      messages: [{ role: 'user', content: 'ping' }],
    }),
  });

  if (res.ok) return { status: 'ok' };

  const errText = await res.text();
  const invalid =
    res.status === 401 ||
    res.status === 403 ||
    /authentication_error|invalid x-api-key/i.test(errText);
  return {
    status: invalid ? 'invalid' : 'error',
    httpStatus: res.status,
  };
}


export function buildSystemPrompt(ctx, language) {
  const ar = language === 'ar';
  const firstName = ctx?.executiveFirstName ?? 'Mohammad';
  const gstGreeting = ctx?.gstGreeting ?? greetingForGstTime('en');

  // ── GREETING: scripted opener ONLY on the very first message of a conversation.
  // Mid-conversation greetings get a natural, memory-aware reply so chat stays seamless.
  if (ctx?.conversationalMode === 'greeting') {
    if (!ctx?.historyLength) {
      return `You are the CEO Personal AI Assistant for ${firstName}.
Your ONLY task right now is to reply with EXACTLY this single sentence — nothing more, nothing less:
${gstGreeting}, ${firstName}. I am your Personal AI Agent. How can I help you today?
Do NOT add any other text. Do NOT summarise calendar or actions. Do NOT ask follow-up questions. Output that one sentence and stop.`;
    }
    return `You are the CEO Personal AI Assistant for ${firstName}.
The user greeted you mid-conversation. Reply naturally and warmly in 1–2 short sentences.
Use the conversation history (memory) — if there is an open thread, you may briefly offer to continue it.
Do NOT restart the conversation, do NOT repeat the scripted opener, do NOT summarise calendar or actions.`;
  }

  // ── DAILY CATCH-UP: structured day opener with markets, actions (+ calendar if connected) ──
  if (ctx?.conversationalMode === 'catchup') {
    const gstClock = ctx?.gstTimeLabel ?? 'GST';
    const calConnected = ctx?.calendarConnected === true;
    return `You are the CEO Personal AI Assistant for ${firstName}.
The user wants a concise daily catch-up (${gstClock}).

Reply in clear markdown:
1. Warm greeting with correct time-of-day for Dubai (GST).
2. One short "In plain terms" blockquote (one sentence).
3. **What's happened today** as a bold heading, then bullets for ${calConnected ? 'Markets / Teams / Actions / Next meeting' : 'Markets / Teams / Actions'}.
4. Cite only handles present in context ([MKT-…], [ACT-…]${calConnected ? ', [CAL-…]' : ''}). Do not invent facts.
${calConnected ? '' : `5. CALENDAR NOT CONNECTED: do NOT mention meetings or a "next meeting" — no calendar is connected. Add one short closing line: "Connect your calendar and I'll include your meetings here too."
`}6. Do not duplicate "GCC" if the market snapshot already includes it.
7. ~100–140 words. End with ONE natural offer to help further.
8. No sample prompts, no agent roster footer, no "Sources:" block at the end.`;
  }

  // ── GENERAL KNOWLEDGE FALLBACK: answer like a capable AI assistant ──
  if (ctx?.conversationalMode === 'irrelevant') {
    return `You are the Personal AI Assistant for ${firstName} at ${ctx?.organisation || 'A.R.M. Holding'}.
The user has asked a general knowledge question outside the specialist CSO scope, but you are still a highly capable AI — answer helpfully and accurately from your training knowledge, exactly as a knowledgeable assistant would.
- Be concise, clear and friendly.
- Stay in your persona as the Personal AI Assistant.
- Do NOT say "outside my scope" or refuse to answer.
- If the answer may be time-sensitive or the user would benefit from latest info, add a brief note: "(Verify for the most current data.)"
- You may briefly offer to also help with strategy, market intel, policy or executive comms if relevant.`;
  }

  // ── THANKS: return a minimal prompt ──
  if (ctx?.conversationalMode === 'thanks') {
    return `You are the CEO Personal AI Assistant for ${firstName}. Reply with one warm, brief sentence thanking them and offering to help further. Nothing else.`;
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
    // Always check the internal KB first — even for Explorer queries — so KB-relevant
    // questions are grounded before falling back to web / training knowledge.
    const explorerKbExcerpts =
      ctx?.falconExcerpts?.length > 0
        ? ctx.falconExcerpts
        : userQ
          ? retrieveFalconExcerpts(userQ)
          : [];
    const explorerKbBlock = explorerKbExcerpts.length
      ? `\n\n${formatFalconExcerptBlock(explorerKbExcerpts)}`
      : '';
    return `You are the Personal AI Assistant for ${firstName}. You have live web search capability and can answer ANY question — general knowledge, live prices, news, science, geography, definitions, anything.
${langNote}

SOURCE PRIORITY — always follow this order:
1. Conversation memory: check the conversation history first — resolve follow-ups, pronouns ("it", "that one"), and reuse facts or preferences the user already shared.
2. Internal KB: if KB excerpts are injected below, answer from them first and cite their handles (KB-…).
3. Live web search results: injected below if available. Extract the specific answer — price, rate, fact, news — and state it directly. Cite as [WEB-01], [WEB-02] etc. with URL.
4. Training knowledge: use freely and confidently for any general question.

CRITICAL RULES — every response must follow these:
- NEVER say "I don't have live market data" — that phrase is FORBIDDEN for Explorer AI.
- NEVER say "I can't browse the internet" or "I don't have web access."
- NEVER just list websites for the user to check without giving your own answer first.
- For price/rate questions (gold, oil, currencies, crypto, stocks, commodities):
  • If web results contain price data → extract and state the price directly with source + date.
  • If no web results → give your best training-knowledge estimate, e.g. "Gold is currently trading around $X,XXX–$X,XXX per troy oz — verify for exact current rate at kitco.com or xe.com". ALWAYS give a concrete number first.
- For any factual question → answer confidently. Add "(verify for latest)" inline only if time-sensitive.

If the user's message is a vague search request with NO specific topic (e.g. "can you check the internet", "search online", "look it up"), reply with exactly:
"Sure! What would you like me to look up? Just tell me the topic or question and I'll search it for you."
Do NOT add anything else in that case.

For all other questions:
- Answer directly and concisely — like a knowledgeable assistant, not a strategy advisor.
- NEVER ask clarifying questions when a reasonable interpretation exists — assume the most likely meaning, answer, and add one short "tell me if you meant something else" line only if truly ambiguous.
- Do NOT use executive sections: no "Executive Takeaway", "Source Basis", "Strategic Implication", or any CSO structure.
- Do NOT add follow-up suggestions or A.R.M. Holding-related prompts at the end.
- If web results are injected, cite them inline.
${hasWebResults
  ? '✅ Web search results injected below — extract the concrete answer and state it directly.'
  : '⚠️ No live web results this turn — answer from training knowledge with full confidence. Always give a direct answer; add "(verify for current data)" only for time-sensitive facts like live prices.'}${explorerKbBlock}${webBlock}`;
  }

  // KB-FIRST: always run KB retrieval for every query (not just regex-matched ones).
  // Retrieval is relevance-scored, so unrelated questions simply return no excerpts.
  const falconExcerpts =
    ctx?.falconExcerpts?.length > 0
      ? ctx.falconExcerpts
      : userQ
        ? retrieveFalconExcerpts(userQ)
        : [];

  let groundedRecords =
    Array.isArray(ctx?.groundedRecords) && ctx.groundedRecords.length > 0
      ? [...ctx.groundedRecords]
      : buildGroundedRecordsFromContext(ctx);

  // CALENDAR HONESTY: unless a real calendar integration is connected, strip CAL-
  // records so the model cannot present demo meetings as the user's actual schedule.
  const calendarConnected = ctx?.calendarConnected === true;
  if (!calendarConnected) {
    groundedRecords = groundedRecords.filter((r) => {
      const handle = String(r?.handle || '');
      if (handle.startsWith('CAL-')) return false;
      // Also drop meeting-derived records (e.g. CRM stubs that reference CAL- handles)
      const text = JSON.stringify(r);
      return !/CAL-\d/.test(text);
    });
  }

  if (falconExcerpts.length) {
    const existing = new Set(groundedRecords.map((r) => r.handle));
    for (const rec of falconExcerptsToGroundedRecords(falconExcerpts)) {
      if (!existing.has(rec.handle)) groundedRecords.push(rec);
    }
  }

  const hasGrounding = groundedRecords.length > 0;
  const falconKbMandatory = falconExcerpts.length
    ? `
══════════════════════════════════════════
FALCON / INSTITUTIONAL KB — MANDATORY (overrides clarifying questions)
══════════════════════════════════════════
AUTHORITATIVE KB EXCERPTS are injected this turn (D33 alignment [KB-006], Falcon Strategy [KB-007], A.R.M. Holding archive, etc.).
- Answer IMMEDIATELY from those excerpts — synthesize a clear executive summary.
- NEVER ask which Falcon document the user means. NEVER say the KB lacks Falcon Strategy or D33 alignment.
- If the user says "Falcon strategy" (or a typo like "stratgey"), lead with [KB-007] Falcon Strategy Executive Summary; cross-reference [KB-006] D33 alignment 2025–2045 where relevant.
- Cite inline handles with source URLs. Grounding: full when excerpts cover the question.
`
    : '';
  const groundedBlock =
    formatGroundedContextBlock(groundedRecords) +
    (falconExcerpts.length ? formatFalconExcerptBlock(falconExcerpts) : '') +
    falconKbMandatory;

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
  // Briefings use their dedicated mandatory template; chat uses the query-inferred contract
  const briefingTemplate = isBriefing ? buildBriefingTemplateBlock(ctx?.briefingFormat) : null;
  const contractBlock = briefingTemplate ?? buildOutputContractBlock(ctx?.userQuestion ?? '');
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
Executive: ${ctx?.executiveName || 'H.E. Mohammad Saeed Al Shehhi'}, Chief Executive Officer, ${ctx?.organisation || 'A.R.M. Holding'}.

${CSO_ORCHESTRATOR_PROMPT}

${CSO_SOURCE_CONFIDENCE_RULES}

${isBriefing ? `You are generating a **${formatLabel}** briefing (not casual chat). Scan in under 2 minutes. No generic closings.` : ''}

${ANSWER_FORMAT_RULES}

═══════════════════════════════════════════════════════
OUTPUT FORMAT — ADAPTIVE (match depth to the question)
═══════════════════════════════════════════════════════
FIRST decide the response style:

A) CONVERSATIONAL / SIMPLE — short factual questions, quick follow-ups, clarifications,
   casual remarks, yes/no questions, or anything answerable in a few sentences.
   → Reply naturally and concisely like a capable assistant. NO mandatory sections,
   NO "Executive Takeaway" structure. Cite source handles inline only if you used them.
   Keep the conversation flowing seamlessly.

B) SUBSTANTIVE / ANALYTICAL — briefings, strategy questions, comparisons, regulatory
   analysis, document summaries, meeting prep, or any multi-part executive request.
   → Use the EXACT bold section headings listed below, in the EXACT order shown.
   Do NOT rename sections. Do NOT skip any section. Do NOT merge sections. Do NOT add new sections.
   Complete every section fully before moving to the next.

${isBriefing ? `THIS TURN IS A **${formatLabel}** BRIEFING — ALWAYS style B with the FULL template below, no exceptions.
The briefing template below OVERRIDES everything else: ignore any specialist agent "Default response structure" (e.g. the Communications AI "Draft Output → Tone Used → Key Messages" structure), and any other output contract. Use ONLY the numbered sections of the briefing template.
NEVER ask a clarifying question in a briefing — the user has already provided their content. Work with what is given and label assumptions.
Grounding for briefings: the user-pasted content FIRST, then internal KB / grounded records (cite handles); injected live web results for external facts (cite [WEB-NN]); label assumptions where source coverage is thin. Never invent figures.` : ''}

${contractBlock}

═══════════════════════════════
CONVERSATION MEMORY — CHECK FIRST (every turn)
═══════════════════════════════
The full recent conversation history is provided in the messages. Before answering:
- Resolve follow-ups, pronouns and references ("it", "that report", "the second one") from earlier turns.
- Reuse facts, preferences, names and decisions the user already shared — never ask for them again.
- If the new question builds on a previous answer, continue from it instead of starting over.

MINIMAL QUESTIONS RULE (mandatory — keeps chat seamless):
- Default to ANSWERING, never to asking. Make reasonable professional assumptions and state them in one short line.
- Ask a clarifying question ONLY if the request is impossible to interpret even with memory + KB + web results — and then ask exactly ONE short question, nothing else.
- NEVER stack multiple questions, NEVER end routine answers with questions back to the user, and NEVER ask permission to proceed ("Would you like me to…?") — just do it.

═══════════════════════════════
DELEGATED SPECIALISTS THIS TURN
═══════════════════════════════
Primary lead: **${primary}**
${delegation}

${specialistBlock}
${userQuestionBlock}
Language: ${ar ? 'Modern Standard Arabic unless the user writes in English.' : 'Clear English for a non-expert reader unless the user writes in Arabic.'}
${isBriefing ? 'Output only the briefing body.' : 'End with a **Follow-up** section: exactly 2–3 specific action-oriented bullets. Do NOT add trailing Sources:, Grounding:, or **Sources Used** footers — cite handles inline only; the UI shows source chips separately.'}

═══════════════════════════════
GROUNDED SOURCE RECORDS (cite ONLY these handles)
═══════════════════════════════

${groundedBlock}

${ctx?.webSearchBlock ? ctx.webSearchBlock : ''}

SOURCE CITATION FORMAT (mandatory for every response):
When citing a KB source inline, include the handle and real URL from the excerpt header where helpful. Example:
  [KB-006] D33 alignment Strategy 2025–2045 | added.gov.ae | /kb/20240923_FalconEconomy-Eng.pdf
Do NOT duplicate citations in a trailing Sources / Grounding / Sources Used footer — the app renders source chips below the answer automatically.

DATA INTEGRITY — TIERED ANSWERING (mandatory, in this order):

TIER 0 — CONVERSATION MEMORY:
Always check the conversation history first. If the answer (or part of it) was already established earlier in this conversation, build on it.

TIER 1 — INTERNAL KB / GROUNDED RECORDS (highest source priority):
${hasGrounding
  ? '✅ Grounded records ARE injected this turn. Cite handles inline (KB-, MKT-, CAL-, ACT-, CRM-, BBG-). Do NOT invent licence growth %, Falcon scores, market prices, or A.R.M. Holding legal clauses. For market figures: add "as of [date], Source: Yahoo Finance / CoinGecko".'
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
The source rules and "do not invent" rules in this prompt apply ONLY to A.R.M. Holding-specific internal facts:
  - Internal KPIs, targets, or performance numbers
  - Official A.R.M. Holding/RERA positions or decisions
  - Private meeting details or stakeholder commitments
  - Unpublished internal documents or strategies

They do NOT apply to general world knowledge. For any question about:
  - Geography, places, landmarks, directions (e.g. "where is the Gold Souk in Dubai")
  - History, science, culture, general business concepts
  - Public facts about countries, companies, people, events
  - How-to questions, definitions, explanations
→ Answer immediately and helpfully from training knowledge. Do NOT treat these as "missing source material." This is mandatory.

If you know the answer from general knowledge, give it. Only flag missing data for facts that are genuinely A.R.M. Holding-internal and cannot be known without an approved source.

${calendarConnected
  ? '- Calendar (CAL- handles) is CONNECTED — cite meeting records freely.'
  : `- CALENDAR NOT CONNECTED (mandatory): No calendar integration is connected this turn. NEVER invent, assume, or describe meetings, schedules, attendees, or meeting times from a "calendar". NEVER cite CAL- handles. If the user asks what's on their calendar/schedule today, say plainly: "Your calendar isn't connected yet, so I can't see your meetings. Once it's connected I can brief you before every meeting." Then offer what you CAN do (briefings from KB, market intel, drafting).
  EXCEPTION: if the user PROVIDES meeting details themselves (agenda, invite text, attendees, email trail, briefing request with meeting context in the message), treat that as user-provided context and brief on it fully — the restriction only forbids claiming access to a live calendar.`}

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
- Falcon / A.R.M. Holding Law questions: use KB-006–KB-015 excerpts if available; otherwise answer from general knowledge.

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
  const keyProblem = describeAnthropicKeyProblem(apiKey);
  if (keyProblem) {
    throw new Error(keyProblem);
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
  // - Explorer (general / outside-A.R.M. Holding): broad unscoped search for any topic.
  // - CSO agents (A.R.M. Holding-specific): scoped search on approved financial/regulatory sources.
  // Internal KB / grounded records are injected via the system prompt separately;
  // Claude is instructed to prefer KB for A.R.M. Holding-internal facts and use web for the rest.
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
      // scoped to A.R.M. Holding-relevant financial/regulatory sources
      const results = await smartSearch(message, 5);
      if (results?.length) {
        webSearchBlock = formatSearchResultsBlock(results, message);
        console.log(`[csoWebSearch] ${results.length} results for: "${message.slice(0, 60)}"`);
      }
    }
  } catch (err) {
    console.warn('[webSearch] skipped:', err?.message);
  }

  // Build system prompt — inject web search results + history length (memory awareness)
  const historyLength = history.filter((m) => m?.role && m?.content).length;
  const systemPrompt = buildSystemPrompt(
    { ...context, webSearchBlock: webSearchBlock || undefined, historyLength },
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

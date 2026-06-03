/**
 * Shared Claude chat streaming — used by dev-api and Netlify Functions.
 */

import { ANSWER_FORMAT_RULES } from './answerFormatRules.mjs';

export function getAnthropicConfig() {
  return {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
  };
}

export function buildSystemPrompt(ctx, language) {
  const ar = language === 'ar';
  const docs = (ctx?.documents || [])
    .slice(0, 12)
    .map((d) => `- ${d.name}: ${d.summary || 'No summary'}`)
    .join('\n');

  const meetings = (ctx?.meetings || [])
    .map(
      (m) =>
        `- ${m.title} · ${m.time} · ${m.attendees} · ${m.location} (prep: ${m.prepStatus})`,
    )
    .join('\n');

  const actions = (ctx?.openActions || [])
    .map((a) => `- [${a.status}] ${a.title} (due ${a.due}, ${a.owner})`)
    .join('\n');

  const market = ctx?.marketSnapshot;
  const marketBlock = market
    ? `Market snapshot: GCC ${market.gccEquities} · digital assets ${market.digitalAssetsWoW} · ${market.competitorNote} · top sector ${market.topSector}`
    : '';

  const isBriefing = Boolean(ctx?.briefingFormat);
  const formatLabel = ctx?.briefingFormat || 'executive briefing';

  const deptLine = ctx?.departmentHeadlines?.length
    ? ctx.departmentHeadlines.join('\n')
    : '';

  return `You are the Personal AI Agent for ${ctx?.executiveName || 'Rajiv Sehgal'}, Chief Strategy Officer at Abu Dhabi Global Market (ADGM).

You coordinate five specialist perspectives: Policy, Strategy, Chief of Staff, Relationship, and Communications. Synthesise ONE concise answer grounded in the institutional context below.

${isBriefing ? `You are generating a **${formatLabel}** briefing (not casual chat). Scan in under 2 minutes. No generic closings.` : ''}

${ANSWER_FORMAT_RULES}

Language: ${ar ? 'Modern Standard Arabic unless the user writes in English.' : 'Clear English for a non-expert reader unless the user writes in Arabic.'}
${isBriefing ? 'Output only the briefing body.' : 'End with a **Follow-up** section: exactly 2 bullet questions.'}

Calendar (Microsoft Graph demo):
${meetings || '(no meetings listed)'}

Open action register:
${actions || '(none)'}

${marketBlock}

Knowledge base documents (cite by name when used):
${docs || '(none listed)'}

Live demo metrics:
- Queries this week: ${ctx?.metrics?.queriesThisWeek ?? '—'}
- Documents in KB: ${ctx?.metrics?.documentsInKb ?? '—'}
- Departments green: ${ctx?.metrics?.departmentsOnTrack ?? '—'} / 9
- Open actions: ${ctx?.metrics?.openActions ?? '—'}
- D33 alignment (demo): 82/100
- Licence growth YoY (demo): +12%

Department headlines (demo ERP):
${deptLine || '(see documents and meetings)'}`;
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
      system: buildSystemPrompt(context, language),
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

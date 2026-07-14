/**
 * DocAI — executive document generation via Bedrock Agent (preferred) or Claude.
 * Bedrock agents have shorter completion budgets than Claude Messages, so we:
 *  1) Generate a compact complete JSON document (5–6 sections)
 *  2) Optionally expand section bodies in a second call
 */
import { handleSlideAiRequest, sanitizeJsonText } from './slideAi.mjs';
import { getAnthropicConfig } from './chatCore.mjs';
import {
  getBedrockAgentConfig,
  invokeBedrockAgentCompletion,
  resolveChatProvider,
} from './bedrockAgent.mjs';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

const BEDROCK_DOC_SYSTEM = `You are DocAI for DMCC (Dubai Multi Commodities Centre) CEO Agent.
Produce CEO-grade Word documents as RAW JSON only (no markdown fences, no prose outside JSON).
Never invent unverified financial figures — use [REQUIRES INPUT: …] for missing facts.
Brand: DMCC navy #070047, pink #E21F7B, gold #C9A84C, tagline "Where the world does business".`;

function lastUserContent(messages) {
  for (let i = (messages || []).length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user') return String(messages[i].content || '').trim();
  }
  return '';
}

function buildCreatePrompt(userBrief) {
  return `${BEDROCK_DOC_SYSTEM}

Return ONE compact JSON object, fully closed, under 3500 characters:

{"action":"create","message":"short chat reply","document":{"id":"doc-…","title":"…","docType":"…","purpose":"…","audience":"…","style":"dmcc-brand","status":"draft","summary":"2 sentences","estimatedPages":5,"sections":[{"id":"sec-1","title":"…","kind":"cover|summary|analysis|recommendation|decision|other","body":"markdown 40-80 words"}],"sources":["User brief"],"brandCheck":["DMCC brand"],"createdAt":"ISO-8601","updatedAt":"ISO-8601","version":1},"updatedSections":null}

Rules:
- Exactly 5 or 6 sections (Cover, Executive Summary, Context/Performance, Analysis/Findings, Recommendations, Decision & Next Steps)
- Each body complete sentences / bullets — not TBD
- Close every brace and quote

USER BRIEF:
${userBrief}

JSON only:`;
}

function buildExpandPrompt(document) {
  const skeleton = {
    id: document.id,
    title: document.title,
    sections: (document.sections || []).map((s) => ({
      id: s.id,
      title: s.title,
      kind: s.kind,
      bodyPreview: String(s.body || '').slice(0, 120),
    })),
  };
  return `${BEDROCK_DOC_SYSTEM}

Expand this DMCC document. Return ONLY JSON:
{"action":"update","message":"Sections expanded.","document":null,"updatedSections":[{"id":"…","title":"…","kind":"…","body":"richer markdown 80-140 words"}]}

Update EVERY section id below with fuller CEO-grade markdown. Keep under 4000 characters and close the JSON.

DOCUMENT:
${JSON.stringify(skeleton)}

JSON only:`;
}

function buildMessageOrUpdatePrompt(system, messages) {
  const transcript = (messages || [])
    .slice(-4)
    .map((m) => `${String(m.role || 'user').toUpperCase()}:\n${String(m.content || '').trim().slice(0, 4000)}`)
    .join('\n\n---\n\n');
  return `${BEDROCK_DOC_SYSTEM}

Also follow:
${String(system || '').slice(0, 2500)}

Return RAW JSON only for DocAI (action message|update|create|preview). Keep under 3500 characters and close the JSON.

CONVERSATION:
${transcript}

JSON only:`;
}

function scrubControlCharsInStrings(text) {
  let out = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\' && inString) {
      out += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }
    if (inString) {
      if (ch === '\n') {
        out += '\\n';
        continue;
      }
      if (ch === '\r') {
        out += '\\r';
        continue;
      }
      if (ch === '\t') {
        out += '\\t';
        continue;
      }
      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        out += `\\u${code.toString(16).padStart(4, '0')}`;
        continue;
      }
    }
    out += ch;
  }
  return out;
}

function repairDocJson(raw) {
  let text = scrubControlCharsInStrings(sanitizeJsonText(raw));
  try {
    JSON.parse(text);
    return text;
  } catch {
    /* continue */
  }

  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') inString = !inString;
  }
  if (inString) text += '"';
  text = text.replace(/,\s*$/, '');
  const openArr = (text.match(/\[/g) || []).length - (text.match(/\]/g) || []).length;
  const openObj = (text.match(/\{/g) || []).length - (text.match(/\}/g) || []).length;
  if (openArr > 0) text += ']'.repeat(Math.min(openArr, 40));
  if (openObj > 0) text += '}'.repeat(Math.min(openObj, 40));
  text = scrubControlCharsInStrings(text);

  try {
    JSON.parse(text);
    return text;
  } catch {
    return text;
  }
}

function parseDocPayload(raw) {
  const clean = repairDocJson(raw);
  const parsed = JSON.parse(clean);
  return { clean, parsed };
}

async function bedrockJson(prompt) {
  const result = await invokeBedrockAgentCompletion(prompt);
  const { clean, parsed } = parseDocPayload(result.text);
  return { ...result, text: clean, parsed };
}

async function handleDocAiViaBedrock(body) {
  const messages = body?.messages;
  const system = body?.system;
  if (!Array.isArray(messages) || !system) {
    return { ok: false, status: 400, error: 'messages and system are required' };
  }
  if (messages.length > 24) {
    return { ok: false, status: 400, error: 'Too many messages (max 24)' };
  }

  const mode = body?.mode === 'update' ? 'update' : 'create';
  const userBrief = lastUserContent(messages);

  try {
    // Create path: compact generate → optional expand
    if (mode === 'create' || /generate|create|full document|go ahead/i.test(userBrief)) {
      const created = await bedrockJson(buildCreatePrompt(userBrief));
      if (!created.parsed?.document?.sections?.length) {
        return {
          ok: false,
          status: 422,
          error: 'Bedrock returned JSON without document sections.',
        };
      }

      // Best-effort expansion (ignore failures — compact doc still usable)
      try {
        const expanded = await bedrockJson(buildExpandPrompt(created.parsed.document));
        if (Array.isArray(expanded.parsed?.updatedSections) && expanded.parsed.updatedSections.length) {
          const byId = new Map(
            expanded.parsed.updatedSections.map((s) => [s.id, s]),
          );
          created.parsed.document.sections = created.parsed.document.sections.map((s) => {
            const richer = byId.get(s.id);
            if (!richer?.body) return s;
            return {
              ...s,
              title: richer.title || s.title,
              kind: richer.kind || s.kind,
              body: richer.body,
            };
          });
          created.parsed.action = 'create';
          created.parsed.updatedSections = null;
          created.parsed.message =
            expanded.parsed.message || created.parsed.message || 'Document created.';
          return {
            ok: true,
            text: JSON.stringify(created.parsed),
            model: created.model,
            provider: 'bedrock',
          };
        }
      } catch (expandErr) {
        console.warn('[DocAI] expand pass skipped:', expandErr?.message || expandErr);
      }

      return {
        ok: true,
        text: created.text,
        model: created.model,
        provider: 'bedrock',
      };
    }

    // Update / message path
    const result = await bedrockJson(buildMessageOrUpdatePrompt(system, messages));
    return {
      ok: true,
      text: result.text,
      model: result.model,
      provider: 'bedrock',
    };
  } catch (err) {
    const msg = err?.message || String(err);
    if (/JSON|Unexpected token|parse/i.test(msg)) {
      console.error('[DocAI/Bedrock] JSON parse failed:', msg);
      return {
        ok: false,
        status: 422,
        error:
          'Document JSON could not be parsed from Bedrock. Try Generate Document again with a shorter brief.',
      };
    }
    return { ok: false, status: 502, error: msg };
  }
}

export async function handleDocAiRequest(body) {
  if (body?.probe === true) {
    const bedrock = getBedrockAgentConfig();
    const { apiKey } = getAnthropicConfig();
    if (bedrock.configured || apiKey) {
      return {
        ok: true,
        status: 200,
        text: '{"probe":true}',
        model: 'probe',
        provider: bedrock.configured ? 'bedrock' : 'anthropic',
      };
    }
    return {
      ok: false,
      status: 503,
      error:
        'DocAI not configured — set Bedrock AWS keys (BEDROCK_AGENT_*) or ANTHROPIC_API_KEY',
    };
  }

  const provider = resolveChatProvider();
  if (provider === 'bedrock' && getBedrockAgentConfig().configured) {
    const bedrockResult = await handleDocAiViaBedrock(body);
    if (bedrockResult.ok) return bedrockResult;
    // Prefer Bedrock-only when explicitly selected — Anthropic credits are often exhausted.
    const allowAnthropicFallback =
      String(process.env.DOCAI_ALLOW_ANTHROPIC_FALLBACK || '').toLowerCase() === 'true';
    const { apiKey } = getAnthropicConfig();
    if (!allowAnthropicFallback || !apiKey) return bedrockResult;
    console.warn('[DocAI] Bedrock failed, falling back to Anthropic:', bedrockResult.error);
  }

  return handleSlideAiRequest(body);
}

export async function createDocAiHttpResponse(request) {
  const cors = corsHeaders();

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const result = await handleDocAiRequest(body);
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: result.status || 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (body?.probe === true) {
    return new Response(JSON.stringify({ ok: true, provider: result.provider || 'ok' }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ text: result.text, model: result.model, provider: result.provider }),
    {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    },
  );
}

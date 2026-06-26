/**
 * SlideAI — server-side Claude agent (keeps ANTHROPIC_API_KEY off the browser).
 *
 * JSON reliability stack (applied in order):
 *  1. JSON_ENFORCEMENT block   — system-prompt instruction to emit raw JSON
 *  2. sanitizeJsonText()       — server strips any residual fences + salvages truncation
 *
 * This means the client always receives either valid JSON text or a structured
 * error — it never has to guess whether the response is fenced or truncated.
 */
import { getAnthropicConfig } from './chatCore.mjs';

// ─── Config ───────────────────────────────────────────────────────────────────

function extractText(data) {
  return data.content?.find((b) => b.type === 'text')?.text || '';
}

export function getSlideAiConfig(mode = 'create') {
  const base = getAnthropicConfig();
  const model = process.env.SLIDEAI_ANTHROPIC_MODEL || 'claude-opus-4-8';
  return {
    apiKey: base.apiKey,
    model,
    // claude-opus-4-8 supports up to 32k output tokens natively.
    // 16k is sufficient for a 12-slide deck with tables + short speaker notes.
    maxTokens: mode === 'update' ? 8192 : 16000,
  };
}

// ─── System prompt enforcement ────────────────────────────────────────────────

const JSON_ENFORCEMENT = `

══════════════════════════════════
CRITICAL OUTPUT RULE — READ FIRST
══════════════════════════════════
You MUST respond with raw JSON only. This is non-negotiable.

EXACT OUTPUT FORMAT:
- Your ENTIRE response must be a single valid JSON object
- The very FIRST character must be { (open curly brace)
- The very LAST character must be } (close curly brace)
- ABSOLUTELY NO text before the opening {
- ABSOLUTELY NO text after the closing }
- NEVER use markdown code fences (\`\`\`json or \`\`\`)
- NEVER write "Here is the deck:" or any prose outside the JSON
- NEVER add comments inside the JSON

VALID RESPONSE (starts exactly like this):
{"action":"create","deck":{...},"updatedSlides":null,"message":null}

INVALID RESPONSES (all forbidden):
\`\`\`json { ... } \`\`\`
Here is your deck: { ... }
{ ... } Here are some notes.

FALLBACK (only if you truly cannot generate the deck):
{"action":"message","deck":null,"updatedSlides":null,"message":"Unable to generate deck — please rephrase your request."}
`;

// ─── Server-side JSON sanitiser ───────────────────────────────────────────────
//
// Runs on the raw model output BEFORE sending to the client.
// Three-pass recovery so the browser always receives parseable text:
//   Pass 1 — strip markdown code fences (```json … ```)
//   Pass 2 — locate the outermost { … } block
//   Pass 3 — close unclosed brackets/braces left by a truncated response
//
function sanitizeJsonText(raw) {
  let text = raw.trim();

  // ── Pass 1: strip code fences ──────────────────────────────────────────────
  if (!text.startsWith('{') && text.includes('`')) {
    const lines = text.split('\n');
    const openIdx = lines.findIndex((l) => l.trimStart().startsWith('```'));
    if (openIdx >= 0) {
      const body = lines.slice(openIdx + 1);
      // Find closing fence (first line that is exactly ```)
      const closeIdx = body.findIndex((l) => l.trim() === '```');
      const jsonLines = closeIdx >= 0 ? body.slice(0, closeIdx) : body;
      text = jsonLines.join('\n').trim();
    }
  }

  // ── Pass 2: find outermost JSON object ────────────────────────────────────
  if (!text.startsWith('{')) {
    const start = text.indexOf('{');
    if (start >= 0) {
      text = text.slice(start);
    } else {
      // Nothing recoverable
      return raw;
    }
  }

  // ── Pass 3: salvage truncated JSON ────────────────────────────────────────
  if (!text.trimEnd().endsWith('}')) {
    const lines = text.split('\n');

    // Drop the last line if it looks like a partial/incomplete value:
    // a line that ends mid-string, mid-number, or has a trailing comma after
    // a structural element.
    const lastLine = lines[lines.length - 1].trimEnd();
    const looksIncomplete =
      lastLine !== '' &&
      !lastLine.endsWith('}') &&
      !lastLine.endsWith(']') &&
      !lastLine.endsWith('"') &&
      !lastLine.endsWith(',');
    if (looksIncomplete) {
      lines.pop();
      text = lines.join('\n');
    }

    // Remove any trailing comma before we close (JSON forbids trailing commas)
    text = text.replace(/,(\s*)$/, '$1');

    // Count unclosed brackets and braces.
    // Note: this is a heuristic — curly braces inside JSON string values would
    // throw off the count, but for slide deck content (titles, bullets, table
    // cells) this is extremely rare and the salvage is better than nothing.
    const openArr = (text.match(/\[/g) || []).length - (text.match(/\]/g) || []).length;
    const openObj = (text.match(/\{/g) || []).length - (text.match(/\}/g) || []).length;

    if (openArr > 0) text += ']'.repeat(Math.min(openArr, 30));
    if (openObj > 0) text += '}'.repeat(Math.min(openObj, 30));
  }

  return text;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function handleSlideAiRequest(body) {
  const mode = body?.mode === 'update' ? 'update' : 'create';
  const { apiKey, model, maxTokens } = getSlideAiConfig(mode);
  if (!apiKey) {
    return { ok: false, status: 503, error: 'ANTHROPIC_API_KEY not configured' };
  }

  const messages = body?.messages;
  const system = body?.system;
  if (!Array.isArray(messages) || !system) {
    return { ok: false, status: 400, error: 'messages and system are required' };
  }
  if (messages.length > 24) {
    return { ok: false, status: 400, error: 'Too many messages (max 24)' };
  }

  const totalChars =
    messages.reduce((n, m) => n + String(m.content || '').length, 0) +
    String(system).length;
  if (totalChars > 120_000) {
    return { ok: false, status: 400, error: 'Prompt too large — start a new deck' };
  }

  for (const m of messages) {
    if (m.role !== 'user' && m.role !== 'assistant') {
      return { ok: false, status: 400, error: 'Invalid message role' };
    }
    if (!String(m.content || '').trim()) {
      return { ok: false, status: 400, error: 'Empty message content' };
    }
  }

  // Append JSON enforcement to system prompt
  const systemWithEnforcement = String(system) + JSON_ENFORCEMENT;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemWithEnforcement,
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, status: res.status, error: errText || res.statusText };
  }

  const data = await res.json();

  const rawText = extractText(data);

  // Server-side sanitise: strip fences + salvage any truncation
  const cleanText = sanitizeJsonText(rawText);

  // Validate that it at least parses before sending to the browser
  try {
    JSON.parse(cleanText);
  } catch (parseErr) {
    // Log the raw output so the developer can see what went wrong
    console.error(
      '[SlideAI] JSON parse failed after sanitise.\n' +
      'stop_reason:', data.stop_reason,
      '| output_tokens:', data.usage?.output_tokens,
      '\nFirst 300 chars of raw:\n', rawText.slice(0, 300),
      '\nFirst 300 chars of clean:\n', cleanText.slice(0, 300),
    );
    // Return a structured error the client can display meaningfully
    return {
      ok: false,
      status: 422,
      error:
        `Deck JSON could not be parsed (stop_reason: ${data.stop_reason ?? 'unknown'}, ` +
        `output_tokens: ${data.usage?.output_tokens ?? '?'}). ` +
        'Try a shorter prompt or fewer slides.',
    };
  }

  return { ok: true, text: cleanText, model };
}

// ─── HTTP handler (used by both dev-api.mjs and netlify/functions/api.mjs) ────

export async function createSlideAiHttpResponse(request) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

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

  const result = await handleSlideAiRequest(body);
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: result.status || 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ text: result.text, model: result.model }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

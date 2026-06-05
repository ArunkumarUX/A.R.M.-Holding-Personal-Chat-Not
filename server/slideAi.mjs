/**
 * SlideAI — server-side Claude agent (keeps ANTHROPIC_API_KEY off the browser).
 */
import { getAnthropicConfig } from './chatCore.mjs';

function extractText(data) {
  return data.content?.find((b) => b.type === 'text')?.text || '';
}

export function getSlideAiConfig(mode = 'create') {
  const base = getAnthropicConfig();
  const model =
    process.env.SLIDEAI_ANTHROPIC_MODEL ||
    process.env.ANTHROPIC_MODEL ||
    base.model ||
    'claude-sonnet-4-6';

  return {
    apiKey: base.apiKey,
    model,
    maxTokens: mode === 'update' ? 4096 : 8192,
  };
}

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

  const totalChars = messages.reduce((n, m) => n + String(m.content || '').length, 0) + String(system).length;
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
      temperature: mode === 'create' ? 0.85 : 0.5,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, status: res.status, error: errText || res.statusText };
  }

  const data = await res.json();
  return { ok: true, text: extractText(data), model };
}

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

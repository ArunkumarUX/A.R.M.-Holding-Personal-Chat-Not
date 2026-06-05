import { createChatHttpResponse, getAnthropicConfig } from './chatCore.mjs';
import { createPresentationHttpResponse } from './presentationBuilder.mjs';
import { createSlideAiHttpResponse } from './slideAi.mjs';
import { createExecutiveSnapshotResponse } from './executiveSnapshot.mjs';
import { createAuthSessionStore } from './authSessionStore.mjs';
import { SESSION_TTL_MS } from './memoryAuthStore.mjs';
import { buildHealthDataTrust } from './dataProvenance.mjs';
import { isValidEmailShape, isValidUaeMobileShape } from './authCredentials.mjs';

const ACCESS_PIN = process.env.ADGM_ACCESS_PIN || '9898';

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders() });
}

function randomId(len = 24) {
  return [...crypto.getRandomValues(new Uint8Array(len))]
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, len);
}

async function readSession(store, sessionId) {
  const session = await store.get(sessionId, { type: 'json' });
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    await store.delete(sessionId);
    return null;
  }
  return session;
}

/**
 * @param {Request} request
 * @param {{ sessionStore?: () => import('./memoryAuthStore.mjs').createMemoryAuthStore extends () => infer R ? R : never }} [opts]
 */
function requestUrl(request) {
  try {
    return new URL(request.url);
  } catch {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost';
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    return new URL(request.url, `${proto}://${host}`);
  }
}

export async function handleApiRequest(request, opts = {}) {
  const sessionStoreFactory = opts.sessionStore ?? createAuthSessionStore;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = requestUrl(request);
  const path = url.pathname;

  if (request.method === 'GET' && path === '/api/health') {
    const { apiKey, model } = getAnthropicConfig();
    return json({
      ok: true,
      auth: true,
      claude: Boolean(apiKey),
      model,
      dataTrust: buildHealthDataTrust(),
    });
  }

  if (
    request.method === 'GET' &&
    (path === '/api/executive/snapshot' || path === '/api/snapshot')
  ) {
    return json(await createExecutiveSnapshotResponse(url));
  }

  if (request.method === 'POST' && path === '/api/chat') {
    return createChatHttpResponse(request);
  }

  if (request.method === 'POST' && path === '/api/presentation') {
    return createPresentationHttpResponse(request);
  }

  if (request.method === 'POST' && path === '/api/slideai') {
    return createSlideAiHttpResponse(request);
  }

  if (request.method === 'GET' && path === '/api/dev/public-origin') {
    const origin = (
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.URL || process.env.DEPLOY_PRIME_URL || ''
    ).replace(/\/$/, '');
    return json({
      origin,
      hint: origin
        ? 'Use this site URL in the QR code.'
        : 'Set VERCEL_URL or URL in environment.',
    });
  }

  const store = sessionStoreFactory();

  if (request.method === 'POST' && path === '/api/auth/session') {
    const sessionId = randomId(20);
    await store.setJSON(sessionId, { status: 'pending', createdAt: Date.now() });
    return json({ sessionId });
  }

  if (request.method === 'GET' && path.startsWith('/api/auth/session/')) {
    const sessionId = decodeURIComponent(path.slice('/api/auth/session/'.length));
    const session = await readSession(store, sessionId);
    if (!session) return json({ status: 'not_found' });
    return json({
      status: session.status === 'verified' ? 'verified' : 'pending',
      clientToken: session.clientToken,
    });
  }

  if (request.method === 'POST' && path === '/api/auth/login') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'invalid_json' }, 400);
    }
    const channel = body.channel === 'mobile' ? 'mobile' : 'email';
    const identifier = String(body.identifier || '').trim();

    if (!identifier) {
      return json({ ok: false, error: 'missing_identifier' }, 400);
    }
    if (channel === 'email' && !isValidEmailShape(identifier)) {
      return json({ ok: false, error: 'invalid_email' }, 400);
    }
    if (channel === 'mobile' && !isValidUaeMobileShape(identifier)) {
      return json({ ok: false, error: 'invalid_mobile' }, 400);
    }

    const clientToken = `adgm-${randomId(32)}`;
    await store.setJSON(`token:${clientToken}`, { valid: true, createdAt: Date.now() });
    return json({ ok: true, clientToken });
  }

  if (request.method === 'POST' && path === '/api/auth/verify') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, 400);
    }
    const sessionId = String(body.sessionId || '');
    const pin = String(body.pin || '').replace(/\D/g, '');
    const session = await readSession(store, sessionId);
    if (!session) {
      return json({ ok: false, error: 'Session expired' }, 404);
    }
    if (pin !== ACCESS_PIN) {
      return json({ ok: false, error: 'Invalid PIN' }, 401);
    }
    const clientToken = `adgm-${randomId(32)}`;
    await store.setJSON(sessionId, {
      ...session,
      status: 'verified',
      clientToken,
      verifiedAt: Date.now(),
    });
    await store.setJSON(`token:${clientToken}`, { valid: true, createdAt: Date.now() });
    return json({ ok: true, clientToken });
  }

  if (request.method === 'POST' && path === '/api/auth/validate') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false }, 400);
    }
    const token = String(body.token || '');
    const entry = await store.get(`token:${token}`, { type: 'json' });
    const ok = Boolean(entry?.valid && Date.now() - entry.createdAt < SESSION_TTL_MS);
    return json({ ok });
  }

  return json({ error: 'Not found' }, 404);
}

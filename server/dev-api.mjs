/**
 * Local dev proxy — keeps ANTHROPIC_API_KEY off the browser.
 * Run: node server/dev-api.mjs  (or npm run dev)
 */
import http from 'node:http';
import os from 'node:os';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getAnthropicConfig, streamChat } from './chatCore.mjs';
import { handlePresentationRequest } from './presentationBuilder.mjs';
import {
  handleCreateDeckRequest,
  handleGetDeckRequest,
  handleDeckDownloadRequest,
  handleDeckPreviewTimings,
} from './deckJobs.mjs';
import { handleSlideAiRequest } from './slideAi.mjs';
import { createExecutiveSnapshotResponse } from './executiveSnapshot.mjs';
import { isValidEmailShape, isValidUaeMobileShape } from './authCredentials.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvFile(name, { override = false } = {}) {
  const path = join(root, name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (override || !process.env[key] || process.env[key] === '') process.env[key] = val;
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local', { override: true });

/** Re-read .env.local so key changes apply without restarting the dev API. */
function reloadLocalEnv() {
  loadEnvFile('.env.local', { override: true });
}

const PREFERRED_PORT = Number(process.env.API_PORT || 8787);
const API_PORT_CANDIDATES = [
  PREFERRED_PORT,
  8810,
  8790,
  8800,
  8788,
  8786,
  8789,
  8787,
].filter((port, index, list) => port > 0 && list.indexOf(port) === index);
const VITE_PORT = Number(process.env.VITE_PORT || 5173);

function lanPriority(ip) {
  if (ip.startsWith('192.168.')) return 4;
  if (ip.startsWith('10.')) return 3;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return 2;
  if (ip.startsWith('169.254.') || ip.startsWith('192.0.0.')) return -1;
  return 1;
}

function getLanOrigin() {
  const candidates = [];
  const nets = os.networkInterfaces();
  for (const iface of Object.values(nets)) {
    if (!iface) continue;
    for (const net of iface) {
      if (net.family !== 'IPv4' || net.internal) continue;
      const score = lanPriority(net.address);
      if (score < 0) continue;
      candidates.push({ ip: net.address, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const ip = candidates[0]?.ip;
  if (ip) return `http://${ip}:${VITE_PORT}`;
  return null;
}
const ACCESS_PIN = process.env.ADGM_ACCESS_PIN || '9898';
const SESSION_TTL_MS = 15 * 60 * 1000;

/** @type {Map<string, { status: string, clientToken?: string, createdAt: number }>} */
const authSessions = new Map();
/** @type {Set<string>} */
const validClientTokens = new Set();

function randomId(len = 24) {
  return [...crypto.getRandomValues(new Uint8Array(len))]
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, len);
}

function pruneAuthSessions() {
  const now = Date.now();
  for (const [id, s] of authSessions) {
    if (now - s.createdAt > SESSION_TTL_MS) authSessions.delete(id);
  }
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(body));
}

async function handleChat(req, res) {
  reloadLocalEnv();
  const { apiKey } = getAnthropicConfig();
  if (!apiKey) {
    sendJson(res, 503, { error: 'ANTHROPIC_API_KEY not set. Add it to .env.local' });
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk;
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const writeEvent = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  try {
    await streamChat(payload, writeEvent);
  } catch (err) {
    writeEvent({ type: 'error', message: err?.message || 'Stream failed' });
  } finally {
    res.end();
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  const url = new URL(req.url || '/', 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/api/health') {
    reloadLocalEnv();
    const { apiKey, model } = getAnthropicConfig();
    const { buildHealthDataTrust } = await import('./dataProvenance.mjs');
    sendJson(res, 200, {
      ok: true,
      claude: Boolean(apiKey),
      model,
      dataTrust: buildHealthDataTrust(),
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/executive/snapshot') {
    sendJson(res, 200, await createExecutiveSnapshotResponse(url));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/dev/public-origin') {
    const lan = getLanOrigin();
    sendJson(res, 200, {
      origin: lan,
      vitePort: VITE_PORT,
      hint: lan
        ? 'Use this origin in the QR code so your phone can reach your computer.'
        : 'Connect to Wi‑Fi and set VITE_PUBLIC_ORIGIN in .env.local',
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/chat') {
    await handleChat(req, res);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/decks') {
    const body = await readJsonBody(req);
    if (body === null) {
      sendJson(res, 400, { error: 'Invalid JSON' });
      return;
    }
    try {
      const { status, body: result } = await handleCreateDeckRequest(body, req.headers);
      sendJson(res, status, result);
    } catch (err) {
      sendJson(res, 500, { error: err?.message || 'Deck job failed' });
    }
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/decks/')) {
    const rest = url.pathname.slice('/api/decks/'.length);
    const [jobId, action] = rest.split('/');

    if (action === 'download') {
      const result = await handleDeckDownloadRequest(jobId);
      if (result.json) {
        sendJson(res, result.status, result.json);
        return;
      }
      res.writeHead(result.status, {
        'Content-Type': result.contentType,
        'Access-Control-Allow-Origin': '*',
        ...result.headers,
      });
      res.end(result.body);
      return;
    }

    const result = await handleGetDeckRequest(jobId);
    sendJson(res, result.status, result.body);
    return;
  }

  if (req.method === 'POST' && url.pathname.startsWith('/api/decks/') && url.pathname.endsWith('/preview')) {
    const jobId = url.pathname.slice('/api/decks/'.length).replace(/\/preview$/, '');
    const body = await readJsonBody(req);
    await handleDeckPreviewTimings(jobId, body?.phase === 'completed' ? 'completed' : 'started');
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
    res.end();
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/presentation') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      const payload = JSON.parse(body);
      const result = await handlePresentationRequest(payload);
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 500, { error: err?.message || 'Presentation failed' });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/slideai') {
    const payload = await readJsonBody(req);
    if (payload === null) {
      sendJson(res, 400, { error: 'Invalid JSON' });
      return;
    }
    const result = await handleSlideAiRequest(payload);
    if (!result.ok) {
      sendJson(res, result.status || 500, { error: result.error });
      return;
    }
    sendJson(res, 200, { text: result.text });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/session') {
    pruneAuthSessions();
    const sessionId = randomId(20);
    authSessions.set(sessionId, { status: 'pending', createdAt: Date.now() });
    sendJson(res, 200, { sessionId });
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/auth/session/')) {
    pruneAuthSessions();
    const sessionId = url.pathname.slice('/api/auth/session/'.length);
    const session = authSessions.get(sessionId);
    if (!session) {
      sendJson(res, 200, { status: 'not_found' });
      return;
    }
    if (Date.now() - session.createdAt > SESSION_TTL_MS) {
      authSessions.delete(sessionId);
      sendJson(res, 200, { status: 'expired' });
      return;
    }
    sendJson(res, 200, {
      status: session.status === 'verified' ? 'verified' : 'pending',
      clientToken: session.clientToken,
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    const body = await readJsonBody(req);
    if (body === null) {
      sendJson(res, 400, { ok: false, error: 'invalid_json' });
      return;
    }
    const channel = body.channel === 'mobile' ? 'mobile' : 'email';
    const identifier = String(body.identifier || '').trim();
    if (!identifier) {
      sendJson(res, 400, { ok: false, error: 'missing_identifier' });
      return;
    }
    if (channel === 'email' && !isValidEmailShape(identifier)) {
      sendJson(res, 400, { ok: false, error: 'invalid_email' });
      return;
    }
    if (channel === 'mobile' && !isValidUaeMobileShape(identifier)) {
      sendJson(res, 400, { ok: false, error: 'invalid_mobile' });
      return;
    }
    const clientToken = `adgm-${randomId(32)}`;
    validClientTokens.add(clientToken);
    sendJson(res, 200, { ok: true, clientToken });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/verify') {
    pruneAuthSessions();
    const body = await readJsonBody(req);
    if (body === null) {
      sendJson(res, 400, { ok: false, error: 'Invalid JSON' });
      return;
    }
    const sessionId = String(body.sessionId || '');
    const pin = String(body.pin || '').replace(/\D/g, '');
    const session = authSessions.get(sessionId);
    if (!session || Date.now() - session.createdAt > SESSION_TTL_MS) {
      sendJson(res, 404, { ok: false, error: 'Session expired' });
      return;
    }
    if (pin !== ACCESS_PIN) {
      sendJson(res, 401, { ok: false, error: 'Invalid PIN' });
      return;
    }
    const clientToken = `adgm-${randomId(32)}`;
    session.status = 'verified';
    session.clientToken = clientToken;
    validClientTokens.add(clientToken);
    sendJson(res, 200, { ok: true, clientToken });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/validate') {
    const body = await readJsonBody(req);
    if (body === null) {
      sendJson(res, 400, { ok: false });
      return;
    }
    const token = String(body.token || '');
    sendJson(res, 200, { ok: validClientTokens.has(token) });
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

let apiServerStarted = false;

function startApiServer(candidateIndex = 0) {
  if (apiServerStarted) return;
  if (candidateIndex >= API_PORT_CANDIDATES.length) {
    console.error('[api] No free port — close other dev-api instances or set API_PORT.');
    process.exit(1);
  }

  const port = API_PORT_CANDIDATES[candidateIndex];
  const onError = (err) => {
    if (err?.code === 'EADDRINUSE') {
      console.warn(`[api] Port ${port} in use, trying next…`);
      server.close(() => {
        setImmediate(() => startApiServer(candidateIndex + 1));
      });
      return;
    }
    console.error('[api] Failed to start:', err);
    process.exit(1);
  };

  server.once('error', onError);
  server.listen(port, () => {
    if (apiServerStarted) return;
    apiServerStarted = true;
    server.removeListener('error', onError);
    reloadLocalEnv();
    const { apiKey } = getAnthropicConfig();
    try {
      writeFileSync(join(root, '.dev-api-port'), String(port), 'utf8');
    } catch {
      /* ignore */
    }
    console.log(
      `[api] http://localhost:${port}  claude=${apiKey ? 'on' : 'off (set ANTHROPIC_API_KEY in .env.local)'}`,
    );
  });
}

startApiServer();

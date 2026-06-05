import { handleApiRequest } from '../server/apiRouter.mjs';
import { createAuthSessionStore } from '../server/authSessionStore.mjs';

export const config = {
  maxDuration: 60,
};

function asWebRequest(req) {
  if (req instanceof Request) return req;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (value == null) continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
  }

  const host = headers.get('x-forwarded-host') || headers.get('host') || 'localhost';
  const proto = headers.get('x-forwarded-proto') || 'https';
  const path = req.url || '/';
  const url = path.startsWith('http')
    ? path
    : `${proto}://${host}${path.startsWith('/') ? path : `/${path}`}`;

  const method = req.method || 'GET';
  const init = { method, headers };
  if (!['GET', 'HEAD'].includes(method.toUpperCase())) {
    init.body = req;
    init.duplex = 'half';
  }
  return new Request(url, init);
}

async function writeNodeResponse(res, response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}

async function handler(req, res) {
  const request = asWebRequest(req);
  const response = await handleApiRequest(request, { sessionStore: createAuthSessionStore });
  if (res && typeof res.end === 'function') {
    await writeNodeResponse(res, response);
    return;
  }
  return response;
}

export default handler;

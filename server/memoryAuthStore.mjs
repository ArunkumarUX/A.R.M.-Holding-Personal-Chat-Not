const SESSION_TTL_MS = 15 * 60 * 1000;

/** @type {Map<string, { status: string, clientToken?: string, createdAt: number, verifiedAt?: number }>} */
const authSessions = new Map();
/** @type {Map<string, { valid: boolean, createdAt: number }>} */
const tokenEntries = new Map();

function prune() {
  const now = Date.now();
  for (const [id, s] of authSessions) {
    if (now - s.createdAt > SESSION_TTL_MS) authSessions.delete(id);
  }
  for (const [key, entry] of tokenEntries) {
    if (now - entry.createdAt > SESSION_TTL_MS) tokenEntries.delete(key);
  }
}

/** In-memory auth store for dev and Vercel (not durable across cold starts). */
export function createMemoryAuthStore() {
  return {
    async setJSON(key, value) {
      prune();
      if (key.startsWith('token:')) {
        tokenEntries.set(key.slice('token:'.length), value);
        return;
      }
      authSessions.set(key, value);
    },
    async get(key, opts) {
      prune();
      if (key.startsWith('token:')) {
        const entry = tokenEntries.get(key.slice('token:'.length));
        return opts?.type === 'json' ? entry ?? null : entry;
      }
      return authSessions.get(key) ?? null;
    },
    async delete(key) {
      authSessions.delete(key);
    },
  };
}

export { SESSION_TTL_MS };

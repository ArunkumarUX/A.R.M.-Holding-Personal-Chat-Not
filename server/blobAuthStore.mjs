import { del, get, put } from '@vercel/blob';
import { SESSION_TTL_MS } from './memoryAuthStore.mjs';

function pathnameForKey(key) {
  const safe = String(key).replace(/[^a-zA-Z0-9._-]/g, '_');
  return `adgm-auth/${safe}.json`;
}

/** Shared auth sessions across Vercel serverless instances (Vercel Blob). */
export function createBlobAuthStore() {
  return {
    async setJSON(key, value) {
      await put(pathnameForKey(key), JSON.stringify(value), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    },
    async get(key, opts) {
      try {
        const result = await get(pathnameForKey(key), { access: 'private', useCache: false });
        if (!result || result.statusCode !== 200 || !result.stream) return null;
        const text = await new Response(result.stream).text();
        if (!text) return null;
        const data = JSON.parse(text);
        if (data?.createdAt && Date.now() - data.createdAt > SESSION_TTL_MS) {
          await del(pathnameForKey(key)).catch(() => {});
          return null;
        }
        return opts?.type === 'json' ? data : data;
      } catch (err) {
        if (err?.name === 'BlobNotFoundError') return null;
        throw err;
      }
    },
    async delete(key) {
      await del(pathnameForKey(key)).catch(() => {});
    },
  };
}

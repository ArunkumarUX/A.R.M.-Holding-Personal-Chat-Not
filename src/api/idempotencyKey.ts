/** ASCII-only idempotency key — safe for headers and fetch (no Unicode in prompt text). */
export function buildDeckIdempotencyKey(sourceKey: string, prefix = 'deck-generation-local'): string {
  let h1 = 0x811c9dc5;
  let h2 = 0;
  for (let i = 0; i < sourceKey.length; i++) {
    const c = sourceKey.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 = (h2 + c * (i + 1)) | 0;
  }
  return `${prefix}-${(h1 >>> 0).toString(16)}${(h2 >>> 0).toString(16)}`;
}

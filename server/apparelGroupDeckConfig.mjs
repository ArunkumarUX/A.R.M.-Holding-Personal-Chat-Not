/**
 * Apparel Group deck generation — permanent rules live here, not in every request.
 */
export const APPAREL_GROUP_DECK_CONFIG = {
  // No verified Apparel Group template exists in the Perceptis org yet — sending a
  // guessed template_name risks a 409 (no/ambiguous match) or silently skipping the
  // brand. Leave unset until PERCEPTIS_TEMPLATE_NAME is configured with a name that
  // exactly matches a template in the Perceptis app's Templates page (case-sensitive).
  // Branding is still enforced via the explicit Brand line in buildCompactPerceptisPrompt.
  brandTemplateId: process.env.PERCEPTIS_TEMPLATE_NAME?.trim() || '',
  company: 'Apparel Group',
  audience: 'Group CEO and senior leadership',
  format: '16:9 pptx',
  brand: {
    primary: '#003399',
    accent: '#C5D92D',
    headingFont: 'Gotham',
    bodyFont: 'Aptos',
    footer: 'Apparel Group · Confidential',
  },
  rules: [
    'Action titles only — complete insight sentences',
    'Native editable charts and tables',
    'Speaker notes on every slide',
    'MECE structure · board-ready',
    'Maximum 3 strategic options on first pass',
    'No appendix unless explicitly requested',
  ],
  defaultSlideCount: 8,
  maxSlideCount: 12,
  jobTimeoutMs: 15 * 60 * 1000,
  stalledAfterMs: 3 * 60 * 1000,
};

/** Only these three lengths are offered — fewer slides means a faster Perceptis render. */
export const ALLOWED_SLIDE_COUNTS = [6, 8, 12];

/** Snap any requested slide count to the nearest of ALLOWED_SLIDE_COUNTS (ties favour the smaller/faster option). */
export function clampSlideCount(count, fallback = APPAREL_GROUP_DECK_CONFIG.defaultSlideCount) {
  const n = Number(count);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return ALLOWED_SLIDE_COUNTS.reduce((closest, candidate) =>
    Math.abs(candidate - n) < Math.abs(closest - n) ? candidate : closest,
  );
}

export function inferSlideCountFromText(text, fallback = APPAREL_GROUP_DECK_CONFIG.defaultSlideCount) {
  const match = String(text || '').match(/(\d+)\s*[- ]?\s*slides?/i);
  if (!match) return fallback;
  return clampSlideCount(Number.parseInt(match[1], 10));
}

/** Extract a concise topic from a long brief (first sentence or line). */
export function extractTopic(prompt = '') {
  const trimmed = String(prompt).trim();
  if (!trimmed) return 'Apparel Group strategy update';
  const firstLine = trimmed.split('\n')[0]?.trim() || trimmed;
  const firstSentence = firstLine.split(/(?<=[.!?])\s+/)[0] || firstLine;
  return firstSentence.slice(0, 280);
}

/** Extract objective / decision from brief keywords. */
export function extractObjective(prompt = '') {
  const match = String(prompt).match(/(?:objective|decision|recommendation)[:\s]+([^\n.]{10,200})/i);
  return match?.[1]?.trim() || '';
}

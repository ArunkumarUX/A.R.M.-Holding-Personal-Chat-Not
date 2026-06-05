/**
 * Bloomberg category news via Apify Actor piotrv1001/bloomberg-category-news-scraper
 * Requires APIFY_TOKEN in environment (same token as Apify MCP).
 */

const ACTOR_ID = 'piotrv1001~bloomberg-category-news-scraper';

const DEFAULT_SEARCH_URLS = [
  'https://www.bloomberg.com/markets',
  'https://www.bloomberg.com/economics',
  'https://www.bloomberg.com/crypto',
  'https://www.bloomberg.com/technology',
];

function parseSearchUrls() {
  const raw = process.env.APIFY_BLOOMBERG_URLS;
  if (!raw?.trim()) return DEFAULT_SEARCH_URLS;
  return raw
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
}

function maxItemsPerUrl() {
  const n = Number(process.env.APIFY_BLOOMBERG_MAX_ITEMS ?? 5);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 20) : 5;
}

/**
 * @returns {Promise<{ headline: string; items: object[]; fetchedAt: string } | null>}
 */
export async function fetchBloombergCategoryNews() {
  const token = process.env.APIFY_TOKEN?.trim();
  if (!token) return null;

  const input = {
    searchUrls: parseSearchUrls(),
    maxItemsPerUrl: maxItemsPerUrl(),
  };

  const url = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Apify Bloomberg actor failed (${res.status}): ${errText.slice(0, 200)}`);
  }

  const items = await res.json();
  if (!Array.isArray(items) || items.length === 0) return null;

  const sorted = [...items].sort((a, b) => {
    const ta = new Date(a.publishedAt ?? 0).getTime();
    const tb = new Date(b.publishedAt ?? 0).getTime();
    return tb - ta;
  });

  const lead = sorted[0];
  const headline = typeof lead?.headline === 'string' ? lead.headline.trim() : '';

  return {
    headline: headline || 'Bloomberg feed updated',
    items: sorted.slice(0, 12),
    fetchedAt: new Date().toISOString(),
  };
}

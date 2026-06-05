/**
 * Live web search using Brave Search API (free tier — 2,000 searches/month, no credit card).
 * Get a free key at: https://api.search.brave.com/register
 *
 * Set BRAVE_SEARCH_API_KEY in .env.local to enable.
 * Falls back gracefully to null when not configured.
 */

const BRAVE_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search';

/**
 * Keywords that indicate the query needs live web search
 * (not covered by the KB or scenario data).
 */
const NEEDS_LIVE_SEARCH =
  /\b(latest|recent|current|today|this week|this month|2025|2026|just announced|breaking|news|update|what happened|what is happening|what is the latest|trending|new regulation|new policy|new fund|new deal|announcement|press release|statement|report|published|check the internet|search the internet|search for|look up|find out|gold market|oil market|commodity|price of|market update|market news|what is happening|happening in|developments in)\b/i;

export function shouldWebSearch(query = '') {
  return NEEDS_LIVE_SEARCH.test(query.trim());
}

/**
 * @typedef {{ title: string; url: string; description: string; date?: string; source: string }} SearchResult
 */

/**
 * Run a Brave web search scoped to financial/regulatory/GCC topics.
 * Returns up to `count` results with title, URL, description, date, source.
 *
 * @param {string} query
 * @param {number} count
 * @returns {Promise<SearchResult[] | null>}
 */
export async function braveSearch(query, count = 5) {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY?.trim();
  if (!apiKey) return null;

  // Scope the query to relevant domains for CSO/ADGM context
  const scopedQuery = `${query} site:adgm.com OR site:mas.gov.sg OR site:reuters.com OR site:bloomberg.com OR site:arabianbusiness.com OR site:gulfnews.com OR site:fatf-gafi.org OR site:added.gov.ae OR site:zawya.com OR site:khaleejitimes.com`;

  try {
    const url = new URL(BRAVE_ENDPOINT);
    url.searchParams.set('q', scopedQuery);
    url.searchParams.set('count', String(Math.min(count, 10)));
    url.searchParams.set('result_filter', 'web');
    url.searchParams.set('freshness', 'pw'); // past week by default

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn('[webSearch] Brave API error:', res.status);
      return null;
    }

    const data = await res.json();
    const results = data?.web?.results ?? [];

    return results.map((r) => ({
      title: r.title ?? '',
      url: r.url ?? '',
      description: r.description ?? '',
      date: r.page_age ?? r.age ?? null,
      source: extractDomain(r.url ?? ''),
    })).filter((r) => r.title && r.url);

  } catch (err) {
    console.warn('[webSearch] Brave search failed:', err?.message);
    return null;
  }
}

/**
 * Broader search without domain scoping — for general queries.
 * @param {string} query
 * @param {number} count
 * @returns {Promise<SearchResult[] | null>}
 */
export async function braveSearchBroad(query, count = 5) {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const url = new URL(BRAVE_ENDPOINT);
    url.searchParams.set('q', query);
    url.searchParams.set('count', String(Math.min(count, 10)));
    url.searchParams.set('result_filter', 'web');
    url.searchParams.set('freshness', 'pm'); // past month

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return (data?.web?.results ?? []).map((r) => ({
      title: r.title ?? '',
      url: r.url ?? '',
      description: r.description ?? '',
      date: r.page_age ?? r.age ?? null,
      source: extractDomain(r.url ?? ''),
    })).filter((r) => r.title && r.url);

  } catch (err) {
    console.warn('[webSearch] Broad search failed:', err?.message);
    return null;
  }
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Format search results as a grounded block for Claude's system prompt.
 * @param {SearchResult[]} results
 * @param {string} query
 * @returns {string}
 */
export function formatSearchResultsBlock(results, query) {
  if (!results?.length) return '';
  const items = results.map((r, i) =>
    `[WEB-${String(i + 1).padStart(2, '0')}] ${r.title}\nURL: ${r.url}\nSource: ${r.source}${r.date ? ` · ${r.date}` : ''}\n${r.description}`
  ).join('\n\n');

  return `
═══════════════════════════════
LIVE WEB SEARCH RESULTS (for query: "${query}")
Source: Brave Search API · Real-time internet
Cite these as [WEB-01], [WEB-02] etc. Always include the URL when citing.
═══════════════════════════════

${items}

IMPORTANT: These are live web results. Treat as "External source — verify before formal use."
Always cite the URL alongside the handle so stakeholders can click and verify directly.
`.trim();
}

export function isWebSearchAvailable() {
  return Boolean(process.env.BRAVE_SEARCH_API_KEY?.trim());
}

// ─── FREE FALLBACK SEARCH (no API key needed) ───────────────────────────────
// Uses public RSS feeds from Reuters, Arabian Business, Gulf News, ZAWYA.
// Works for any query — filters by keyword relevance.

const FREE_FEEDS = [
  { url: 'https://feeds.reuters.com/reuters/businessNews', label: 'Reuters Business', site: 'reuters.com' },
  { url: 'https://feeds.reuters.com/reuters/INbusinessNews', label: 'Reuters Finance', site: 'reuters.com' },
  { url: 'https://www.arabianbusiness.com/rss', label: 'Arabian Business', site: 'arabianbusiness.com' },
  { url: 'https://gulfnews.com/rss/business.rss', label: 'Gulf News Business', site: 'gulfnews.com' },
  { url: 'https://www.zawya.com/en/rss/feed/markets', label: 'ZAWYA Markets', site: 'zawya.com' },
];

function parseRssSimple(xml, siteUrl, label) {
  const items = [];
  const re = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const title = extractTagVal(block, 'title');
    const link = extractLink(block, siteUrl);
    const desc = extractTagVal(block, 'description') || extractTagVal(block, 'summary');
    const date = extractDate(block);
    if (title && link) items.push({ title: clean(title), url: link, description: clean(desc).slice(0, 180), date, source: label });
  }
  return items.slice(0, 6);
}
function extractTagVal(xml, tag) {
  const m = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, 'i').exec(xml);
  return m ? m[1].trim() : '';
}
function extractLink(block, fallback) {
  const tag = extractTagVal(block, 'link');
  if (tag?.startsWith('http')) return tag;
  const href = /<link[^>]+href=["']([^"']+)["']/i.exec(block);
  if (href?.[1]?.startsWith('http')) return href[1];
  const guid = extractTagVal(block, 'guid');
  if (guid?.startsWith('http')) return guid;
  return fallback;
}
function extractDate(block) {
  const raw = extractTagVal(block, 'pubDate') || extractTagVal(block, 'published') || extractTagVal(block, 'updated') || '';
  try { return raw ? new Date(raw).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10); } catch { return new Date().toISOString().slice(0, 10); }
}
function clean(text) {
  return text.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function scoreItem(item, query) {
  const tokens = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const text = (item.title + ' ' + item.description).toLowerCase();
  return tokens.reduce((s, t) => s + (text.includes(t) ? 2 : 0), 0);
}

/**
 * Free RSS-based search — no API key needed.
 * Fetches all feeds, scores items by query relevance, returns top results.
 * @param {string} query
 * @param {number} count
 * @returns {Promise<SearchResult[]>}
 */
export async function freeRssSearch(query, count = 5) {
  const results = await Promise.allSettled(
    FREE_FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, {
          signal: AbortSignal.timeout(6000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CSO-AI-Agent/1.0)', Accept: 'application/rss+xml, text/xml, */*' },
        });
        if (!res.ok) return [];
        const xml = await res.text();
        return parseRssSimple(xml, `https://${feed.site}`, feed.label);
      } catch { return []; }
    })
  );

  const all = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  const scored = all.map(item => ({ item, score: scoreItem(item, query) }))
    .filter(x => x.score > 0 || all.length < 10)
    .sort((a, b) => b.score - a.score || new Date(b.item.date).getTime() - new Date(a.item.date).getTime());

  return scored.slice(0, count).map(x => x.item);
}

/**
 * Smart search: uses Brave API if key set, falls back to free RSS search.
 * Always returns something — never fails silently.
 * @param {string} query
 * @param {number} count
 * @returns {Promise<SearchResult[]>}
 */
export async function smartSearch(query, count = 5) {
  if (isWebSearchAvailable()) {
    const results = await braveSearch(query, count);
    if (results?.length) return results;
  }
  // Free RSS fallback — no key needed
  return freeRssSearch(query, count);
}

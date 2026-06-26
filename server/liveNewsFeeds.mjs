/**
 * Real-time news feed fetcher — public RSS feeds, no API key required.
 * Used for priority signal cards with verifiable source links.
 */

/** @typedef {{ title: string; url: string; date: string; source: string; sourceUrl: string; excerpt: string; feedId?: string; tags?: string[] }} NewsItem */

const FEEDS = [
  {
    id: 'google-gcc-finance',
    label: 'Google News — GCC Finance',
    siteUrl: 'https://news.google.com',
    rssUrl:
      'https://news.google.com/rss/search?q=%22Dubai+real+estate%22+OR+%22Dubai+property%22+OR+%22Jebel+Ali+Racecourse%22+OR+%22A.R.M.+Holding%22+OR+RERA+OR+Emaar+OR+Meraas+OR+%22Dubai+developer%22&hl=en-AE&gl=AE&ceid=AE:en',
    tags: ['market', 'competitor', 'investment', 'regulatory', 'followup'],
  },
  {
    id: 'bbc-business',
    label: 'BBC Business',
    siteUrl: 'https://www.bbc.com/news/business',
    rssUrl: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    tags: ['market', 'competitor', 'investment', 'regulatory'],
  },
  {
    id: 'cnbc-top',
    label: 'CNBC Top News',
    siteUrl: 'https://www.cnbc.com',
    rssUrl: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',
    tags: ['market', 'competitor', 'investment'],
  },
  {
    id: 'aljazeera-all',
    label: 'Al Jazeera',
    siteUrl: 'https://www.aljazeera.com',
    rssUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
    tags: ['market', 'competitor', 'regulatory', 'followup'],
  },
  {
    id: 'reuters-business',
    label: 'Reuters Business',
    siteUrl: 'https://www.reuters.com/business',
    rssUrl: 'https://feeds.reuters.com/reuters/businessNews',
    tags: ['market', 'competitor', 'investment'],
  },
  {
    id: 'reuters-finance',
    label: 'Reuters Finance',
    siteUrl: 'https://www.reuters.com/finance',
    rssUrl: 'https://feeds.reuters.com/reuters/INbusinessNews',
    tags: ['market', 'regulatory'],
  },
  {
    id: 'arabian-business',
    label: 'Arabian Business',
    siteUrl: 'https://www.arabianbusiness.com',
    rssUrl: 'https://www.arabianbusiness.com/rss',
    tags: ['market', 'competitor', 'investment', 'regulatory'],
  },
  {
    id: 'gulf-news',
    label: 'Gulf News Business',
    siteUrl: 'https://gulfnews.com/business',
    rssUrl: 'https://gulfnews.com/rss/business.rss',
    tags: ['market', 'regulatory', 'followup'],
  },
  {
    id: 'khaleej-times',
    label: 'Khaleej Times Business',
    siteUrl: 'https://www.khaleejtimes.com/business',
    rssUrl: 'https://www.khaleejtimes.com/business/feed',
    tags: ['market', 'investment', 'followup'],
  },
  {
    id: 'zawya',
    label: 'ZAWYA — GCC Markets',
    siteUrl: 'https://www.zawya.com/en/markets',
    rssUrl: 'https://www.zawya.com/en/rss/feed/markets',
    tags: ['market', 'investment', 'competitor'],
  },
];

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

function parseRssItems(xml, siteUrl) {
  const items = [];
  const itemRe = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/gi;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = extractTag(block, 'title');
    const link = extractLink(block, siteUrl);
    const date = extractDate(block);
    const excerpt = extractExcerpt(block);
    if (title && link) {
      items.push({ title: cleanText(title), url: link, date, excerpt: cleanText(excerpt) });
    }
  }
  return items.slice(0, 10);
}

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, 'i');
  const m = re.exec(xml);
  return m ? m[1].trim() : '';
}

function extractLink(block, siteUrl) {
  const linkTag = extractTag(block, 'link');
  if (linkTag?.startsWith('http')) return linkTag;
  const hrefM = /<link[^>]+href=["']([^"']+)["']/i.exec(block);
  if (hrefM?.[1]?.startsWith('http')) return hrefM[1];
  const guid = extractTag(block, 'guid');
  if (guid?.startsWith('http')) return guid;
  return siteUrl;
}

function extractDate(block) {
  const raw =
    extractTag(block, 'pubDate') ||
    extractTag(block, 'published') ||
    extractTag(block, 'updated') ||
    extractTag(block, 'dc:date') ||
    '';
  if (!raw) return new Date().toISOString().slice(0, 10);
  try {
    return new Date(raw).toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function extractExcerpt(block) {
  const raw =
    extractTag(block, 'description') ||
    extractTag(block, 'summary') ||
    extractTag(block, 'content');
  const cleaned = cleanText(raw);
  return cleaned.length > 220 ? `${cleaned.slice(0, 217).trim()}…` : cleaned;
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<a[^>]*>/gi, ' ')
    .replace(/<\/a>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/<[^>]*$/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchFeed(feed, timeoutMs = 10_000) {
  try {
    const res = await fetch(feed.rssUrl, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: FETCH_HEADERS,
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    if (!xml.includes('<') || xml.length < 200) throw new Error('empty feed');
    const items = parseRssItems(xml, feed.siteUrl);
    if (!items.length) throw new Error('no items parsed');
    return items.map((item) => ({
      ...item,
      source: feed.label,
      sourceUrl: feed.siteUrl,
      feedId: feed.id,
      tags: feed.tags,
    }));
  } catch (err) {
    console.warn(`[liveNewsFeeds] ${feed.id} skipped: ${err?.message}`);
    return [];
  }
}

export async function fetchAllNewsFeeds() {
  const results = await Promise.all(FEEDS.map((f) => fetchFeed(f)));
  const flat = results.flat();
  const seen = new Set();
  const deduped = flat.filter((item) => {
    const key = item.title.toLowerCase().slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  deduped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return deduped;
}

/**
 * A.R.M. Holding-relevance keywords — an article must mention at least one of these
 * to appear on the Executive Home signal cards.
 * Deliberately excludes broad region words (gcc, gulf, emirates) that match
 * unrelated articles (webinars, sports, airlines, etc.).
 */
const ARM_RELEVANCE_KEYWORDS = [
  // Company & brands
  'arm holding', 'a.r.m.', 'drec', 'huna', 'hive coliv', 'capri llc',
  // Properties & projects
  'jebel ali racecourse', 'palm spring village', 'beach centre', 'h residence',
  'huna sculpture', 'we emerge stronger', 'art dubai',
  // Dubai real estate specifics
  'dubai real estate', 'dubai property', 'dubai developer', 'dubai developer',
  'dubai land department', 'dubai residential', 'dubai off-plan', 'dubai rental',
  // Regulators
  'rera', 'dld', 'ejari', 'rental index', 'smart rental',
  // Competitors
  'emaar', 'meraas', 'nakheel', 'damac', 'aldar', 'sobha', 'ellington',
  // Market metrics
  'revpar', 'occupancy rate', 'pre-sales', 'leasing', 'coliving',
  // Portfolio topics
  'real estate investment', 'property market', 'd33', 'hospitality recovery',
  // Specific current initiatives
  'jebel ali', 'bjarke ingels', 'big architect', 'wsp masterplan',
];

/**
 * Per-signal keyword classifiers — ensures articles are routed to the
 * most relevant signal slot rather than all appearing in the same card.
 */
const SIGNAL_KEYWORDS = {
  market:     ['dubai real estate', 'dubai property', 'property market', 'transactions', 'revpar', 'occupancy', 'off-plan', 'property prices', 'market update', 'q1 2026', 'q2 2026'],
  competitor: ['emaar', 'meraas', 'nakheel', 'damac', 'aldar', 'sobha', 'ellington', 'developer launch', 'waterfront', 'lifestyle district', 'rival'],
  investment: ['jebel ali', 'jebel ali racecourse', 'arm holding', 'capri', 'investment', 'masterplan', 'ground-break', 'bjarke ingels', 'wsp', 'off-plan'],
  regulatory: ['rera', 'dld', 'ejari', 'rental index', 'smart rental', 'compliance', 'regulation', 'cbuae', 'dfsa'],
  followup:   ['art dubai', 'we emerge stronger', 'sculpture', 'h residence', 'huna', 'drec', 'hive'],
};

function isArmRelevant(item) {
  const text = (item.title + ' ' + (item.excerpt || '')).toLowerCase();
  return ARM_RELEVANCE_KEYWORDS.some((kw) => text.includes(kw));
}

function signalScore(tag, item) {
  const text = (item.title + ' ' + (item.excerpt || '')).toLowerCase();
  const kws = SIGNAL_KEYWORDS[tag] ?? [];
  return kws.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
}

/**
 * Get news items for a given signal tag — A.R.M. Holding/Dubai real estate only.
 * First filters by ARM relevance, then scores by signal-specific keywords so
 * competitor/investment/regulatory cards each get the most appropriate articles.
 */
export function getNewsByTag(tag, allItems, limit = 3) {
  const tagged = allItems.filter((i) => i.tags?.includes(tag));
  const relevant = tagged.filter(isArmRelevant);
  // Sort by signal-specific keyword score then recency
  const scored = relevant
    .map((item) => ({ item, score: signalScore(tag, item) }))
    .sort((a, b) => b.score - a.score || new Date(b.item.date).getTime() - new Date(a.item.date).getTime());
  return scored.map((s) => s.item).slice(0, limit);
}

export function filterGccRelevant(items, limit = 5) {
  const keywords = [
    'arm holding', 'drec', 'huna', 'hive', 'capri', 'jebel ali',
    'dubai real estate', 'dubai property', 'rera', 'dld', 'ejari',
    'emaar', 'meraas', 'nakheel', 'damac', 'aldar',
    'art dubai', 'we emerge stronger', 'leasing', 'rental index',
    'd33', 'occupancy', 'revpar', 'off-plan', 'developer',
  ];
  const scored = items.map((item) => {
    const text = (item.title + ' ' + (item.excerpt || '')).toLowerCase();
    const score = keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
    return { item, score };
  });
  scored.sort(
    (a, b) => b.score - a.score || new Date(b.item.date).getTime() - new Date(a.item.date).getTime(),
  );
  return scored.filter((s) => s.score > 0).map((s) => s.item).slice(0, limit);
}

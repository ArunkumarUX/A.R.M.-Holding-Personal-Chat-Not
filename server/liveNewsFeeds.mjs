/**
 * Real-time news feed fetcher — free public RSS feeds, no API key required.
 * Sources: Reuters, Arabian Business, Gulf News, Khaleej Times, ZAWYA.
 * Used for signal cards and market intelligence with verifiable source links.
 */

/** @typedef {{ title: string; url: string; date: string; source: string; sourceUrl: string; excerpt: string }} NewsItem */

const FEEDS = [
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
    tags: ['market', 'investment'],
  },
  {
    id: 'zawya',
    label: 'ZAWYA — GCC Markets',
    siteUrl: 'https://www.zawya.com/en/markets',
    rssUrl: 'https://www.zawya.com/en/rss/feed/markets',
    tags: ['market', 'investment', 'competitor'],
  },
];

/** Simple RSS/Atom XML parser — no dependencies */
function parseRssItems(xml, siteUrl) {
  const items = [];
  // Match <item>...</item> or <entry>...</entry> blocks
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
  return items.slice(0, 8);
}

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, 'i');
  const m = re.exec(xml);
  return m ? m[1].trim() : '';
}

function extractLink(block, siteUrl) {
  // Try <link> tag first
  const linkTag = extractTag(block, 'link');
  if (linkTag?.startsWith('http')) return linkTag;
  // Try <link href="..."> (Atom)
  const hrefM = /<link[^>]+href=["']([^"']+)["']/i.exec(block);
  if (hrefM?.[1]?.startsWith('http')) return hrefM[1];
  // Try <guid> with URL
  const guid = extractTag(block, 'guid');
  if (guid?.startsWith('http')) return guid;
  return siteUrl;
}

function extractDate(block) {
  const raw =
    extractTag(block, 'pubDate') ||
    extractTag(block, 'published') ||
    extractTag(block, 'updated') ||
    extractTag(block, 'dc:date') || '';
  if (!raw) return new Date().toISOString().slice(0, 10);
  try {
    return new Date(raw).toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function extractExcerpt(block) {
  return (
    extractTag(block, 'description') ||
    extractTag(block, 'summary') ||
    extractTag(block, 'content')
  ).slice(0, 200);
}

function cleanText(text) {
  return text
    .replace(/<[^>]+>/g, '') // strip HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchFeed(feed, timeoutMs = 8000) {
  try {
    const res = await fetch(feed.rssUrl, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CSO-AI-Agent/1.0)',
        Accept: 'application/rss+xml, application/atom+xml, text/xml, */*',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const items = parseRssItems(xml, feed.siteUrl);
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

/**
 * Fetch all feeds concurrently. Returns flat array sorted newest-first.
 * @returns {Promise<NewsItem[]>}
 */
export async function fetchAllNewsFeeds() {
  const results = await Promise.all(FEEDS.map((f) => fetchFeed(f)));
  const flat = results.flat();
  // Sort newest first
  flat.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return flat;
}

/**
 * Get news items for a specific signal card type.
 * @param {'market'|'competitor'|'investment'|'regulatory'|'followup'} tag
 * @param {NewsItem[]} allItems
 * @param {number} limit
 * @returns {NewsItem[]}
 */
export function getNewsByTag(tag, allItems, limit = 3) {
  return allItems.filter((i) => i.tags?.includes(tag)).slice(0, limit);
}

/**
 * Filter for GCC/ADGM-relevant headlines using keyword scoring.
 * @param {NewsItem[]} items
 * @param {number} limit
 */
export function filterGccRelevant(items, limit = 5) {
  const keywords = [
    'adgm', 'abu dhabi', 'uae', 'dubai', 'gcc', 'saudi', 'riyadh', 'qatar', 'kuwait',
    'bahrain', 'oman', 'difc', 'mubadala', 'adq', 'adia', 'fsra', 'falcon',
    'financial centre', 'digital asset', 'crypto', 'tokenisation', 'fintech',
    'sovereign', 'investment fund', 'market', 'regulator',
  ];
  const scored = items.map((item) => {
    const text = (item.title + ' ' + item.excerpt).toLowerCase();
    const score = keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
    return { item, score };
  });
  scored.sort((a, b) => b.score - a.score || new Date(b.item.date).getTime() - new Date(a.item.date).getTime());
  return scored.slice(0, limit).map((s) => s.item);
}

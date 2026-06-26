/**
 * Public market quotes for production ticker (no API key required).
 * ARM Holding: Dubai indices, competitor developers, portfolio KPIs.
 */

/** @typedef {{ k: string; v: string; c: number }} TickerRow */

/** Full ticker — live slots (DFM/ADX/Emaar/Damac) overlay Yahoo when available. */
const ARM_MARKET_TICKER = [
  { k: 'DFM', v: '5,318.2', c: 0.41 },
  { k: 'ADX', v: '9,742.6', c: 0.84 },
  { k: 'Emaar', v: 'AED 8.42', c: 1.8 },
  { k: 'Damac', v: 'AED 1.86', c: -0.5 },
  { k: 'DREC Occ.', v: '94.2%', c: 0.4 },
  { k: 'HIVE Occ.', v: '91%', c: 1.2 },
  { k: 'HUNA Pipe.', v: 'AED 124M', c: 12 },
  { k: 'RERA Index', v: '+4.2%', c: 0.3 },
  { k: 'Jebel Ali', v: 'WSP · 2026', c: 0 },
  { k: 'USD/AED', v: '3.6725', c: 0 },
];

const LIVE_QUOTE_KEYS = new Set(['DFM', 'ADX', 'Emaar', 'Damac']);

async function fetchJson(url, timeoutMs = 12_000) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function yahooChangePercent(meta) {
  const price = meta?.regularMarketPrice;
  const prev = meta?.chartPreviousClose ?? meta?.previousClose;
  if (typeof price !== 'number' || typeof prev !== 'number' || prev === 0) return 0;
  return ((price - prev) / prev) * 100;
}

async function yahooQuote(symbol, label, formatter) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
  const data = await fetchJson(url);
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) throw new Error('no price');
  const c = yahooChangePercent(meta);
  return { k: label, v: formatter(meta.regularMarketPrice), c: Math.round(c * 100) / 100 };
}

/**
 * @returns {Promise<TickerRow[]>}
 */
export async function fetchLiveMarketTicker() {
  const liveTasks = [
    yahooQuote('^DFMGI', 'DFM', (p) => p.toLocaleString('en-US', { maximumFractionDigits: 1 }))
      .catch(() => null),
    yahooQuote('^FADGI', 'ADX', (p) => p.toLocaleString('en-US', { maximumFractionDigits: 1 }))
      .catch(() => null),
    yahooQuote('EMAAR.DU', 'Emaar', (p) => `AED ${p.toFixed(2)}`)
      .catch(() => yahooQuote('EMAAR.AE', 'Emaar', (p) => `AED ${p.toFixed(2)}`).catch(() => null)),
    yahooQuote('DAMAC.DU', 'Damac', (p) => `AED ${p.toFixed(2)}`)
      .catch(() => yahooQuote('DAMAC.AE', 'Damac', (p) => `AED ${p.toFixed(2)}`).catch(() => null)),
  ];

  const settled = await Promise.all(liveTasks);
  const liveByKey = Object.fromEntries(settled.filter(Boolean).map((row) => [row.k, row]));

  return ARM_MARKET_TICKER.map((row) => {
    if (LIVE_QUOTE_KEYS.has(row.k) && liveByKey[row.k]) return liveByKey[row.k];
    return row;
  });
}

/**
 * Live regional capital-flow proxy.
 * Uses equity-index daily % change as a directional flow indicator:
 *   GCC → ADX General (^FADGI) + DFM (^DFMGI) blended
 *   United States → S&P 500 (^GSPC)
 *   Singapore → Straits Times Index (^STI)
 *   Europe → Euro Stoxx 50 (^STOXX50E)
 *   South Asia → BSE Sensex (^BSESN)
 *
 * flow score = 50 + (changePercent * 6), clamped 10–99
 * v = formatted daily % change string
 *
 * @returns {Promise<{ k: string; kAr: string; flow: number; v: string; live: boolean }[]>}
 */
export async function fetchLiveCapitalFlows() {
  const REGIONS = [
    { k: 'GCC', kAr: 'الخليج', symbols: ['^FADGI', '^DFMGI'] },
    { k: 'United States', kAr: 'أمريكا', symbols: ['^GSPC'] },
    { k: 'Singapore', kAr: 'سنغافورة', symbols: ['^STI'] },
    { k: 'Europe', kAr: 'أوروبا', symbols: ['^STOXX50E'] },
    { k: 'South Asia', kAr: 'جنوب آسيا', symbols: ['^BSESN'] },
  ];

  async function quoteChange(symbol) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
    const data = await fetchJson(url, 10_000);
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) throw new Error('no price');
    return yahooChangePercent(meta);
  }

  const results = [];

  for (const region of REGIONS) {
    try {
      const changes = await Promise.all(region.symbols.map((s) => quoteChange(s).catch(() => null)));
      const valid = changes.filter((c) => typeof c === 'number');
      if (!valid.length) throw new Error('no data');
      const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
      const flow = Math.min(99, Math.max(10, Math.round(50 + avg * 6)));
      const sign = avg >= 0 ? '+' : '';
      results.push({ k: region.k, kAr: region.kAr, flow, v: `${sign}${avg.toFixed(1)}%`, live: true });
    } catch {
      results.push({ k: region.k, kAr: region.kAr, flow: 50, v: '—', live: false });
    }
  }

  return results;
}

/**
 * Public market quotes for production ticker (no API key required).
 * Falls back gracefully if a feed is unavailable.
 */

/** @typedef {{ k: string; v: string; c: number }} TickerRow */

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
  const rows = [];

  const tasks = [
    yahooQuote('^FADGI', 'ADX General', (p) => p.toLocaleString('en-US', { maximumFractionDigits: 1 }))
      .catch(() => null),
    yahooQuote('^DFMGI', 'DFM', (p) => p.toLocaleString('en-US', { maximumFractionDigits: 1 }))
      .catch(() => null),
    yahooQuote('BZ=F', 'Brent', (p) => `$${p.toFixed(2)}`).catch(() => null),
    yahooQuote('GC=F', 'Gold', (p) => `$${p.toLocaleString('en-US', { maximumFractionDigits: 0 })}`).catch(
      () => null,
    ),
    fetchJson('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true')
      .then((j) => {
        const usd = j?.bitcoin?.usd;
        const ch = j?.bitcoin?.usd_24h_change;
        if (typeof usd !== 'number') throw new Error('btc');
        return {
          k: 'BTC',
          v: `$${usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          c: typeof ch === 'number' ? Math.round(ch * 100) / 100 : 0,
        };
      })
      .catch(() => null),
    yahooQuote('^MSCIEF', 'MSCI EM', (p) => p.toLocaleString('en-US', { maximumFractionDigits: 1 })).catch(
      () => null,
    ),
  ];

  const settled = await Promise.all(tasks);
  for (const row of settled) {
    if (row) rows.push(row);
  }

  rows.push({ k: 'USD/AED', v: '3.6725', c: 0 });

  return rows;
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
      // Fallback: neutral score, honest label
      results.push({ k: region.k, kAr: region.kAr, flow: 50, v: '—', live: false });
    }
  }

  return results;
}

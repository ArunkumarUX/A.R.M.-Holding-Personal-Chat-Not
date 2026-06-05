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

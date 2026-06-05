/**
 * Live GCC market intelligence data.
 * Sources: Yahoo Finance (free), CoinGecko (free), live RSS news.
 * All data carries real timestamps and source URLs for stakeholder verification.
 */

async function fetchJson(url, timeoutMs = 10000) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CSO-AI-Agent/1.0)',
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function pct(price, prev) {
  if (!price || !prev || prev === 0) return null;
  return ((price - prev) / prev) * 100;
}

function fmt(n, decimals = 2) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtPct(n) {
  if (n === null || n === undefined) return '';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${fmt(n, 2)}%`;
}

/** Yahoo Finance quote for a symbol */
async function yahooQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const data = await fetchJson(url);
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) throw new Error(`no price for ${symbol}`);
  const price = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = pct(price, prev);
  return { price, prev, change, currency: meta.currency, symbol, asOf: new Date().toISOString() };
}

/**
 * Fetch live GCC equity indices.
 * Returns { adx, dfm, tadawul, asOf }
 */
export async function fetchGccEquities() {
  const results = await Promise.allSettled([
    yahooQuote('^FADGI'),   // ADX General Index
    yahooQuote('^DFMGI'),   // DFM General Index
    yahooQuote('^TASI'),    // Tadawul (Saudi)
    yahooQuote('^MSCIEFM'), // MSCI Emerging Markets Frontier
  ]);

  const [adxR, dfmR, tasiR, msciR] = results;
  const asOf = new Date().toISOString();

  const adx  = adxR.status  === 'fulfilled' ? adxR.value  : null;
  const dfm  = dfmR.status  === 'fulfilled' ? dfmR.value  : null;
  const tasi = tasiR.status === 'fulfilled' ? tasiR.value : null;
  const msci = msciR.status === 'fulfilled' ? msciR.value : null;

  // Build a human-readable GCC equities summary
  const parts = [];
  if (adx)  parts.push(`ADX ${fmtPct(adx.change)}`);
  if (dfm)  parts.push(`DFM ${fmtPct(dfm.change)}`);
  if (tasi) parts.push(`Tadawul ${fmtPct(tasi.change)}`);

  return {
    adx, dfm, tasi, msci,
    summary: parts.length ? parts.join(' · ') : null,
    asOf,
    sourceLabel: 'Yahoo Finance (live)',
    sourceUrl: 'https://finance.yahoo.com/world-indices',
  };
}

/**
 * Fetch live digital assets data from CoinGecko (free tier, no key).
 * Returns { btc, eth, summary, asOf, sourceUrl }
 */
export async function fetchDigitalAssets() {
  const data = await fetchJson(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple&vs_currencies=usd&include_24hr_change=true&include_market_cap=true',
  );

  const asOf = new Date().toISOString();
  const btc  = data?.bitcoin  ? { price: data.bitcoin.usd,  change24h: data.bitcoin.usd_24h_change,  mcap: data.bitcoin.usd_market_cap  } : null;
  const eth  = data?.ethereum ? { price: data.ethereum.usd, change24h: data.ethereum.usd_24h_change, mcap: data.ethereum.usd_market_cap } : null;
  const sol  = data?.solana   ? { price: data.solana.usd,   change24h: data.solana.usd_24h_change   } : null;

  // 7-day change from alternate endpoint
  let btcWoW = null;
  try {
    const weekly = await fetchJson(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_7d_change=true',
    );
    btcWoW = weekly?.bitcoin?.usd_7d_change ?? null;
  } catch { /* optional */ }

  const parts = [];
  if (btc) parts.push(`BTC ${fmtPct(btc.change24h)} (24h)`);
  if (eth) parts.push(`ETH ${fmtPct(eth.change24h)} (24h)`);
  if (btcWoW !== null) parts.push(`BTC ${fmtPct(btcWoW)} (7d)`);

  return {
    btc, eth, sol,
    btcWoW,
    summary: parts.length ? parts.join(' · ') : null,
    asOf,
    sourceLabel: 'CoinGecko (live)',
    sourceUrl: 'https://www.coingecko.com/en/global-charts',
  };
}

/**
 * Fetch Brent crude price.
 */
export async function fetchOilPrice() {
  try {
    const q = await yahooQuote('BZ=F');
    return {
      brent: q.price,
      change: q.change,
      summary: `Brent $${fmt(q.price, 2)} (${fmtPct(q.change)})`,
      asOf: q.asOf,
      sourceLabel: 'Yahoo Finance (live)',
      sourceUrl: 'https://finance.yahoo.com/quote/BZ=F',
    };
  } catch {
    return null;
  }
}

/**
 * Fetch Gold (XAU/USD) spot price.
 */
export async function fetchGoldPrice() {
  try {
    const q = await yahooQuote('GC=F'); // COMEX Gold Futures
    return {
      price: q.price,
      change: q.change,
      summary: `Gold $${q.price.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${fmtPct(q.change)})`,
      asOf: q.asOf,
      sourceLabel: 'Yahoo Finance (live)',
      sourceUrl: 'https://finance.yahoo.com/quote/GC=F',
    };
  } catch {
    return null;
  }
}

/**
 * Master call: fetch all live market intelligence in parallel.
 * Gracefully handles any individual failure.
 * @returns {Promise<LiveMarketIntel>}
 */
export async function fetchLiveMarketIntel() {
  const [equitiesR, digitalR, oilR, goldR] = await Promise.allSettled([
    fetchGccEquities(),
    fetchDigitalAssets(),
    fetchOilPrice(),
    fetchGoldPrice(),
  ]);

  const equities = equitiesR.status === 'fulfilled' ? equitiesR.value : null;
  const digital  = digitalR.status  === 'fulfilled' ? digitalR.value  : null;
  const oil      = oilR.status      === 'fulfilled' ? oilR.value      : null;
  const gold     = goldR.status     === 'fulfilled' ? goldR.value     : null;

  const asOf = new Date().toISOString();
  const asOfDate = asOf.slice(0, 10);
  const asOfTime = asOf.slice(11, 16) + ' UTC';

  // Build combined market snapshot string
  const snapParts = [];
  if (equities?.summary) snapParts.push(equities.summary);
  if (gold?.summary)     snapParts.push(gold.summary);
  if (oil?.summary)      snapParts.push(oil.summary);
  if (digital?.summary)  snapParts.push(digital.summary);

  // isLive = true only when actual price data came back
  const hasEquityData  = Boolean(equities?.summary);
  const hasDigitalData = Boolean(digital?.summary);
  const hasOilData     = Boolean(oil?.summary);
  const hasGoldData    = Boolean(gold?.summary);
  const isLive = hasEquityData || hasDigitalData || hasOilData || hasGoldData;

  return {
    equities,
    digital,
    oil,
    gold,
    asOf,
    asOfDate,
    asOfTime,
    isLive,
    gccEquitiesSummary: equities?.summary ?? null,
    digitalAssetsSummary: digital?.summary ?? null,
    oilSummary: oil?.summary ?? null,
    goldSummary: gold?.summary ?? null,
    goldSourceUrl: gold?.sourceUrl ?? null,
    fullSummary: snapParts.join(' | ') || null,
  };
}

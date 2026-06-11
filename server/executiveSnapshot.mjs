/**
 * Fresh executive data patch for online refresh (GST / Abu Dhabi dates).
 * Client merges into local state; keeps conversations unless reset requested.
 * When APIFY_TOKEN is set, pulls live headlines from Bloomberg via Apify actor.
 */

import { fetchBloombergCategoryNews } from './apifyBloomberg.mjs';
import { fetchLiveMarketTicker, fetchLiveCapitalFlows } from './liveMarketQuotes.mjs';
import { fetchLiveMarketIntel } from './liveMarketIntel.mjs';
import { fetchAllNewsFeeds, filterGccRelevant, getNewsByTag } from './liveNewsFeeds.mjs';

function gstNow() {
  const now = new Date();
  return new Date(now.getTime() + (now.getTimezoneOffset() + 240) * 60000);
}

function dateOnly(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, days) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function meetingIso(day, hour, minute = 0) {
  const y = day.getFullYear();
  const m = day.getMonth();
  const dom = day.getDate();
  return new Date(Date.UTC(y, m, dom, hour - 4, minute, 0)).toISOString();
}

const MARKET_ROTATION = [
  {
    gccEquities: '+0.8%',
    digitalAssetsWoW: '+12%',
    competitorNote: 'DIFC fintech sandbox expansion announced',
    topSector: 'Climate tech (Falcon Economy priority sector)',
  },
  {
    gccEquities: '+1.1%',
    digitalAssetsWoW: '+9%',
    competitorNote: 'Riyadh fintech licence batch — 14 new approvals',
    topSector: 'Digital assets (FSRA pipeline strong)',
  },
  {
    gccEquities: '+0.4%',
    digitalAssetsWoW: '+15%',
    competitorNote: 'MAS stablecoin consultation — retail rules tightening',
    topSector: 'Sovereign wealth co-investments',
  },
  {
    gccEquities: '+0.6%',
    digitalAssetsWoW: '+11%',
    competitorNote: 'Qatar Fintech Hub — custody standards update',
    topSector: 'Regulatory technology',
  },
];

/** morning = post-08:00 GST · evening = post-22:00 GST */
function resolveDataCycle(explicit, now) {
  if (explicit === 'morning' || explicit === 'evening') return explicit;
  const h = now.getHours();
  if (h >= 22 || h < 8) return 'evening';
  return 'morning';
}

export async function buildExecutiveSnapshotPatch(cycle) {
  const today = gstNow();
  const todayStr = dateOnly(today);
  const dataCycle = resolveDataCycle(cycle, today);
  const dayIdx =
    (today.getDate() + today.getMonth() * 3 + (dataCycle === 'evening' ? 1 : 0)) %
    MARKET_ROTATION.length;

  const meetings = [
    {
      id: 'mtg1',
      title: 'Mubadala leadership — follow-up',
      time: meetingIso(today, 15, 0),
      attendees: 'Khaldoon Al Mubarak, Mubadala CEO',
      location: 'Al Maryah Island',
      prepStatus: 'ready',
    },
    {
      id: 'mtg2',
      title: 'Board risk committee — data policy',
      time: meetingIso(addDays(today, 1), 10, 0),
      attendees: 'Board risk committee',
      location: 'Board room',
      prepStatus: 'pending',
    },
    {
      id: 'mtg3',
      title: 'Singapore MAS delegation',
      time: meetingIso(addDays(today, 2), 15, 0),
      attendees: 'MAS regulatory & market development leads',
      location: 'ADGM Auditorium, Al Maryah',
      prepStatus: 'ready',
    },
  ];

  const actionRegister = [
    {
      id: 'a1',
      title: 'Share digital assets policy update with Mubadala',
      owner: 'Rajiv Sehgal',
      due: dateOnly(addDays(today, -1)),
      status: 'overdue',
      departmentId: 'strategy',
    },
    {
      id: 'a2',
      title: 'Approve retention packages — 2 Strategy roles',
      owner: 'Rajiv Sehgal',
      due: dateOnly(addDays(today, 3)),
      status: 'open',
      departmentId: 'hr',
    },
    {
      id: 'a3',
      title: 'MAS policy comparison note post-consultation',
      owner: 'Policy AI → Rajiv',
      due: dateOnly(addDays(today, 9)),
      status: 'open',
      departmentId: 'policy',
    },
    {
      id: 'a4',
      title: 'Review Arabic ministerial note — HH office',
      owner: 'Rajiv Sehgal',
      due: dateOnly(addDays(today, 2)),
      status: 'open',
    },
  ];

  const documentDates = [
    dateOnly(today),
    dateOnly(addDays(today, -2)),
    dateOnly(addDays(today, -4)),
    dateOnly(addDays(today, -1)),
    dateOnly(addDays(today, -11)),
  ];

  const scheduleLabel =
    dataCycle === 'morning' ? '08:00 GST morning refresh' : '22:00 GST evening refresh';

  let bloomberg = null;
  let liveTicker = null;
  let liveMarketIntel = null;
  let liveNewsItems = [];
  let liveCapitalFlows = null;

  // Fetch all data sources in parallel
  const [bloombergR, tickerR, marketIntelR, newsR, capitalFlowsR] = await Promise.allSettled([
    fetchBloombergCategoryNews(),
    fetchLiveMarketTicker(),
    fetchLiveMarketIntel(),
    fetchAllNewsFeeds(),
    fetchLiveCapitalFlows(),
  ]);

  if (bloombergR.status === 'fulfilled') bloomberg = bloombergR.value;
  else console.warn('[executiveSnapshot] Bloomberg Apify skipped:', bloombergR.reason?.message);

  if (tickerR.status === 'fulfilled') liveTicker = tickerR.value;
  else console.warn('[executiveSnapshot] Live ticker skipped:', tickerR.reason?.message);

  if (marketIntelR.status === 'fulfilled') liveMarketIntel = marketIntelR.value;
  else console.warn('[executiveSnapshot] Live market intel skipped:', marketIntelR.reason?.message);

  if (newsR.status === 'fulfilled') liveNewsItems = newsR.value;
  else console.warn('[executiveSnapshot] Live news feeds skipped:', newsR.reason?.message);

  if (capitalFlowsR.status === 'fulfilled') liveCapitalFlows = capitalFlowsR.value;
  else console.warn('[executiveSnapshot] Capital flows skipped:', capitalFlowsR.reason?.message);

  // Build market snapshot — prefer live data, fall back to rotation
  const fallback = MARKET_ROTATION[dayIdx];
  const asOfLabel = liveMarketIntel?.asOf
    ? `${liveMarketIntel.asOf.slice(0, 10)} ${liveMarketIntel.asOf.slice(11, 16)} UTC`
    : `${todayStr} ${dataCycle === 'morning' ? '08:00' : '22:00'} GST`;

  const gccLive = Boolean(liveMarketIntel?.gccEquitiesSummary);
  const digitalLive = Boolean(liveMarketIntel?.digitalAssetsSummary);
  const gccNewsLead = filterGccRelevant(liveNewsItems, 1)[0];
  const marketNewsLead = getNewsByTag('market', liveNewsItems, 1)[0];
  const newsLead = gccNewsLead ?? marketNewsLead;
  const topSectorLive = Boolean(newsLead) || Boolean(bloomberg?.headline);

  const marketBase = {
    // GCC equities: live indices only — never mix scenario % when crypto is live
    gccEquities: gccLive
      ? liveMarketIntel.gccEquitiesSummary
      : digitalLive || newsLead
        ? 'GCC indices unavailable at refresh'
        : fallback.gccEquities,
    gccEquitiesLive: gccLive,
    gccEquitiesSource: gccLive
      ? liveMarketIntel.equities.sourceLabel
      : 'Scenario data (prototype)',
    gccEquitiesSourceUrl: gccLive ? liveMarketIntel.equities.sourceUrl : null,

    // Digital assets: live CoinGecko when available
    digitalAssetsWoW: digitalLive
      ? liveMarketIntel.digitalAssetsSummary
      : fallback.digitalAssetsWoW,
    digitalAssetsLive: digitalLive,
    digitalAssetsSource: digitalLive
      ? liveMarketIntel.digital.sourceLabel
      : 'Scenario data (prototype)',
    digitalAssetsSourceUrl: digitalLive ? liveMarketIntel.digital.sourceUrl : null,

    // Oil: live Brent
    oilSummary: liveMarketIntel?.oilSummary ?? null,
    oilSourceUrl: liveMarketIntel?.oil?.sourceUrl ?? null,

    // Gold: live COMEX via Yahoo Finance
    goldSummary: liveMarketIntel?.goldSummary ?? null,
    goldSourceUrl: liveMarketIntel?.goldSourceUrl ?? null,

    // Sector / headline line — live news only; no scenario label on market card
    topSector: bloomberg?.headline
      ? `Bloomberg: ${bloomberg.headline.slice(0, 80)}`
      : newsLead
        ? `${newsLead.source}: ${newsLead.title.slice(0, 80)}`
        : gccLive || digitalLive
          ? 'Headline feeds unavailable at refresh'
          : fallback.topSector,
    topSectorLive,

    // Competitor note: prefer Bloomberg live, then competitor RSS, then GCC-relevant wire
    competitorNote: (() => {
      if (bloomberg?.headline) return `Bloomberg: ${bloomberg.headline.slice(0, 120)}`;
      const competitor = getNewsByTag('competitor', liveNewsItems, 1)[0];
      if (competitor) return `${competitor.source}: ${competitor.title.slice(0, 120)}`;
      const gccComp = filterGccRelevant(liveNewsItems, 3).find((i) =>
        /difc|dubai|saudi|qatar|competitor|rival|sandbox/i.test(i.title),
      );
      if (gccComp) return `${gccComp.source}: ${gccComp.title.slice(0, 120)}`;
      return gccLive || digitalLive || newsLead
        ? 'Competitor wire unavailable at refresh'
        : fallback.competitorNote;
    })(),
    competitorNoteLive: Boolean(
      bloomberg?.headline ||
        getNewsByTag('competitor', liveNewsItems, 1)[0] ||
        filterGccRelevant(liveNewsItems, 3).find((i) =>
          /difc|dubai|saudi|qatar|sandbox/i.test(i.title),
        ),
    ),

    // Bloomberg lead if available
    bloombergLead: bloomberg?.headline ?? undefined,

    asOf: asOfLabel,
    isLive: gccLive || digitalLive,
    capitalFlows: liveCapitalFlows ?? null,
    capitalFlowsLive: Boolean(liveCapitalFlows?.some((r) => r.live)),
  };

  // Build news feed groups for signal cards
  const signalNews = {
    market:     getNewsByTag('market', liveNewsItems, 4),
    competitor: getNewsByTag('competitor', liveNewsItems, 3),
    investment: getNewsByTag('investment', liveNewsItems, 3),
    regulatory: getNewsByTag('regulatory', liveNewsItems, 4),
    followup:   getNewsByTag('followup', liveNewsItems, 3),
    gccTop:     filterGccRelevant(liveNewsItems, 5),
  };

  const patch = {
    version: 4,
    lastSync: new Date().toISOString(),
    refreshedAt: new Date().toISOString(),
    timezone: 'Asia/Dubai',
    dataCycle,
    scheduleLabel,
    meetings,
    actionRegister,
    marketSnapshot: marketBase,
    liveMarketIntel: liveMarketIntel ?? undefined,
    signalNews,
    bloombergArticles: bloomberg?.items ?? undefined,
    bloombergFetchedAt: bloomberg?.fetchedAt,
    metrics: {
      queriesThisWeek: null, // Not yet tracked — connect ERP/analytics for live count
      documentsInKb: 52,
      briefingsGenerated: 8,
      avgConfidence: 0.91,
      openActions: actionRegister.filter((a) => a.status !== 'done').length,
    },
    documentUploadedAt: {
      d1: documentDates[0],
      d2: documentDates[1],
      d3: documentDates[2],
      d4: documentDates[3],
      d5: documentDates[4],
    },
    regulatoryHeadline: signalNews.regulatory[0]?.title
      ?? bloomberg?.headline
      ?? signalNews.market.find((i) => /regulat|fsra|mas|fatf|policy|compliance/i.test(i.title))?.title
      ?? (gccLive || digitalLive || newsLead
        ? 'Regulatory wire unavailable at refresh'
        : 'Visit adgm.com/fsra for the latest FSRA guidance'),
    regulatoryHeadlineLive: Boolean(
      signalNews.regulatory[0] ||
        (bloomberg?.headline && /regulat|policy|crypto|stablecoin|vasp/i.test(bloomberg.headline)),
    ),
    liveTicker: liveTicker?.length ? liveTicker : undefined,
    liveTickerFetchedAt: liveTicker?.length ? new Date().toISOString() : undefined,
  };

  return patch;
}

export async function createExecutiveSnapshotResponse(requestUrl) {
  const cycle = requestUrl?.searchParams?.get('cycle') ?? undefined;
  return {
    ok: true,
    patch: await buildExecutiveSnapshotPatch(cycle),
  };
}

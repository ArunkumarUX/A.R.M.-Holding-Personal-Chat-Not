import type { Source } from '../types';
import type { ExecutiveState } from './executiveStore';
import { getSourcesFromHandles } from './executiveStore';
import { enrichSources } from '../utils/sourceLinks';
import { mktHandle } from '../utils/sourceHandles';

/** Shape of a live news item passed from executiveSnapshot */
type LiveNewsItem = {
  title: string;
  url: string;
  date: string;
  source: string;
  sourceUrl: string;
  excerpt: string;
};

/** Convert a live news article into a Source card with a real clickable link */
function newsItemToSource(item: LiveNewsItem, id: string): Source {
  return {
    id,
    kind: 'external',
    sourceType: 'external',
    title: item.title.length > 100 ? item.title.slice(0, 97) + '…' : item.title,
    documentName: item.source,
    date: item.date,
    confidence: 0.92,
    excerpt: item.excerpt?.slice(0, 200) || item.title,
    href: item.url,
    externalUrl: item.url,
    openLabel: `Read on ${item.source}`,
  };
}

/** Intel cards cite real-time market & regulatory feeds only — never knowledge base */
function isRealtimeMarketSource(s: Source): boolean {
  if (s.sourceType === 'knowledge') return false;
  if (s.kind === 'internal' && s.sourceType !== 'external') return false;
  const p = s.handle?.split('-')[0]?.toUpperCase();
  if (p === 'KB' || p === 'ACT' || p === 'CAL' || p === 'CRM') return false;
  return s.kind === 'external' || s.sourceType === 'external' || Boolean(s.externalUrl);
}

function feed(
  id: string,
  title: string,
  documentName: string,
  excerpt: string,
  url: string,
  date: string,
  confidence = 0.88,
): Source {
  return {
    id,
    kind: 'external',
    sourceType: 'external',
    title,
    documentName,
    date,
    confidence,
    excerpt,
    href: url,
    externalUrl: url,
    openLabel: 'Open feed',
  };
}

/** Per-card real-time feeds (public market / regulatory wires) */
function bloombergWireFeeds(state: ExecutiveState, date: string): Source[] {
  const articles = state.bloombergArticles ?? [];
  if (!articles.length) return [];
  return articles.slice(0, 3).map((a, i) =>
    feed(
      `src-bbg-live-${i}`,
      typeof a.headline === 'string' ? a.headline.slice(0, 100) : 'Bloomberg headline',
      'Bloomberg (live wire)',
      typeof a.headline === 'string' ? a.headline : 'Market headline',
      typeof a.url === 'string' && a.url.startsWith('http') ? a.url : 'https://www.bloomberg.com/markets',
      (a.publishedAt ?? date).slice(0, 10),
      0.94,
    ),
  );
}

function realtimeFeedsForSignal(signalId: string, state: ExecutiveState): Source[] {
  const date = state.lastSync.slice(0, 10);
  const snap = state.marketSnapshot;
  const liveBbg = bloombergWireFeeds(state, date);
  const isLiveBbg = liveBbg.length > 0;

  // Live news items from RSS feeds (set by executiveSnapshot)
  const signalNews = (state as any).signalNews as Record<string, LiveNewsItem[]> | undefined;
  const liveMarketIntel = (state as any).liveMarketIntel as any;

  switch (signalId) {
    case 'market': {
      // Prefer Bloomberg → live RSS news → labeled fallback
      if (isLiveBbg) return liveBbg;
      const newsItems: LiveNewsItem[] = signalNews?.market ?? [];
      if (newsItems.length > 0) {
        const sources = newsItems.slice(0, 3).map((item, i) => newsItemToSource(item, `src-market-live-${i}`));
        // Add market data source if live
        if (liveMarketIntel?.equities?.sourceUrl) {
          sources.push(feed(
            'src-gcc-prices',
            `GCC Equities: ${snap.gccEquities}`,
            snap.gccEquitiesSource ?? 'Yahoo Finance (live)',
            `ADX, DFM, Tadawul live prices as of ${snap.asOf}. Source: Yahoo Finance.`,
            snap.gccEquitiesSourceUrl ?? 'https://finance.yahoo.com/world-indices',
            date, 0.95,
          ));
        }
        if (liveMarketIntel?.digital?.sourceUrl) {
          sources.push(feed(
            'src-digital-prices',
            `Digital Assets: ${snap.digitalAssetsWoW}`,
            snap.digitalAssetsSource ?? 'CoinGecko (live)',
            `BTC, ETH live prices as of ${snap.asOf}. Source: CoinGecko.`,
            snap.digitalAssetsSourceUrl ?? 'https://www.coingecko.com',
            date, 0.95,
          ));
        }
        return sources;
      }
      return [
        feed('src-market-scenario', 'GCC market overview — scenario data',
          'Market scenario snapshot (prototype — connect to live feeds)',
          `GCC equities ${snap.gccEquities}; digital assets ${snap.digitalAssetsWoW}. Scenario data only.`,
          'https://www.adgm.com', date, 0.4),
      ];
    }

    case 'competitor': {
      if (isLiveBbg) {
        return [...liveBbg.slice(0, 2),
          feed('src-competitor-note', 'Competitor / market note', 'Bloomberg (live)',
            snap.bloombergLead ?? snap.competitorNote ?? '',
            'https://www.bloomberg.com/markets', date, 0.9),
        ];
      }
      const newsItems: LiveNewsItem[] = signalNews?.competitor ?? [];
      if (newsItems.length > 0) {
        return newsItems.slice(0, 3).map((item, i) => newsItemToSource(item, `src-competitor-live-${i}`));
      }
      return [
        feed('src-competitor-scenario', 'Competitor intelligence — scenario',
          'Market scenario snapshot (prototype)',
          `${snap.competitorNote || 'Scenario data only.'}`,
          'https://www.adgm.com', date, 0.4),
      ];
    }

    case 'investment': {
      if (isLiveBbg) return liveBbg.slice(0, 2);
      const newsItems: LiveNewsItem[] = signalNews?.investment ?? [];
      if (newsItems.length > 0) {
        const sources = newsItems.slice(0, 3).map((item, i) => newsItemToSource(item, `src-investment-live-${i}`));
        if (liveMarketIntel?.digital?.sourceUrl) {
          sources.push(feed('src-crypto-live',
            `Digital assets: ${snap.digitalAssetsWoW}`,
            'CoinGecko (live)', `BTC, ETH market cap data as of ${snap.asOf}.`,
            liveMarketIntel.digital.sourceUrl, date, 0.95));
        }
        return sources;
      }
      return [
        feed('src-investment-scenario', 'Investment signals — scenario data',
          'Market scenario snapshot (prototype)',
          `Sector focus: ${snap.topSector}. Scenario data only.`,
          'https://www.adgm.com', date, 0.4),
      ];
    }

    case 'performance':
      return [
        feed('src-performance-scenario', 'Department performance — scenario data',
          'Internal scenario dataset (prototype — connect ERP for live data)',
          'Illustrative department metrics. Not connected to live ERP or HR systems.',
          'https://www.adgm.com', date, 0.4),
      ];
    case 'regulatory': {
      const newsItems: LiveNewsItem[] = signalNews?.regulatory ?? [];
      const liveSources: Source[] = newsItems.length > 0
        ? newsItems.slice(0, 3).map((item, i) => newsItemToSource(item, `src-regulatory-live-${i}`))
        : [];
      // Always add official portal reference links
      return [
        ...liveSources,
        feed('src-fsra-portal', 'ADGM FSRA — Official Portal',
          'ADGM FSRA (official public portal)',
          'Visit adgm.com/fsra for the latest ADGM FSRA rules, guidance, consultation papers and regulatory announcements.',
          'https://www.adgm.com/fsra', date, 0.95),
        feed('src-mas-portal', 'MAS Singapore — Consultations',
          'MAS Singapore (official public portal)',
          'Visit mas.gov.sg for the latest MAS consultation papers, digital asset regulations and policy publications.',
          'https://www.mas.gov.sg/regulation', date, 0.93),
        feed('src-fatf-portal', 'FATF — Publications',
          'FATF (official public portal)',
          'Visit fatf-gafi.org for official VASP travel rule guidance and AML/CFT standards.',
          'https://www.fatf-gafi.org/en/publications.html', date, 0.92),
      ];
    }

    case 'followup': {
      const newsItems: LiveNewsItem[] = signalNews?.followup ?? [];
      if (newsItems.length > 0) {
        return newsItems.slice(0, 3).map((item, i) => newsItemToSource(item, `src-followup-live-${i}`));
      }
      return [
        feed('src-reuters-deals', 'Reuters — Markets & Deals',
          'Reuters (public news portal)',
          'Visit reuters.com for the latest GCC sovereign fund, deals and regulatory news.',
          'https://www.reuters.com/business/deals', date, 0.88),
        feed('src-gulfnews-policy', 'Gulf News — Business',
          'Gulf News (public news portal)',
          'Visit gulfnews.com for the latest Gulf region policy and business news.',
          'https://gulfnews.com/business', date, 0.86),
      ];
    }
    default:
      return [];
  }
}

/** Live MKT snapshot handle only (Bloomberg / Refinitiv demo feed in grounded registry) */
function liveMarketSnapshotSources(state: ExecutiveState): Source[] {
  const mkt = mktHandle(state.lastSync.slice(0, 10));
  return getSourcesFromHandles(state, [mkt]).filter(isRealtimeMarketSource);
}

/** Resolve panel-ready sources: real-time market feeds only */
export function getSourcesForSignal(signalId: string, state: ExecutiveState): Source[] {
  const snapshot = liveMarketSnapshotSources(state);
  const feeds = realtimeFeedsForSignal(signalId, state);
  const merged = enrichSources([...snapshot, ...feeds], state).filter(isRealtimeMarketSource);

  const seen = new Set<string>();
  return merged.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

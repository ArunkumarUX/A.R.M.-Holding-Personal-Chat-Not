import type { LiveNewsItem } from '../types/marketIntel';
import { plainNewsText, sanitizeNewsText } from '../utils/sanitizeNewsText';
import type { ExecutiveState } from './executiveStore';

export function newsSourceLine(item?: LiveNewsItem | null): string | undefined {
  if (!item) return undefined;
  return `${item.source} · ${item.date}`;
}

export function newsHeadline(item?: LiveNewsItem | null, max = 120): string {
  if (!item?.title) return '';
  const title = sanitizeNewsText(item.title);
  return title.length > max ? `${title.slice(0, max - 1).trim()}…` : title;
}

export function newsBody(item?: LiveNewsItem | null, fallback = ''): string {
  if (!item) return fallback;
  return plainNewsText(item.excerpt, item.title, fallback);
}

export function joinNewsBodies(items: LiveNewsItem[], limit = 3): string {
  return items
    .slice(0, limit)
    .map((i) => sanitizeNewsText(i.title))
    .filter(Boolean)
    .join(' · ');
}

export function countLiveSignals(state: ExecutiveState): number {
  const m = state.marketSnapshot;
  const sn = state.signalNews;
  let n = 0;
  if (m.gccEquitiesLive || m.digitalAssetsLive) n += 1;
  if (m.competitorNoteLive || (sn?.competitor?.length ?? 0) > 0) n += 1;
  if ((sn?.investment?.length ?? 0) > 0 || (sn?.gccTop?.length ?? 0) > 0) n += 1;
  if (m.oilSummary || m.goldSummary || m.gccEquitiesLive) n += 1;
  if ((sn?.regulatory?.length ?? 0) > 0 || state.regulatoryHeadline) n += 1;
  if ((sn?.followup?.length ?? 0) > 0 || (sn?.gccTop?.length ?? 0) > 0) n += 1;
  return n;
}

export function macroPerformanceHeadline(state: ExecutiveState): {
  headline: string;
  headlineSub?: string;
  body: string;
  metric: string;
  metricLabel: string;
  live: boolean;
} {
  const m = state.marketSnapshot;
  const parts: string[] = [];
  if (m.oilSummary) parts.push(m.oilSummary);
  if (m.goldSummary) parts.push(m.goldSummary);
  if (m.gccEquitiesLive && m.gccEquities) parts.push(m.gccEquities);

  const live = parts.length > 0;
  const macroNews = state.signalNews?.market?.[0];

  const oilPct = m.oilSummary?.match(/\(([+-][\d.]+%)\)/)?.[1];
  const goldPct = m.goldSummary?.match(/\(([+-][\d.]+%)\)/)?.[1];
  const metric = oilPct ?? goldPct ?? (m.gccEquitiesLive ? m.gccEquities.match(/([+-][\d.]+%)/)?.[1] : null) ?? '—';

  return {
    headline: parts.length ? parts.slice(0, 2).join(' · ') : macroNews ? newsHeadline(macroNews, 100) : 'Macro data unavailable',
    headlineSub: live
      ? [m.oilSummary ? 'Yahoo Finance · Brent' : null, m.goldSummary ? 'Yahoo Finance · Gold' : null, m.gccEquitiesLive ? 'Yahoo Finance · GCC' : null]
          .filter(Boolean)
          .join(' · ')
      : macroNews ? newsSourceLine(macroNews) : undefined,
    body: live
      ? `Live commodity & index snapshot${m.asOf ? ` as of ${m.asOf}` : ''}.`
      : macroNews
        ? newsBody(macroNews)
        : 'Connect to refresh for live Brent, gold, and GCC index data.',
    metric,
    metricLabel: live ? 'macro 24h' : 'awaiting feed',
    live,
  };
}

import type { LiveNewsItem } from '../types/marketIntel';
import type { ExecutiveState } from './executiveStore';
import {
  formatMarketSignalHeadline,
  marketFreshnessLabel,
  primaryMarketMetric,
} from './formatSignalHeadlines';
import {
  joinNewsBodies,
  macroPerformanceHeadline,
  newsBody,
  newsHeadline,
  newsSourceLine,
} from './prioritySignalHelpers';
import { sanitizeNewsText } from '../utils/sanitizeNewsText';

export type CommandCentreSignal = {
  id: string;
  icon: string;
  tone: 'good' | 'warn' | 'risk' | 'info';
  label: string;
  headline: string;
  headlineSub?: string;
  body: string;
  metric: string;
  metricLabel: string;
  freshnessLabel?: string;
  sourceLine?: string;
  spark: number[];
  deptLink?: string;
  link?: string;
  ar: {
    label: string;
    headline: string;
    headlineSub?: string;
    body: string;
    metricLabel: string;
    freshnessLabel?: string;
    sourceLine?: string;
  };
};

const SPARK = {
  market: [38, 42, 40, 46, 44, 52, 49, 58, 55, 62],
  competitor: [50, 48, 52, 49, 55, 53, 60, 58, 64, 67],
  investment: [30, 34, 40, 38, 46, 52, 60, 66, 74, 82],
  performance: [10, 11, 12, 12, 13, 14, 14, 15, 15, 16],
  regulatory: [2, 3, 2, 4, 3, 5, 4, 6, 5, 7],
  followup: [6, 5, 5, 4, 5, 4, 3, 4, 4, 4],
};

function pickLead(...candidates: (LiveNewsItem | null | undefined)[]): LiveNewsItem | undefined {
  return candidates.find(Boolean) as LiveNewsItem | undefined;
}

function buildMarketBody(m: ExecutiveState['marketSnapshot']): string {
  const parts: string[] = [];
  if (m.topSectorLive && m.topSector) parts.push(sanitizeNewsText(m.topSector));
  else if (m.topSector && !/unavailable/i.test(m.topSector)) parts.push(sanitizeNewsText(m.topSector));
  if (m.asOf) parts.push(`As of ${m.asOf}`);
  if (m.bloombergLead && !m.topSector?.includes(m.bloombergLead.slice(0, 40))) {
    parts.push(sanitizeNewsText(m.bloombergLead));
  }
  if (!m.gccEquitiesLive && m.digitalAssetsLive) {
    parts.push('GCC index feeds unavailable — crypto from CoinGecko is live.');
  }
  return parts.join('. ').replace(/\.\./g, '.').trim();
}

export function deriveCommandCentreSignals(state: ExecutiveState): CommandCentreSignal[] {
  const m = state.marketSnapshot;
  const sn = state.signalNews;
  const marketHead = formatMarketSignalHeadline(m.gccEquities, m.digitalAssetsWoW, {
    gccLive: m.gccEquitiesLive,
    digitalLive: m.digitalAssetsLive,
  });
  const marketLead = pickLead(sn?.market?.[0], sn?.gccTop?.[0]);
  const competitorLead = pickLead(
    sn?.competitor?.[0],
    sn?.gccTop?.find((i) => /difc|dubai|saudi|qatar|sandbox|compet/i.test(i.title)),
  );
  const investmentLead = pickLead(sn?.investment?.[0], sn?.gccTop?.[0]);
  const regulatoryLead = pickLead(sn?.regulatory?.[0]);
  const followupLead = pickLead(sn?.followup?.[0], sn?.gccTop?.[1], sn?.market?.[1]);
  const macro = macroPerformanceHeadline(state);

  const competitorHeadline = competitorLead
    ? newsHeadline(competitorLead)
    : m.competitorNoteLive
      ? m.competitorNote
      : m.competitorNote;

  const regHeadline = regulatoryLead
    ? newsHeadline(regulatoryLead)
    : (state.regulatoryHeadline ?? m.bloombergLead ?? 'Regulatory intelligence');

  const followupItems = [...(sn?.followup ?? []), ...(sn?.gccTop ?? [])].filter(
    (item, idx, arr) => arr.findIndex((x) => x.title === item.title) === idx,
  );

  const metricLabelMarket =
    m.gccEquitiesLive && m.digitalAssetsLive
      ? 'GCC / digital 24h'
      : m.digitalAssetsLive
        ? 'Digital 24h'
        : m.gccEquitiesLive
          ? 'GCC indices'
          : 'GCC / digital 24h';

  return [
    {
      id: 'market',
      icon: 'building-2',
      tone: m.gccEquitiesLive || m.digitalAssetsLive ? 'info' : 'warn',
      label: 'Dubai Property Market',
      headline: marketLead ? newsHeadline(marketLead, 110) : (marketHead.headline || 'Dubai real estate market update'),
      headlineSub: marketLead?.source ?? (marketHead.headlineSub || undefined),
      body: buildMarketBody(m) || newsBody(marketLead, 'Dubai Q1 2026: AED 252B in transactions (+31% YoY). May dipped 19% vs April. Off-plan strong at 30,000 deals / AED 73.4B. Sentiment improving.'),
      metric: primaryMarketMetric(m),
      metricLabel: 'Dubai RE',
      freshnessLabel: marketFreshnessLabel(m),
      sourceLine: marketLead
        ? newsSourceLine(marketLead)
        : 'arabianbusiness.com · gulfnews.com',
      spark: SPARK.market,
      ar: {
        label: 'سوق العقارات في دبي',
        headline: marketLead ? newsHeadline(marketLead, 110) : 'تحديث سوق العقارات في دبي',
        headlineSub: marketLead?.source,
        body: buildMarketBody(m) || 'دبي الربع الأول 2026: 252 مليار درهم (+31٪). مايو تراجع 19٪. العقارات على الخارطة قوية.',
        metricLabel: 'عقارات دبي',
        freshnessLabel: marketFreshnessLabel(m, true),
        sourceLine: marketLead ? newsSourceLine(marketLead) : undefined,
      },
    },
    {
      id: 'competitor',
      icon: 'crosshair',
      tone: 'warn',
      label: 'Developer Watch',
      headline: competitorHeadline.slice(0, 120),
      headlineSub: competitorLead ? competitorLead.source : 'Emaar · Meraas · Nakheel',
      body: competitorLead ? newsBody(competitorLead) : sanitizeNewsText(m.competitorNote),
      metric: String(Math.max(1, sn?.competitor?.length ?? (m.competitorNoteLive ? 1 : 0))),
      metricLabel: competitorLead || m.competitorNoteLive ? 'live headlines' : 'moves to watch',
      sourceLine: competitorLead ? newsSourceLine(competitorLead) : undefined,
      spark: SPARK.competitor,
      ar: {
        label: 'رصد المطورين',
        headline: competitorHeadline.slice(0, 120),
        body: competitorLead ? newsBody(competitorLead) : sanitizeNewsText(m.competitorNote),
        metricLabel: 'عناوين مباشرة',
        sourceLine: competitorLead ? newsSourceLine(competitorLead) : undefined,
      },
    },
    {
      id: 'investment',
      icon: 'map-pin',
      tone: 'good',
      label: 'Jebel Ali & Pipeline',
      headline: investmentLead ? newsHeadline(investmentLead, 100) : 'Jebel Ali Racecourse — ground-break 2026',
      headlineSub: investmentLead?.source ?? 'ARM Holding + BIG + WSP',
      body: investmentLead
        ? `${newsBody(investmentLead)}`.trim()
        : 'ARM Holding + BIG masterplan: 5km² site, 1.5km² central park, Dubai\'s first 10-minute city. WSP appointed Jan 2026 for detailed masterplan. Construction starts 2026.',
      metric: String(Math.max(1, sn?.investment?.length ?? 0)),
      metricLabel: investmentLead ? 'live headlines' : '5km² site',
      sourceLine: investmentLead ? newsSourceLine(investmentLead) : 'dezeen.com · archdaily.com',
      spark: SPARK.investment,
      ar: {
        label: 'جبل علي والمشاريع',
        headline: investmentLead ? newsHeadline(investmentLead, 100) : 'ميدان جبل علي — البدء في 2026',
        headlineSub: investmentLead?.source ?? 'ARM Holding + BIG + WSP',
        body: investmentLead ? newsBody(investmentLead) : 'مشروع ARM Holding + BIG: موقع 5 كم²، حديقة 1.5 كم²، أول مدينة 10 دقائق في دبي.',
        metricLabel: 'عناوين مباشرة',
        sourceLine: investmentLead ? newsSourceLine(investmentLead) : undefined,
      },
    },
    {
      id: 'performance',
      icon: 'gauge',
      tone: macro.live ? 'info' : 'warn',
      label: 'Portfolio Performance',
      headline: macro.live ? macro.headline : 'DREC · HUNA · HIVE — portfolio overview',
      headlineSub: macro.live ? macro.headlineSub : 'Internal · 3 portfolio companies',
      body: macro.live
        ? macro.body
        : 'DREC: 3,200+ units, RERA Smart Rental Index compliance active. HUNA: waterfront launch pending sign-off. HIVE: coliving occupancy 91%. HR attrition at 15.8% — 2 critical roles unfilled.',
      metric: macro.live ? macro.metric : '3',
      metricLabel: macro.live ? macro.metricLabel : 'portfolio cos.',
      freshnessLabel: macro.live ? marketFreshnessLabel(m) : undefined,
      sourceLine: macro.live ? `Yahoo Finance · ${m.asOf ?? 'live'}` : 'Internal · A.R.M. Holding',
      spark: SPARK.performance,
      ar: {
        label: 'أداء المحفظة',
        headline: macro.live ? macro.headline : 'DREC · HUNA · HIVE — نظرة عامة',
        headlineSub: macro.live ? macro.headlineSub : 'داخلي · 3 شركات محفظة',
        body: macro.live ? macro.body : 'DREC: 3,200+ وحدة. HUNA: إطلاق بانتظار الموافقة. HIVE: إشغال 91٪. دوران الموظفين 15.8٪.',
        metricLabel: macro.live ? 'ماكرو 24س' : 'شركات المحفظة',
        freshnessLabel: macro.live ? marketFreshnessLabel(m, true) : undefined,
      },
    },
    {
      id: 'regulatory',
      icon: 'gavel',
      tone: 'warn',
      label: 'RERA & Compliance',
      headline: regulatoryLead ? newsHeadline(regulatoryLead, 110) : 'RERA Smart Rental Index 2026 — compliance active',
      headlineSub: regulatoryLead?.source ?? 'RERA · DLD · Ejari',
      body: regulatoryLead
        ? newsBody(regulatoryLead)
        : 'RERA Smart Rental Index 2026 live: Ejari registration within 30 days mandatory. 90-day notice required for any rent adjustment. Directly affects DREC 3,200+ unit portfolio.',
      metric: String(Math.max(1, sn?.regulatory?.length ?? 0)),
      metricLabel: regulatoryLead ? 'live headlines' : 'RERA / DLD',
      sourceLine: regulatoryLead ? newsSourceLine(regulatoryLead) : 'rera.gov.ae · dld.gov.ae',
      link: 'regulatory',
      spark: SPARK.regulatory,
      ar: {
        label: 'RERA والامتثال',
        headline: regulatoryLead ? newsHeadline(regulatoryLead, 110) : 'مؤشر الإيجار الذكي 2026 — الامتثال ساري',
        body: regulatoryLead ? newsBody(regulatoryLead) : 'مؤشر RERA 2026: تسجيل Ejari خلال 30 يوماً. 90 يوماً إشعار لتعديل الإيجار. يؤثر على 3,200+ وحدة DREC.',
        metricLabel: 'عناوين مباشرة',
        sourceLine: regulatoryLead ? newsSourceLine(regulatoryLead) : undefined,
      },
    },
    {
      id: 'followup',
      icon: 'palette',
      tone: 'info',
      label: 'Culture & Brand',
      headline: followupLead ? newsHeadline(followupLead, 100) : 'We Emerge Stronger — open call closes 25 Jul 2026',
      headlineSub: followupLead?.source ?? 'Art Dubai · A.R.M. Holding',
      body:
        followupItems.length > 0
          ? joinNewsBodies(followupItems, 3)
          : 'Art Dubai open call for HUNA Sculpture Park at H Residence — 30 days remaining. CEO speaking slot decision pending. Commission reflects ARM Holding\'s cultural investment vision.',
      metric: followupItems.length > 0 ? String(followupItems.length) : '30d',
      metricLabel: followupItems.length > 0 ? 'live headlines' : 'to deadline',
      sourceLine: followupLead ? newsSourceLine(followupLead) : 'artdubai.ae · armholding.ae',
      spark: SPARK.followup,
      ar: {
        label: 'الثقافة والعلامة التجارية',
        headline: followupLead ? newsHeadline(followupLead, 100) : 'We Emerge Stronger — النداء المفتوح يغلق 25 يوليو 2026',
        body: followupItems.length > 0 ? joinNewsBodies(followupItems, 3) : 'النداء المفتوح لفن النحت في HUNA — 30 يوماً متبقية. قرار فرصة تحدث الرئيس التنفيذي معلق.',
        metricLabel: followupItems.length > 0 ? 'عناوين مباشرة' : 'للموعد النهائي',
        sourceLine: followupLead ? newsSourceLine(followupLead) : undefined,
      },
    },
  ];
}

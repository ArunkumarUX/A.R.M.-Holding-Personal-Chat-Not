import type { ExecutiveState } from './executiveStore';
import { getDepartment } from './executiveStore';
import {
  formatInvestmentSignalHeadline,
  formatMarketSignalHeadline,
  parseFalconScoreFromSector,
} from './formatSignalHeadlines';

/** Signal card shape used by Executive Home (from refreshed executive state) */
export type CommandCentreSignal = {
  id: string;
  icon: string;
  tone: 'good' | 'warn' | 'risk' | 'info';
  label: string;
  headline: string;
  /** Secondary line under headline (live metrics, Falcon score, etc.) */
  headlineSub?: string;
  body: string;
  metric: string;
  metricLabel: string;
  spark: number[];
  deptLink?: string;
  link?: string;
  ar: {
    label: string;
    headline: string;
    headlineSub?: string;
    body: string;
    metricLabel: string;
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

export function deriveCommandCentreSignals(state: ExecutiveState): CommandCentreSignal[] {
  const m = state.marketSnapshot;
  const hr = getDepartment(state, 'hr');
  const open = state.actionRegister.filter((a) => a.status !== 'done');
  const overdue = open.filter((a) => a.status === 'overdue');
  const attrition = hr?.kpis.find((k) => k.label.toLowerCase().includes('attrition'))?.value ?? '—';
  const regHeadline =
    state.regulatoryHeadline ?? m.bloombergLead ?? 'Regulatory and market intelligence updated';
  const competitorHeadline = m.bloombergLead ?? m.competitorNote;
  const falconScore = parseFalconScoreFromSector(m.topSector);
  const marketHead = formatMarketSignalHeadline(m.gccEquities, m.digitalAssetsWoW);
  const investHead = formatInvestmentSignalHeadline(m.topSector, falconScore);

  return [
    {
      id: 'market',
      icon: 'trending-up',
      tone: 'info',
      label: 'Market Movements',
      headline: marketHead.headline,
      headlineSub: marketHead.headlineSub,
      body: `${m.topSector}. ${m.asOf ? `As of ${m.asOf}.` : ''} ${m.bloombergLead ? m.bloombergLead : ''}`.trim(),
      metric: m.gccEquities.match(/^[+-]/) ? m.gccEquities : m.gccEquities.split(' · ')[0] ?? m.gccEquities,
      metricLabel: 'GCC / digital 24h',
      spark: SPARK.market,
      ar: {
        label: 'تحركات السوق',
        headline: marketHead.headline.replace('GCC equities', 'أسواق الخليج'),
        headlineSub: marketHead.headlineSub.replace('BTC', 'بتكوين').replace('ETH', 'إيثريوم'),
        body: m.competitorNote,
        metricLabel: 'الخليج / رقمي',
      },
    },
    {
      id: 'competitor',
      icon: 'crosshair',
      tone: 'warn',
      label: 'Competitor Activity',
      headline: competitorHeadline.slice(0, 120),
      body: m.competitorNote,
      metric: String(Math.min(9, open.length + 1)),
      metricLabel: 'moves to watch',
      spark: SPARK.competitor,
      ar: {
        label: 'نشاط المنافسين',
        headline: competitorHeadline.slice(0, 120),
        body: m.competitorNote,
        metricLabel: 'تحركات للمتابعة',
      },
    },
    {
      id: 'investment',
      icon: 'sparkles',
      tone: 'good',
      label: 'Investment Opportunities',
      headline: investHead.headline,
      headlineSub: investHead.headlineSub,
      body: `Digital assets ${m.digitalAssetsWoW} on ADGM priorities. Sovereign compute & infrastructure in focus.`,
      metric: falconScore,
      metricLabel: 'Falcon Economy alignment',
      spark: SPARK.investment,
      ar: {
        label: 'فرص الاستثمار',
        headline: investHead.headline,
        headlineSub: investHead.headlineSub.replace('Falcon Economy', 'الاقتصاد الصقور'),
        body: `الأصول الرقمية ${m.digitalAssetsWoW} · أولويات ADGM.`,
        metricLabel: 'توافق الاقتصاد الصقور',
      },
    },
    {
      id: 'performance',
      icon: 'activity',
      tone: overdue.length ? 'risk' : 'warn',
      label: 'Internal Performance Signals',
      headline: `Attrition ${attrition} · ${overdue.length} overdue actions`,
      body: hr?.leadershipActions[0] ?? `${state.metrics.departmentsOnTrack}/9 departments on track.`,
      metric: attrition,
      metricLabel: 'attrition / actions',
      spark: SPARK.performance,
      deptLink: 'hr',
      ar: {
        label: 'مؤشرات الأداء الداخلي',
        headline: `الدوران ${attrition} · ${overdue.length} إجراءات متأخرة`,
        body: hr?.leadershipActions[0] ?? `${state.metrics.departmentsOnTrack}/9 إدارات`,
        metricLabel: 'الدوران / الإجراءات',
      },
    },
    {
      id: 'regulatory',
      icon: 'gavel',
      tone: 'warn',
      label: 'Regulatory Shifts',
      headline: regHeadline.slice(0, 120),
      body: 'High-relevance moves across FSRA, MAS and FATF aligned to ADGM digital-asset framework.',
      metric: '3',
      metricLabel: 'high-relevance',
      spark: SPARK.regulatory,
      link: 'regulatory',
      ar: {
        label: 'تحولات تنظيمية',
        headline: regHeadline.slice(0, 120),
        body: 'تحركات FSRA وMAS وFATF ذات صلة بإطار ADGM.',
        metricLabel: 'عالية الصلة',
      },
    },
    {
      id: 'followup',
      icon: 'list-checks',
      tone: 'info',
      label: 'Follow-Up Actions',
      headline: `${open.length} actions awaiting your decision`,
      body:
        open
          .slice(0, 3)
          .map((a) => a.title)
          .join(' · ') || 'Action register clear.',
      metric: String(open.length),
      metricLabel: 'open items',
      spark: SPARK.followup,
      ar: {
        label: 'إجراءات المتابعة',
        headline: `${open.length} إجراءات بانتظار قرارك`,
        body: open
          .slice(0, 3)
          .map((a) => a.title)
          .join(' · '),
        metricLabel: 'بنود مفتوحة',
      },
    },
  ];
}

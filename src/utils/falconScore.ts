/**
 * Live Falcon Economy alignment score — computed from real app data each render,
 * replacing the previously hardcoded demo value (88).
 *
 * Methodology (max 100):
 *   - Department delivery   (0–50): departments on track / total departments
 *   - Action discipline     (0–30): closed actions ratio, overdue actions penalised
 *   - Market momentum       (0–20): live GCC equities + digital assets WoW direction
 */

import type { ExecutiveState } from '../data/executiveStore';

export type FalconScorePart = {
  label: string;
  labelAr: string;
  value: number;
  max: number;
};

export type FalconScore = {
  score: number;
  parts: FalconScorePart[];
  /** True when the market component used live (Yahoo/CoinGecko) data */
  marketLive: boolean;
  /** One-line plain explanation, suitable for a tooltip */
  tooltip: string;
  tooltipAr: string;
};

function parseSignedPct(s: string | undefined | null): number {
  const m = String(s ?? '').match(/-?\d+(\.\d+)?/);
  if (!m) return 0;
  const n = parseFloat(m[0]);
  // Respect an explicit leading minus elsewhere in the string (e.g. "−1.2%")
  if (/[−-]\s*\d/.test(String(s)) && n > 0) return -n;
  return n;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function computeFalconScore(state: ExecutiveState): FalconScore {
  // 1) Department delivery — 0–50
  const totalDepts = state.departments?.length || 9;
  const onTrack = state.metrics?.departmentsOnTrack ?? 0;
  const deptScore = Math.round(clamp(onTrack / totalDepts, 0, 1) * 50);

  // 2) Action discipline — 0–30
  const actions = state.actionRegister ?? [];
  const total = actions.length;
  const done = actions.filter((a) => a.status === 'done').length;
  const overdue = actions.filter((a) => a.status === 'overdue').length;
  const actionRatio = total > 0 ? done / total : 0.6; // neutral-ish default when register empty
  const actionScore = Math.round(clamp(actionRatio * 30 - overdue * 2, 0, 30));

  // 3) Market momentum — 0–20 (10 = flat; live GCC + digital asset direction moves it)
  const gcc = parseSignedPct(state.marketSnapshot?.gccEquities);
  const digital = parseSignedPct(state.marketSnapshot?.digitalAssetsWoW);
  const momentum = clamp((gcc + digital / 2) * 2, -10, 10);
  const marketScore = Math.round(10 + momentum);
  const marketLive = Boolean(
    state.marketSnapshot?.gccEquitiesLive || state.marketSnapshot?.digitalAssetsLive,
  );

  const score = clamp(deptScore + actionScore + marketScore, 0, 100);

  const parts: FalconScorePart[] = [
    { label: 'Department delivery', labelAr: 'إنجاز الإدارات', value: deptScore, max: 50 },
    { label: 'Action discipline', labelAr: 'انضباط الإجراءات', value: actionScore, max: 30 },
    { label: 'Market momentum', labelAr: 'زخم السوق', value: marketScore, max: 20 },
  ];

  const liveTag = marketLive ? ' (live market data)' : '';
  const tooltip = `Falcon Economy alignment ${score}/100 — ${parts
    .map((p) => `${p.label} ${p.value}/${p.max}`)
    .join(' · ')}${liveTag}`;
  const tooltipAr = `محاذاة الاقتصاد الصقور ${score}/100 — ${parts
    .map((p) => `${p.labelAr} ${p.value}/${p.max}`)
    .join(' · ')}`;

  return { score, parts, marketLive, tooltip, tooltipAr };
}

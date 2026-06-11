/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CcIcon } from '../../command-centre/CcIcon';
import { Emblem, AnimatedNumber, Sparkline, RingGauge, RagPill } from '../../command-centre/CcPrimitives';
import { RadarChart, Donut, MomentumChart, CapitalFlow } from '../../command-centre/CcCharts';
import { mdToNodes } from '../../command-centre/CcMarkdown';
import {
  SIGNALS, DEPARTMENTS, AGENTS, CENTRES, BENCH_DIMS, BRIEF_FORMATS, PLAN, INTEGRATIONS,
  SUGGESTIONS, CANNED, TICKER, MOMENTUM, FLOWS, REGULATORY, KB_CATS, KB_DOCS, DIFFERENTIATION,
} from '../../data/commandCentreData';
import { useApp } from '../../context/AppContext';
import { computeFalconScore } from '../../utils/falconScore';
import { TREND_ICON } from '../../command-centre/utils';
import { IntelCard, IntelCardBody, IntelIconBox } from '../../command-centre/CcCard';
import { CcEscalationPanel } from '../../command-centre/CcEscalationFeed';
import { PerformanceCompanyFilter } from '../../components/performance/PerformanceCompanyFilter';
import { KB_COMPANIES } from '../../config/kbCompanies';
import {
  countRagStatuses,
  getPerformanceDepartments,
  getPerformanceEscalations,
  type PerfCompanyFilter,
} from '../../data/performanceViews';

function DeptCard({ d, lang, onOpen }) {
  const ar = lang === 'ar';
  const toneColor = { good: 'var(--status-good)', warn: 'var(--status-warn)', risk: 'var(--status-risk)' }[d.rag];
  const highRisks = d.risks.filter((r) => r.sev === 'High').length;
  return (
    <IntelCard interactive onClick={() => onOpen(d.id)} style={{ display: 'flex', flexDirection: 'column' }}>
      <IntelCardBody style={{ display: 'flex', flexDirection: 'column', gap: 13, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <IntelIconBox icon={d.icon} color={toneColor} background={'color-mix(in oklab,' + toneColor + ' 13%, transparent)'} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="muted-3 mono" style={{ fontSize: 10.5 }}>DEPT {d.n}</div>
            <div className="type-title" style={{ fontSize: 15.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ar ? d.nameAr : d.name}</div>
          </div>
          <CcIcon name={TREND_ICON[d.trend]} size={17} style={{ color: d.trend === 'up' ? 'var(--status-good)' : d.trend === 'down' ? 'var(--status-risk)' : 'var(--ink-3)', flex: 'none' }} />
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.5, flex: 1 }}>{d.summary}</p>
        <div className="perf-dept-card__foot">
          <RagPill rag={d.rag} lang={lang} />
          {highRisks > 0 && (
            <span className="pill risk" style={{ height: 24 }}>
              <CcIcon name="alert-triangle" size={12} />
              {highRisks} {ar ? 'عالي' : 'high'}
            </span>
          )}
          <div className="perf-dept-card__spark">
            <Sparkline data={d.series} color={toneColor} height={28} fill={false} />
          </div>
        </div>
      </IntelCardBody>
    </IntelCard>
  );
}

function EscalationBanner({ items, ar, onOpen }) {
  if (!items.length) return null;
  return (
    <IntelCard className="intel-card--escalation">
      <IntelCardBody className="esc-intel-body">
        <CcEscalationPanel items={items} ar={ar} onSelect={onOpen} />
      </IntelCardBody>
    </IntelCard>
  );
}

const SEV_COLOR = { High: 'risk', Medium: 'warn', Low: 'info' };

function DeptDetail({ d, lang, onBack }) {
  const ar = lang === 'ar';
  const toneColor = { good: 'var(--status-good)', warn: 'var(--status-warn)', risk: 'var(--status-risk)' }[d.rag];
  const Block = ({ icon, title, children, accent }) => (
    <IntelCard>
      <IntelCardBody>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
          <CcIcon name={icon} size={17} style={{ color: accent || 'var(--accent)' }} />
          <div className="type-title" style={{ fontSize: 15 }}>{title}</div>
        </div>
        {children}
      </IntelCardBody>
    </IntelCard>
  );
  return (
    <div className="grid mi-stagger cc-page perf-page rise" style={{ gap: 20 }}>
      <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onBack}><CcIcon name={ar ? 'arrow-right' : 'arrow-left'} size={15} />{ar ? 'كل الإدارات' : 'All departments'}</button>

      <IntelCard accentColor={toneColor}>
        <div style={{ height: 4, background: toneColor }} aria-hidden />
        <IntelCardBody className="perf-dept-hero" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'color-mix(in oklab,' + toneColor + ' 13%, transparent)', color: toneColor, flex: 'none' }}><CcIcon name={d.icon} size={26} /></div>
          <div className="perf-dept-hero__copy" style={{ flex: 1, minWidth: 0 }}>
            <div className="muted-3 mono" style={{ fontSize: 11 }}>DEPT {d.n} · {ar ? 'يرفع إلى كبير مسؤولي الاستراتيجية' : 'Reports to CSO'}</div>
            <h2 style={{ fontSize: 24 }}>{ar ? d.nameAr : d.name}</h2>
          </div>
          <RagPill rag={d.rag} lang={lang} />
          <div className="perf-dept-hero__chart">
            <div style={{ width: '100%', maxWidth: 130 }}><Sparkline data={d.series} color={toneColor} height={42} /></div>
            <div className="muted-3" style={{ fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase' }}>{ar ? 'آخر 8 فترات' : 'last 8 periods'}</div>
          </div>
        </IntelCardBody>
      </IntelCard>

      {/* KPIs */}
      <Block icon="activity" title={ar ? 'مؤشرات الأداء المتتبعة' : 'KPIs tracked'}>
        <div className="grid perf-detail-kpis">
          {d.kpis.map((k) => {
            const c = { good: 'var(--status-good)', warn: 'var(--status-warn)', risk: 'var(--status-risk)' }[k.tone];
            return (
              <div key={k.k}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                  <span className="muted" style={{ fontSize: 12.5 }}>{k.k}</span>
                  <span className="kpi-num" style={{ fontSize: 15, fontWeight: 600, color: c }}>{k.v}</span>
                </div>
                <div className="track"><span style={{ width: Math.min(k.pct, 100) + '%', background: c }}></span></div>
                {k.note && <div className="muted-3" style={{ fontSize: 11, marginTop: 5 }}>{k.note}</div>}
              </div>
            );
          })}
        </div>
      </Block>

      <div className="grid perf-detail-split">
        <Block icon="award" title={ar ? 'أبرز الإنجازات' : 'Key achievements'} accent="var(--status-good)">
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 11 }}>
            {d.achievements.map((a, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13.5, lineHeight: 1.45 }}>
                <CcIcon name="check-circle-2" size={16} style={{ color: 'var(--status-good)', flex: 'none', marginTop: 1 }} /><span>{a}</span>
              </li>
            ))}
          </ul>
        </Block>
        <Block icon="alert-triangle" title={ar ? 'المخاطر والمخاوف' : 'Concerns & risks'} accent="var(--status-warn)">
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
            {d.risks.map((r, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, lineHeight: 1.45 }}>
                <span className={'pill ' + SEV_COLOR[r.sev]} style={{ height: 21, fontSize: 10, flex: 'none', marginTop: 1 }}>{r.sev}</span><span>{r.t}</span>
              </li>
            ))}
          </ul>
        </Block>
      </div>

      <div className="grid perf-detail-split">
        {d.blockers.length > 0 && (
          <Block icon="construction" title={ar ? 'المعوقات' : 'Blockers'} accent="var(--status-risk)">
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
              {d.blockers.map((b, i) => <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13.5, lineHeight: 1.45 }}><CcIcon name="x-circle" size={16} style={{ color: 'var(--status-risk)', flex: 'none', marginTop: 1 }} /><span>{b}</span></li>)}
            </ul>
          </Block>
        )}
        <Block icon="zap" title={ar ? 'إجراءات قيادية موصى بها' : 'Recommended leadership actions'} accent="var(--accent-bright)">
          <div style={{ display: 'grid', gap: 9 }}>
            {d.actions.map((a, i) => (
              <div key={i} className="perf-action-row">
                <div className="perf-action-row__n kpi-num"><span>{i + 1}</span></div>
                <span className="perf-action-row__text">{a}</span>
                <CcIcon name="arrow-right" size={15} className="muted-3 perf-action-row__arrow" />
              </div>
            ))}
          </div>
        </Block>
      </div>

      <IntelCard className="intel-card--muted">
        <IntelCardBody style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
          <CcIcon name="bell-ring" size={17} style={{ color: 'var(--status-warn)', flex: 'none' }} />
          <span className="muted" style={{ fontSize: 13 }}><strong style={{ color: 'var(--ink)' }}>{ar ? 'عتبة التنبيه:' : 'Alert threshold:'}</strong> {d.alert}</span>
        </IntelCardBody>
      </IntelCard>
    </div>
  );
}

function OrgOverview({ lang, depts }) {
  const ar = lang === 'ar';
  const { executiveState } = useApp();
  const falcon = useMemo(() => computeFalconScore(executiveState), [executiveState]);
  const rag = countRagStatuses(depts);
  const total = depts.length;
  const segs = [
    { value: rag.good, color: 'var(--status-good)', label: ar ? 'على المسار' : 'On track' },
    { value: rag.warn, color: 'var(--status-warn)', label: ar ? 'مراقبة' : 'Watch' },
    { value: rag.risk, color: 'var(--status-risk)', label: ar ? 'إجراء' : 'Action' },
  ].filter((s) => s.value > 0);
  const donutSegs = segs.length ? segs : [{ value: 1, color: 'var(--ink-4)', label: ar ? 'لا بيانات' : 'No data' }];
  return (
    <IntelCard rise>
      <IntelCardBody>
      <div className="perf-org">
        <div className="perf-org__donut">
          <Donut segments={donutSegs} centerTop={total} centerBot={ar ? 'إدارات' : 'depts'} />
          <div className="perf-org__legend">
            {segs.map((s) => (
              <div key={s.label} className="perf-org__legend-row">
                <span className="perf-org__legend-swatch" style={{ background: s.color }} />
                <span className="perf-org__legend-label">{s.label}</span>
                <span className="kpi-num perf-org__legend-value">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="perf-org__momentum">
          <div className="perf-org__momentum-head">
            <div className="eyebrow">{ar ? 'مؤشر الزخم المؤسسي' : 'Organisational momentum index'}</div>
            <div className="perf-org__kpis">
              {[
                { v: falcon.score, l: ar ? 'الاقتصاد الصقور' : 'Falcon Economy', s: '', t: ar ? falcon.tooltipAr : falcon.tooltip },
                { v: 12, l: ar ? 'ساعات/أسبوع موفّرة' : 'hrs/wk saved', s: '', t: undefined },
                { v: 95, l: ar ? 'تغطية الإحاطات' : 'brief coverage', s: '%', t: undefined },
              ].map((m) => (
                <div key={m.l} className="perf-org__kpi" title={m.t}>
                  <div className="kpi-num perf-org__kpi-value">
                    <AnimatedNumber value={m.v} suffix={m.s} />
                  </div>
                  <div className="muted-3 perf-org__kpi-label">{m.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="perf-org__chart">
            <MomentumChart data={MOMENTUM.data} labels={MOMENTUM.labels} height={150} />
          </div>
        </div>
      </div>
      </IntelCardBody>
    </IntelCard>
  );
}

export function PerformanceCommandPage() {
  const { settings } = useApp();
  const lang = settings.language === 'ar' ? 'ar' : 'en';
  const [selected, setSelected] = useState<string | null>(null);
  const [company, setCompany] = useState<PerfCompanyFilter>('all');
  const ar = lang === 'ar';

  const departments = useMemo(() => getPerformanceDepartments(company), [company]);
  const counts = useMemo(() => countRagStatuses(departments), [departments]);
  const escalations = useMemo(() => getPerformanceEscalations(ar, company), [ar, company]);
  const companyMeta = company === 'all' ? null : KB_COMPANIES.find((c) => c.id === company);

  useEffect(() => {
    if (selected && !departments.some((x) => x.id === selected)) setSelected(null);
  }, [selected, departments]);

  const clearCompanyFilter = useCallback(() => setCompany('all'), []);

  const scopeEyebrow =
    company === 'all'
      ? ar
        ? 'إدارة الأداء · كل الإدارات'
        : 'Performance management · all departments'
      : ar
        ? `إدارة الأداء · ${companyMeta?.labelAr ?? ''}`
        : `Performance management · ${companyMeta?.label ?? ''}`;

  const d = selected
    ? departments.find((x) => x.id === selected) ?? DEPARTMENTS.find((x) => x.id === selected)
    : null;
  if (d) return <DeptDetail d={d} lang={lang} onBack={() => setSelected(null)} />;

  return (
    <div className="grid mi-stagger cc-page perf-page" style={{ gap: 22 }}>
      <div className="section-head" style={{ marginBottom: 0 }}>
        <div>
          <div className="eyebrow">{scopeEyebrow}</div>
          <h2 style={{ fontSize: 24, marginTop: 4 }}>{ar ? 'فريقك بالكامل، مباشر، في عرض واحد' : 'Your whole team, live, in one view'}</h2>
        </div>
        <div className="section-head__actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="pill good">{counts.good} {ar ? 'على المسار' : 'on track'}</span>
          <span className="pill warn">{counts.warn} {ar ? 'مراقبة' : 'watch'}</span>
          <span className="pill risk">{counts.risk} {ar ? 'إجراء' : 'action'}</span>
        </div>
      </div>

      <PerformanceCompanyFilter
        company={company}
        ar={ar}
        hasFilter={company !== 'all'}
        onCompanyChange={setCompany}
        onClear={clearCompanyFilter}
      />

      <EscalationBanner items={escalations} ar={ar} onOpen={setSelected} />

      {/* Scenario data disclaimer */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'color-mix(in oklab, var(--warn) 8%, transparent)',
        border: '1px solid color-mix(in oklab, var(--warn) 25%, transparent)',
        borderRadius: 10, padding: '10px 16px', fontSize: 13,
        color: 'var(--fg-muted)',
      }}>
        <CcIcon name="flask-conical" size={16} style={{ color: 'var(--warn)', flexShrink: 0 }} />
        <span>
          {ar
            ? 'بيانات توضيحية · تكامل ERP مخطط (الأسبوع السابع) · ستُستبدل بالبيانات الحية عند الاتصال'
            : 'Illustrative scenario data · ERP integration planned (Week 7) · Will be replaced with live data on connection'}
        </span>
      </div>

      <OrgOverview lang={lang} depts={departments} />
      <div className="grid mi-stagger perf-dept-grid">
        {departments.map((dd) => (
          <DeptCard key={dd.id} d={dd} lang={lang} onOpen={setSelected} />
        ))}
      </div>
    </div>
  );
}


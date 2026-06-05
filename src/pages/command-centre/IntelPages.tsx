/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CcIcon } from '../../command-centre/CcIcon';
import {
  IntelCard,
  IntelCardBody,
  IntelCardHead,
  IntelIconBox,
  IntelList,
  IntelListItem,
  IntelRow,
  IntelRows,
  IntelSectionHead,
} from '../../command-centre/CcCard';
import { Emblem, AnimatedNumber, Sparkline, RingGauge, RagPill } from '../../command-centre/CcPrimitives';
import { RadarChart, Donut, MomentumChart, CapitalFlow } from '../../command-centre/CcCharts';
import { mdToNodes } from '../../command-centre/CcMarkdown';
import {
  SIGNALS, DEPARTMENTS, AGENTS, CENTRES, BENCH_DIMS, BRIEF_FORMATS, PLAN, INTEGRATIONS,
  SUGGESTIONS, CANNED, TICKER, MOMENTUM, FLOWS, REGULATORY, KB_CATS, KB_DOCS, DIFFERENTIATION,
} from '../../data/commandCentreData';
import { useApp } from '../../context/AppContext';
import { generateBriefing } from '../../api/generateBriefing';
import { checkClaudeAvailable } from '../../api/claudeChat';
import { getBriefingConfig } from '../../api/briefingConfig';
import { INTEL_LAYMAN } from '../../data/intelLaymanCopy';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const USE_CLAUDE = import.meta.env.VITE_USE_CLAUDE_API !== 'false';


function MorningBriefing({ lang }) {
  const ar = lang === 'ar';
  const items = ar ? [
    'تدفقات رأس المال الخليجي ارتفعت 4.2٪؛ تحول نحو الائتمان الخاص والأصول الرقمية.',
    'مركز دبي المالي يطلق نظام صناديق مرمزة — يُوصى بتسريع إرشادات FSRA.',
    'البنية التحتية للذكاء الاصطناعي تتصدر الفرص (توافق الاقتصاد الصقور = 92).',
    'عوائد سندات الإمارات لأجل 10 سنوات تنخفض 6 نقاط أساس.',
  ] : [
    'GCC capital flows up 4.2% overnight — rotation toward private credit and digital assets.',
    'DIFC launched a tokenised-fund regime — accelerate FSRA digital-fund guidance.',
    'AI infrastructure tops opportunities (Falcon Economy fit 92) on record VC inflow.',
    'UAE 10Y yields eased 6bps; sovereign-fund allocations active.',
  ];
  return (
    <IntelCard featured rise>
      <IntelCardHead
        icon="sunrise"
        compact
        title={ar ? 'إحاطة الصباح' : 'Morning briefing'}
        subtitle={ar ? 'يُحدَّث 08:00 و22:00 بتوقيت الإمارات' : 'Refreshed 08:00 & 22:00 GST · GCC, capital flows, fintech, digital assets'}
        badge={
          <span className="pill" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', height: 26 }}>
            <span className="dot good pulse" style={{ background: 'var(--aqua)', color: 'var(--aqua)' }} />
            {ar ? 'مباشر' : 'Live'}
          </span>
        }
      />
      <IntelCardBody>
        <IntelList>
          {items.map((t, i) => (
            <IntelListItem key={i} index={i + 1}>
              {t}
            </IntelListItem>
          ))}
        </IntelList>
      </IntelCardBody>
    </IntelCard>
  );
}

function Benchmark({ lang }) {
  const ar = lang === 'ar';
  const centres = CENTRES;
  // overall avg per centre
  const totals = centres.map((_, ci) => Math.round(BENCH_DIMS.reduce((s, d) => s + d.v[ci], 0) / BENCH_DIMS.length));
  const colorFor = (ci) => ci === 0 ? 'var(--accent-bright)' : 'var(--line-strong)';
  return (
    <IntelCard>
      <IntelCardBody>
        <IntelSectionHead
          eyebrow={ar ? 'مقارنة 12 بُعداً' : '12-dimension benchmark'}
          title={ar ? 'سوق أبوظبي مقابل المراكز المالية العالمية' : 'ADGM vs. global financial centres'}
          laymanInfo={ar ? INTEL_LAYMAN.benchmark12.ar : INTEL_LAYMAN.benchmark12.en}
          action={<span className="pill ghost" style={{ color: 'var(--status-info)', borderColor: 'var(--status-info)' }}><CcIcon name="book-open" size={12} />{ar ? 'مصادر: GFCI 37 · WB 2024' : 'Source: GFCI 37 · WB 2024'}</span>}
        />

        {/* legend / overall */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
          {centres.map((c, i) => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: colorFor(i) }}></span>
              <span style={{ fontSize: 12.5, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? 'var(--ink)' : 'var(--ink-2)' }}>{c}</span>
              <span className="kpi-num muted-3" style={{ fontSize: 11 }}>{totals[i]}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          {BENCH_DIMS.map((dim) => {
            const max = Math.max(...dim.v);
            return (
              <div key={dim.d}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{dim.d}</span>
                  {'src' in dim && (
                    <span style={{ fontSize: 10.5, color: 'var(--ink-3)', fontStyle: 'italic' }}>
                      {dim.src}
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gap: 5 }}>
                  {dim.v.map((val, ci) => (
                    <div key={ci} className="bench-bar-row">
                      <span className="bench-bar-row__label" style={{ color: ci === 0 ? 'var(--ink)' : 'var(--ink-3)', fontWeight: ci === 0 ? 700 : 400, textAlign: ar ? 'left' : 'right' }}>{centres[ci]}</span>
                      <div className="track" style={{ flex: 1, height: ci === 0 ? 10 : 7, minWidth: 0 }}>
                        <span style={{ width: val + '%', background: colorFor(ci), opacity: ci === 0 ? 1 : 0.55, transition: 'width 1s cubic-bezier(.22,1,.36,1)' }}></span>
                      </div>
                      <span className="kpi-num bench-bar-row__value" style={{ color: ci === 0 ? 'var(--accent)' : 'var(--ink-3)' }}>{val}</span>
                      {val === max && <CcIcon name="crown" size={13} style={{ color: 'var(--gold-500)', flex: 'none' }} />}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 20, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, borderLeft: '3px solid var(--status-info)' }}>
          <p style={{ margin: 0, fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
            <CcIcon name="book-open" size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            {ar
              ? 'المصادر: مؤشر المراكز المالية العالمية 37 (Z/Yen, مارس 2024) · مؤشر جاهزية الأعمال (البنك الدولي 2024) · تقرير FATF للإمارات 2024 · تقرير PwC للتشفير 2024 · استراتيجية الاقتصاد الصقور 2025–2045. يُرجى التحقق من التقرير المرجعي الداخلي المعتمد قبل الاستخدام الرسمي الخارجي.'
              : 'Sources: Z/Yen GFCI 37 (Mar 2024) · World Bank Business Ready Index 2024 · FATF MER UAE 2024 · PwC Crypto Regulation Report 2024 · Falcon Economy Strategy 2025–2045 · IMF Article IV UAE 2024. Validate against approved internal benchmark report before formal external use.'}
          </p>
        </div>
      </IntelCardBody>
    </IntelCard>
  );
}

function InvestmentOps({ lang }) {
  const ar = lang === 'ar';
  const ops = ar ? [
    { t: 'البنية التحتية للذكاء والحوسبة السيادية', s: 92, note: 'تدفقات قياسية من رأس المال الجريء' },
    { t: 'الائتمان الخاص', s: 86, note: 'تحول خليجي من الدين العام إلى الخاص' },
    { t: 'الأصول الحقيقية المرمزة', s: 84, note: 'نافذة للريادة في الحفظ المؤسسي' },
    { t: 'التمويل المستدام والانتقالي', s: 83, note: 'يتوافق مع تنويع الاقتصاد' },
  ] : [
    { t: 'AI infrastructure & sovereign compute', s: 92, note: 'Record VC inflow; strong Falcon Economy fit' },
    { t: 'Private credit', s: 86, note: 'GCC rotation from public to private debt' },
    { t: 'Tokenised real-world assets', s: 84, note: 'Window to lead on institutional custody' },
    { t: 'Sustainable & transition finance', s: 83, note: 'Aligns with diversification mandate' },
  ];
  return (
    <IntelCard>
      <IntelCardBody>
        <IntelSectionHead
          eyebrow={ar ? 'فرص الاستثمار' : 'Investment opportunities'}
          title={ar ? 'مُقيّمة وفق أولويات أبوظبي الاقتصادية' : 'Scored against Abu Dhabi economic priorities'}
          laymanInfo={ar ? INTEL_LAYMAN.investmentOps.ar : INTEL_LAYMAN.investmentOps.en}
        />
        <IntelRows>
          {ops.map((o, i) => (
            <IntelRow key={i}>
              <RingGauge
                value={o.s}
                size={62}
                color={o.s >= 90 ? 'var(--status-good)' : 'var(--accent-bright)'}
                ariaLabel={
                  ar
                    ? `درجة توافق ${o.s} من 100`
                    : `Alignment score ${o.s} out of 100`
                }
              />
              <div style={{ flex: 1 }}>
                <div className="type-title" style={{ fontSize: 15 }}>{o.t}</div>
                <div className="muted" style={{ fontSize: 13 }}>{o.note}</div>
              </div>
              <span className="kpi-num muted-3" style={{ fontSize: 13 }}>#{i + 1}</span>
            </IntelRow>
          ))}
        </IntelRows>
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, borderLeft: '3px solid var(--status-info)' }}>
          <p style={{ margin: 0, fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
            <CcIcon name="book-open" size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            {ar
              ? 'درجات التوافق مستمدة من استراتيجية الاقتصاد الصقور 2025–2045 (ADDED) وتقرير IMF للإمارات 2024. يُرجى التحقق من أحدث البيانات قبل الاستخدام الرسمي.'
              : 'Alignment scores derived from Falcon Economy Strategy 2025–2045 (ADDED) and IMF Article IV UAE 2024. Verify against latest data before formal use.'}
          </p>
        </div>
      </IntelCardBody>
    </IntelCard>
  );
}

function RadarCard({ lang }) {
  const ar = lang === 'ar';
  const narrow = useMediaQuery('(max-width: 640px)');
  const [ci, setCi] = useState(2); // Singapore by default
  const dims = BENCH_DIMS.map((d) => d.d);
  const aVals = BENCH_DIMS.map((d) => d.v[0]);
  const bVals = BENCH_DIMS.map((d) => d.v[ci]);
  const avg = (vals) => Math.round(vals.reduce((s, x) => s + x, 0) / vals.length);
  return (
    <IntelCard>
      <IntelCardBody>
        <IntelSectionHead
          eyebrow={ar ? 'بصمة تنافسية' : 'Competitive footprint'}
          title={<>{ar ? 'سوق أبوظبي مقابل' : 'ADGM vs.'} {CENTRES[ci]}</>}
          laymanInfo={ar ? INTEL_LAYMAN.competitiveFootprint.ar : INTEL_LAYMAN.competitiveFootprint.en}
          style={{ marginBottom: 6 }}
        />
        <div className="seg mi-intel-viz__seg" role="tablist" aria-label={ar ? 'اختر مركزاً مالياً' : 'Select financial centre'}>
          {CENTRES.slice(1).map((c, i) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={ci === i + 1}
              className={ci === i + 1 ? 'on' : ''}
              onClick={() => setCi(i + 1)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="intel-viz-chart">
          <RadarChart dims={dims} a={{ values: aVals }} b={{ values: bVals }} animKey={ci} size={narrow ? 268 : 320} />
        </div>
        <div className="mi-intel-viz__legend">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 14, height: 4, borderRadius: 2, background: 'var(--accent-bright)' }} />
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>ADGM</span>
            <span className="kpi-num muted-3" style={{ fontSize: 11 }}>{avg(aVals)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 14, height: 0, borderTop: '2px dashed var(--ink-3)' }} />
            <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-2)' }}>{CENTRES[ci]}</span>
            <span className="kpi-num muted-3" style={{ fontSize: 11 }}>{avg(bVals)}</span>
          </div>
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, borderLeft: '3px solid var(--status-info)' }}>
          <p style={{ margin: 0, fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
            <CcIcon name="book-open" size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            {ar
              ? 'المصادر: مؤشر GFCI 37 (Z/Yen, مارس 2024) · مؤشر البنك الدولي 2024 · استراتيجية الاقتصاد الصقور. يُرجى التحقق قبل الاستخدام الرسمي.'
              : 'Source: Z/Yen GFCI 37 (Mar 2024) · World Bank Business Ready 2024 · Falcon Economy Strategy. Validate before formal external use.'}
          </p>
        </div>
      </IntelCardBody>
    </IntelCard>
  );
}

function CapitalFlowCard({ lang }) {
  const ar = lang === 'ar';
  const leader = [...FLOWS].sort((a, b) => b.flow - a.flow)[0];
  return (
    <IntelCard>
      <IntelCardBody>
        <IntelSectionHead
          eyebrow={ar ? 'تدفقات رأس المال' : 'Capital flows'}
          title={ar ? 'تتجه نحو أبوظبي' : 'Rotating toward Abu Dhabi'}
          laymanInfo={ar ? INTEL_LAYMAN.capitalFlows.ar : INTEL_LAYMAN.capitalFlows.en}
          action={
            <span className="pill good" style={{ height: 24 }}>
              <span className="dot good pulse" style={{ color: 'var(--status-good)', background: 'currentColor' }} />
              {ar ? 'مباشر' : 'Live 24h'}
            </span>
          }
          style={{ marginBottom: 6 }}
        />
        <p className="mi-intel-viz__caption">
          {ar ? 'صافي التدفق حسب المصدر · 24 ساعة' : 'Net inflow by source · last 24h'}
        </p>
        <div className="intel-viz-chart">
          <CapitalFlow regions={FLOWS} lang={lang} />
        </div>
        <div className="mi-intel-viz__legend">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 14, height: 4, borderRadius: 2, background: 'var(--accent-bright)' }} />
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>{ar ? leader.kAr : leader.k}</span>
            <span className="kpi-num" style={{ fontSize: 11, color: 'var(--status-good)' }}>{leader.v}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 14, height: 4, borderRadius: 2, background: 'var(--petrol-700)' }} />
            <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-2)' }}>{ar ? 'أبوظبي' : 'Abu Dhabi'}</span>
            <span className="kpi-num muted-3" style={{ fontSize: 11 }}>ADGM</span>
          </div>
        </div>
      </IntelCardBody>
    </IntelCard>
  );
}

export function MarketIntelligencePage() {
  const { settings } = useApp();
  const lang = settings.language === 'ar' ? 'ar' : 'en';
  const ar = lang === 'ar';
  return (
    <div className="grid mi-stagger cc-page" style={{ gap: 22 }}>
      <div className="section-head" style={{ marginBottom: -2 }}>
        <div>
          <div className="eyebrow">{ar ? 'استخبارات السوق الاستراتيجية' : 'Strategic market intelligence'}</div>
          <h2 style={{ fontSize: 24, marginTop: 4 }}>{ar ? 'أين يتحرك رأس المال — وأين تستطيع أبوظبي الريادة' : 'Where capital is moving — and where Abu Dhabi can lead'}</h2>
        </div>
        <span className="pill ghost"><CcIcon name="satellite-dish" size={13} />Bloomberg · Refinitiv</span>
      </div>
      <MorningBriefing lang={lang} />
      <div className="grid mi-intel-viz-pair" style={{ gap: 22 }}>
        <RadarCard lang={lang} />
        <CapitalFlowCard lang={lang} />
      </div>
      <div className="grid cc-grid-split">
        <Benchmark lang={lang} />
        <InvestmentOps lang={lang} />
      </div>
      <IntelCard featured>
        <IntelCardHead
          icon="lightbulb"
          title={ar ? 'كيف تتميّز أبوظبي' : 'How Abu Dhabi can differentiate'}
          subtitle={ar ? 'أفكار استراتيجية قابلة للتنفيذ من بحث المنافسين' : 'Actionable strategic ideas, not generic commentary'}
        />
        <IntelCardBody>
          <div className="intel-grid-2">
            {DIFFERENTIATION.map((x, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <IntelIconBox icon={x.icon} size="sm" color="var(--adgm-blue-500)" background="var(--adgm-blue-100)" />
                <div>
                  <div className="type-title" style={{ fontSize: 14.5, marginBottom: 3 }}>{ar ? x.tAr : x.t}</div>
                  <div className="muted" style={{ fontSize: 12.8, lineHeight: 1.5 }}>{ar ? x.dAr : x.d}</div>
                </div>
              </div>
            ))}
          </div>
        </IntelCardBody>
      </IntelCard>
    </div>
  );
}

// ---------------- Briefings ----------------
export function BriefingsPage() {
  const { settings, executiveState, recordBriefingGenerated, copyMessage } = useApp();
  const lang = settings.language === 'ar' ? 'ar' : 'en';
  const ar = lang === 'ar';
  const [sel, setSel] = useState('premeeting');
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState(null);
  const [claudeLive, setClaudeLive] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef(null);
  const fmt = BRIEF_FORMATS.find((f) => f.id === sel);

  useEffect(() => {
    if (!USE_CLAUDE) return;
    checkClaudeAvailable().then(setClaudeLive);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setBusy(true);
    setOut('');
    setSource(null);
    setCopied(false);
    const cfg = getBriefingConfig(sel);
    try {
      const result = await generateBriefing({
        formatId: sel,
        state: executiveState,
        language: lang,
        signal: ac.signal,
        onToken: (chunk) => {
          setOut((prev) => (prev ?? '') + chunk);
        },
      });
      if (!ac.signal.aborted) {
        setOut(result.text);
        setSource(result.source);
        recordBriefingGenerated();
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
      console.warn('[briefing] generate failed', e);
    } finally {
      if (!ac.signal.aborted) setBusy(false);
    }
  }, [sel, executiveState, lang, recordBriefingGenerated]);

  const handleCopyBrief = useCallback(() => {
    const text = typeof out === 'string' ? out.trim() : '';
    if (!text) return;
    copyMessage(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [copyMessage, out]);

  const canCopy = Boolean(out?.trim()) && !busy;

  return (
    <div className="grid mi-stagger cc-page" style={{ gap: 22 }}>
      <div className="section-head" style={{ marginBottom: -2 }}>
        <div>
          <div className="eyebrow">{ar ? 'مولّد الإحاطات التنفيذية' : 'Executive briefing generator'}</div>
          <h2 style={{ fontSize: 24, marginTop: 4 }}>{ar ? 'إحاطات جاهزة للقرار في ثوانٍ' : 'Decision-ready briefings in seconds'}</h2>
          <p className="muted-3" style={{ margin: '6px 0 0', fontSize: 12.5, maxWidth: 520 }}>
            {claudeLive
              ? ar
                ? 'مدعوم بـ Claude · التقويم · قاعدة المعرفة · سجل الإجراءات (نفس منطق المحادثة)'
                : 'Powered by Claude · calendar · knowledge base · action register (same logic as Chat)'
              : ar
                ? 'ذكاء مؤسسي — قاعدة المعرفة والتقويم وسجل الإجراءات؛ أضف ANTHROPIC_API_KEY للتوليف الحي'
                : 'Institutional intelligence — knowledge base, calendar & action register; add ANTHROPIC_API_KEY for live AI'}
          </p>
        </div>
      </div>
      <div className="grid cc-grid-auto">
        {BRIEF_FORMATS.map((f) => (
          <IntelCard
            key={f.id}
            interactive
            selected={sel === f.id}
            onClick={() => { setSel(f.id); setOut(null); setCopied(false); }}
            style={{ textAlign: 'start', padding: 18, color: 'var(--ink)' }}
          >
            <div className="brief-format-card__head">
              <IntelIconBox
                icon={f.icon}
                color={sel === f.id ? '#fff' : 'var(--accent)'}
                background={sel === f.id ? 'var(--petrol-700)' : 'var(--chip-bg)'}
                size="sm"
              />
              <span className="pill ghost" style={{ marginInlineStart: 'auto', height: 22, fontSize: 10.5, flex: 'none' }}>{f.time}</span>
            </div>
            <div className="type-title" style={{ fontSize: 14.5 }}>{f.name}</div>
            <div className="muted-3" style={{ fontSize: 12, marginTop: 3, lineHeight: 1.4 }}>{f.desc}</div>
          </IntelCard>
        ))}
      </div>

      <IntelCard>
        <IntelCardBody style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', ...(out || busy ? { borderBottom: '1px solid var(--line)' } : {}) }}>
          <CcIcon name={fmt.icon} size={20} style={{ color: 'var(--accent)' }} />
          <div className="cc-flex-grow">
            <div className="type-title">{fmt.name}</div>
            <div className="muted-3" style={{ fontSize: 12.5 }}>{fmt.desc}</div>
          </div>
          {canCopy && (
            <button
              type="button"
              className={`btn btn-ghost${copied ? ' mi-copied' : ''}`}
              onClick={handleCopyBrief}
              aria-label={copied ? (ar ? 'تم النسخ' : 'Copied') : ar ? 'نسخ الإحاطة' : 'Copy briefing'}
              title={copied ? (ar ? 'تم النسخ' : 'Copied') : ar ? 'نسخ إلى الحافظة' : 'Copy to clipboard'}
            >
              <CcIcon name={copied ? 'check' : 'copy'} size={17} />
              {copied ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'نسخ' : 'Copy')}
            </button>
          )}
          <button className="btn btn-primary" onClick={generate} disabled={busy}>
            <CcIcon name={busy ? 'loader' : 'sparkles'} size={17} className={busy ? 'spin' : ''} />{busy ? (ar ? 'يُولّد…' : 'Generating…') : (ar ? 'توليد' : 'Generate')}
          </button>
        </IntelCardBody>
        {(busy || out) && (
          <IntelCardBody borderTop>
            {busy && !out ? (
              <div style={{ display: 'grid', gap: 11 }}>
                {[0, 1, 2, 3].map((i) => <div key={i} className="shimmer" style={{ height: 12, borderRadius: 6, width: ['90%', '100%', '70%', '85%'][i] }}></div>)}
              </div>
            ) : (
              <>
                {source && !busy && (
                  <p className="muted-3" style={{ margin: '0 0 10px', fontSize: 11 }}>
                    {source === 'claude'
                      ? ar
                        ? 'المصدر: Claude · سياق حي'
                        : 'Source: Claude · live context'
                      : source === 'intelligent'
                        ? ar
                          ? 'المصدر: قاعدة المعرفة والتقويم وسجل الإجراءات'
                          : 'Source: knowledge base, calendar & action register'
                        : ar
                          ? 'المصدر: كتالوج الإحاطات المعتمد'
                          : 'Source: approved briefing catalogue'}
                  </p>
                )}
                <div style={{ fontSize: 14.5, color: 'var(--ink-2)' }} className={ar ? 'lang-ar' : ''}>
                  {mdToNodes(out)}
                </div>
              </>
            )}
          </IntelCardBody>
        )}
      </IntelCard>
    </div>
  );
}


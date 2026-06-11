/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { INTEL_LAYMAN } from '../../data/intelLaymanCopy';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const BRIEF_PASTE_PLACEHOLDERS: Record<string, { en: string; ar: string }> = {
  premeeting: {
    en: 'Paste meeting agenda, calendar invite, email trail, or prep notes here…',
    ar: 'الصق جدول الأعمال أو دعوة الاجتماع أو سلسلة البريد أو ملاحظات التحضير هنا…',
  },
  email: {
    en: 'Paste the email you received — we will draft a reply grounded in the knowledge base…',
    ar: 'الصق البريد الوارد — سنصوغ رداً مستنداً إلى قاعدة المعرفة…',
  },
  boardpack: {
    en: 'Paste board pack excerpts, decision papers, or financial highlights…',
    ar: 'الصق مقاطع حزمة المجلس أو أوراق القرارات أو أبرز الأرقام…',
  },
  stakeholder: {
    en: 'Paste stakeholder notes, CRM export, or meeting background…',
    ar: 'الصق ملاحظات صاحب المصلحة أو تصدير CRM أو خلفية الاجتماع…',
  },
};

function IntelSourceNote({ children, className = '', style = undefined }) {
  return (
    <div className={`intel-source-note${className ? ` ${className}` : ''}`} style={style}>
      <p>
        <CcIcon name="book-open" size={12} className="intel-source-note__icon" aria-hidden />
        {children}
      </p>
    </div>
  );
}

function MorningBriefing({ lang }) {
  const { executiveState } = useApp();
  const ar = lang === 'ar';
  const sn = executiveState?.signalNews;
  const m = executiveState?.marketSnapshot;

  // Structured items: { text, source, sourceUrl? } so source renders as a pill
  const liveItems = useMemo(() => {
    const seen = new Set<string>();
    const items: { text: string; source: string; sourceUrl?: string }[] = [];
    const push = (text: string, source: string, sourceUrl?: string) => {
      const key = text.slice(0, 50);
      if (!seen.has(key)) { seen.add(key); items.push({ text, source, sourceUrl }); }
    };

    // 1. Top GCC headline
    const gccLead = sn?.gccTop?.[0];
    if (gccLead) push(gccLead.source + ': ' + gccLead.title, '', gccLead.url);

    // 2. Live market prices
    if (m?.gccEquitiesLive && m.gccEquities && !/unavailable/i.test(m.gccEquities)) {
      push('GCC equities — ' + m.gccEquities, 'Yahoo Finance', m.gccEquitiesSourceUrl ?? undefined);
    } else if (m?.digitalAssetsLive && m.digitalAssetsWoW) {
      push('Digital assets — ' + m.digitalAssetsWoW, 'CoinGecko', m.digitalAssetsSourceUrl ?? undefined);
    }

    // 3. Commodities — source as pill, not in text
    if (m?.goldSummary) {
      push(
        'Commodities — ' + m.goldSummary + (m.oilSummary ? ' · ' + m.oilSummary : ''),
        'Yahoo Finance',
        m.goldSourceUrl ?? undefined,
      );
    }

    // 4. Competitor headline
    const compLead = sn?.competitor?.[0];
    if (compLead) push(compLead.source + ': ' + compLead.title, '', compLead.url);

    // 5. Regulatory headline
    const regLead = sn?.regulatory?.[0];
    if (regLead) push(regLead.source + ': ' + regLead.title, '', regLead.url);

    // 6. Investment headline
    const invLead = sn?.investment?.[0];
    if (invLead) push(invLead.source + ': ' + invLead.title, '', invLead.url);

    // Fill remaining slots
    for (const item of [...(sn?.market ?? []), ...(sn?.gccTop?.slice(1) ?? [])]) {
      if (items.length >= 4) break;
      push(item.source + ': ' + item.title, '', item.url);
    }

    return items.slice(0, 4);
  }, [sn, m]);

  const isLive = liveItems.length > 0;
  const fallback = ar ? [
    { text: 'في انتظار تحديث البيانات — يظهر محتوى مباشر بعد مزامنة 08:00 أو 22:00.', source: '' },
    { text: 'المصادر: Yahoo Finance · CoinGecko · Reuters · Arabian Business · ZAWYA.', source: '' },
  ] : [
    { text: 'Awaiting refresh — live headlines appear after the 08:00 or 22:00 GST sync.', source: '' },
    { text: 'Sources: Yahoo Finance · CoinGecko · Reuters · Arabian Business · ZAWYA · Gulf News.', source: '' },
  ];
  const displayItems = isLive ? liveItems : fallback;

  return (
    <IntelCard featured rise>
      <IntelCardHead
        icon="sunrise"
        compact
        title={ar ? 'إحاطة الصباح' : 'Morning briefing'}
        subtitle={ar
          ? ('يُحدَث 08:00 و 22:00 بتوقيت الإمارات' + (m?.asOf ? ' · ' + m.asOf.slice(0, 10) : ''))
          : ('Refreshed 08:00 & 22:00 GST · GCC, capital flows, fintech, digital assets' + (m?.asOf ? ' · ' + m.asOf.slice(0, 10) : ''))}
        badge={
          isLive ? (
            <span className="pill" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', height: 26 }}>
              <span className="dot good pulse" style={{ background: 'var(--aqua)', color: 'var(--aqua)' }} />
              {ar ? 'مباشر' : 'Live'}
            </span>
          ) : (
            <span className="pill" style={{ background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.55)', height: 26, fontSize: 11 }}>
              {ar ? 'في انتظار التحديث' : 'Awaiting refresh'}
            </span>
          )
        }
      />
      <IntelCardBody>
        <IntelList>
          {displayItems.map((item, i) => (
            <IntelListItem key={i} index={i + 1}>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span>{item.text}</span>
                {item.source && (
                  item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pill ghost"
                      style={{ fontSize: 10.5, height: 20, padding: '0 7px', color: 'var(--accent-bright)', textDecoration: 'none', flexShrink: 0 }}
                    >
                      {item.source}
                    </a>
                  ) : (
                    <span className="pill ghost" style={{ fontSize: 10.5, height: 20, padding: '0 7px', color: 'var(--ink-3)', flexShrink: 0 }}>
                      {item.source}
                    </span>
                  )
                )}
              </span>
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
        <IntelSourceNote style={{ marginTop: 20 }}>
          {ar
            ? 'المصادر: مؤشر المراكز المالية العالمية 37 (Z/Yen, مارس 2024) · مؤشر جاهزية الأعمال (البنك الدولي 2024) · تقرير FATF للإمارات 2024 · تقرير PwC للتشفير 2024 · استراتيجية الاقتصاد الصقور 2025–2045. يُرجى التحقق من التقرير المرجعي الداخلي المعتمد قبل الاستخدام الرسمي الخارجي.'
            : 'Sources: Z/Yen GFCI 37 (Mar 2024) · World Bank Business Ready Index 2024 · FATF MER UAE 2024 · PwC Crypto Regulation Report 2024 · Falcon Economy Strategy 2025–2045 · IMF Article IV UAE 2024. Validate against approved internal benchmark report before formal external use.'}
        </IntelSourceNote>
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
        <IntelSourceNote>
          {ar
            ? 'درجات التوافق مستمدة من استراتيجية الاقتصاد الصقور 2025–2045 (ADDED) وتقرير IMF للإمارات 2024. يُرجى التحقق من أحدث البيانات قبل الاستخدام الرسمي.'
            : 'Alignment scores derived from Falcon Economy Strategy 2025–2045 (ADDED) and IMF Article IV UAE 2024. Verify against latest data before formal use.'}
        </IntelSourceNote>
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
        <IntelSourceNote>
          {ar
            ? 'المصادر: مؤشر GFCI 37 (Z/Yen, مارس 2024) · مؤشر البنك الدولي 2024 · استراتيجية الاقتصاد الصقور. يُرجى التحقق قبل الاستخدام الرسمي.'
            : 'Source: Z/Yen GFCI 37 (Mar 2024) · World Bank Business Ready 2024 · Falcon Economy Strategy. Validate before formal external use.'}
        </IntelSourceNote>
      </IntelCardBody>
    </IntelCard>
  );
}

function CapitalFlowCard({ lang }) {
  const ar = lang === 'ar';
  const { executiveState } = useApp();
  const liveFlows = executiveState?.marketSnapshot?.capitalFlows;
  const isLive = executiveState?.marketSnapshot?.capitalFlowsLive ?? false;
  const regions = (liveFlows && liveFlows.length > 0) ? liveFlows : FLOWS;
  const leader = [...regions].sort((a, b) => b.flow - a.flow)[0];
  const asOf = executiveState?.marketSnapshot?.asOf;
  return (
    <IntelCard>
      <IntelCardBody>
        <IntelSectionHead
          eyebrow={ar ? 'تدفقات رأس المال' : 'Capital flows'}
          title={ar ? 'تتجه نحو أبوظبي' : 'Rotating toward Abu Dhabi'}
          laymanInfo={ar ? INTEL_LAYMAN.capitalFlows.ar : INTEL_LAYMAN.capitalFlows.en}
          action={
            isLive ? (
              <span className="pill good" style={{ height: 24 }}>
                <CcIcon name="satellite-dish" size={12} />
                {ar ? 'مباشر · Yahoo Finance' : 'Live · Yahoo Finance'}
              </span>
            ) : (
              <span className="pill ghost" style={{ height: 24, color: 'var(--ink-3)' }}>
                <CcIcon name="loader" size={12} />
                {ar ? 'في انتظار التحديث' : 'Awaiting refresh'}
              </span>
            )
          }
          style={{ marginBottom: 6 }}
        />
        <p className="mi-intel-viz__caption">
          {isLive
            ? (ar ? `تغيّر مؤشر الأسهم اليومي · ${asOf ?? ''}` : `Equity index daily % change · ${asOf ?? ''}`)
            : (ar ? 'في انتظار بيانات المؤشر المباشرة' : 'Awaiting live index data')}
        </p>
        <div className="intel-viz-chart">
          <CapitalFlow regions={regions} lang={lang} />
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
        {isLive && (
          <IntelSourceNote>
            {ar
              ? 'المصدر: ADX · DFM · S&P 500 · STI · يورو ستوكس 50 · BSE Sensex · Yahoo Finance'
              : 'Source: ADX · DFM · S&P 500 · STI · Euro Stoxx 50 · BSE Sensex · Yahoo Finance'}
          </IntelSourceNote>
        )}
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
  const [userInput, setUserInput] = useState('');
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState(null);
  const [copied, setCopied] = useState(false);
  const [pasteExpanded, setPasteExpanded] = useState(true);
  const abortRef = useRef(null);
  const fmt = BRIEF_FORMATS.find((f) => f.id === sel);

  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setPasteExpanded(false);
    setBusy(true);
    setOut('');
    setSource(null);
    setCopied(false);
    try {
      const result = await generateBriefing({
        formatId: sel,
        state: executiveState,
        language: lang,
        userPaste: userInput,
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
  }, [sel, executiveState, lang, userInput, recordBriefingGenerated]);

  const handleCopyBrief = useCallback(() => {
    const text = typeof out === 'string' ? out.trim() : '';
    if (!text) return;
    copyMessage(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [copyMessage, out]);

  const canCopy = Boolean(out?.trim()) && !busy;
  const hasOutput = busy || Boolean(out?.trim());
  const canGenerate = Boolean(userInput.trim()) && !busy;
  const pasteCollapsed = busy || !pasteExpanded;
  const pastePreview = userInput.trim().replace(/\s+/g, ' ').slice(0, 88);
  const pastePlaceholder = BRIEF_PASTE_PLACEHOLDERS[sel]?.[ar ? 'ar' : 'en'] ?? BRIEF_PASTE_PLACEHOLDERS.premeeting.en;

  return (
    <div className="briefings-page cc-page mi-stagger">
      <header className="briefings-page__header">
        <div className="briefings-page__header-copy">
          <div className="eyebrow">{ar ? 'مولّد الإحاطات التنفيذية' : 'Executive briefing generator'}</div>
          <h2>{ar ? 'إحاطات جاهزة للقرار في ثوانٍ' : 'Decision-ready briefings in seconds'}</h2>
          <p className="briefings-page__lede">
            {ar
              ? 'الصق جدول أعمال أو بريداً أو مستنداً، ثم ولّد إحاطة مستندة إلى قاعدة المعرفة المؤسسية.'
              : 'Paste an agenda, email, or document excerpt — then generate a briefing grounded in the institutional knowledge base.'}
          </p>
        </div>
        <div className="briefings-page__meta">
          <span className="briefings-page__meta-item">
            <CcIcon name="clock-3" size={15} />
            {fmt?.time}
          </span>
        </div>
      </header>

      <div className="briefings-page__layout">
        <aside className="briefings-page__picker" aria-label={ar ? 'أنواع الإحاطات' : 'Briefing formats'}>
          <p className="briefings-page__picker-label">{ar ? 'نوع الإحاطة' : 'Briefing type'}</p>
          <div className="briefings-page__formats">
            {BRIEF_FORMATS.map((f) => {
              const selected = sel === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`briefings-page__format${selected ? ' briefings-page__format--on' : ''}`}
                  aria-pressed={selected}
                  onClick={() => {
                    setSel(f.id);
                    setOut(null);
                    setSource(null);
                    setCopied(false);
                    setPasteExpanded(true);
                  }}
                >
                  <span className="briefings-page__format-icon" aria-hidden>
                    <IntelIconBox
                      icon={f.icon}
                      color={selected ? '#fff' : 'var(--accent)'}
                      background={selected ? 'var(--petrol-700)' : 'var(--chip-bg)'}
                      size="sm"
                    />
                  </span>
                  <span className="briefings-page__format-body">
                    <span className="briefings-page__format-row">
                      <span className="briefings-page__format-name">{f.name}</span>
                      <span className="briefings-page__format-time">{f.time}</span>
                    </span>
                    <span className="briefings-page__format-desc">{f.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="briefings-page__workspace" aria-live="polite">
          <IntelCard className="briefings-page__panel">
            <IntelCardBody className="briefings-page__toolbar">
              <div className="briefings-page__toolbar-main">
                <div className="briefings-page__toolbar-icon" aria-hidden>
                  <CcIcon name={fmt?.icon ?? 'file-text'} size={17} />
                </div>
                <div className="briefings-page__toolbar-copy">
                  <h3 className="briefings-page__panel-title">{fmt?.name}</h3>
                  <p className="briefings-page__panel-desc">{fmt?.desc}</p>
                </div>
              </div>
            </IntelCardBody>

            <div
              className={`briefings-page__input-wrap${pasteCollapsed ? ' briefings-page__input-wrap--collapsed' : ''}${busy ? ' briefings-page__input-wrap--disabled' : ''}`}
              aria-busy={busy}
            >
              <button
                type="button"
                className="briefings-page__input-toggle"
                onClick={() => !busy && setPasteExpanded((open) => !open)}
                disabled={busy}
                aria-expanded={!pasteCollapsed}
                aria-controls="briefing-paste-body"
              >
                <span className="briefings-page__input-toggle-label">
                  {ar ? 'الصق المحتوى' : 'Paste your content'}
                </span>
                {pasteCollapsed && pastePreview && (
                  <span className="briefings-page__input-toggle-preview" title={userInput.trim()}>
                    {pastePreview}
                    {userInput.trim().length > pastePreview.length ? '…' : ''}
                  </span>
                )}
                <CcIcon
                  name={pasteCollapsed ? 'chevron-down' : 'chevron-up'}
                  size={16}
                  className="briefings-page__input-toggle-icon"
                  aria-hidden
                />
              </button>

              <div id="briefing-paste-body" className="briefings-page__input-body" hidden={pasteCollapsed}>
                <label className="briefings-page__input-label sr-only" htmlFor="briefing-paste">
                  {ar ? 'الصق المحتوى' : 'Paste your content'}
                </label>
                <textarea
                  id="briefing-paste"
                  className="briefings-page__input"
                  rows={5}
                  value={userInput}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    if (out) setOut(null);
                    setCopied(false);
                  }}
                  placeholder={pastePlaceholder}
                  disabled={busy}
                  spellCheck
                />
                <IntelSourceNote className="intel-source-note--inset">
                  {ar
                    ? 'يُولَّد من المحتوى الملصق + قاعدة المعرفة (Falcon Economy، ADGM، FSRA، وغيرها).'
                    : 'Generated from your paste + knowledge base (Falcon Economy, ADGM, FSRA, and related docs).'}
                </IntelSourceNote>
                <div className="briefings-page__input-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={generate}
                    disabled={!canGenerate}
                    title={!userInput.trim() ? (ar ? 'الصق المحتوى أولاً' : 'Paste content first') : undefined}
                  >
                    <CcIcon name={busy ? 'loader' : 'sparkles'} size={17} className={busy ? 'spin' : ''} />
                    {busy ? (ar ? 'يُولّد…' : 'Generating…') : (ar ? 'توليد' : 'Generate')}
                  </button>
                </div>
              </div>
            </div>

            {hasOutput && (
            <div className="briefings-page__output briefings-page__output--filled">
              <div className="briefings-page__output-head">
                <div className="briefings-page__output-meta">
                  {busy ? (
                    <div className="briefings-page__generating" role="status" aria-live="polite">
                      <div className="briefings-page__generating-bars" aria-hidden>
                        <span />
                        <span />
                        <span />
                      </div>
                      <p className="briefings-page__generating-label">
                        {ar ? 'جارٍ توليد الإحاطة…' : 'Generating your briefing…'}
                      </p>
                    </div>
                  ) : (
                    source && (
                      <IntelSourceNote className="intel-source-note--compact">
                        {source === 'claude' || source === 'intelligent'
                          ? ar
                            ? 'المصدر: المحتوى الملصق + قاعدة المعرفة المؤسسية'
                            : 'Source: pasted content + institutional knowledge base'
                          : ar
                            ? 'المصدر: كتالوج الإحاطات المعتمد'
                            : 'Source: approved briefing catalogue'}
                      </IntelSourceNote>
                    )
                  )}
                </div>
                <div className="briefings-page__output-actions">
                  {canCopy && (
                    <button
                      type="button"
                      className={`btn btn-ghost${copied ? ' mi-copied' : ''}`}
                      onClick={handleCopyBrief}
                      aria-label={copied ? (ar ? 'تم النسخ' : 'Copied') : ar ? 'نسخ الإحاطة' : 'Copy briefing'}
                    >
                      <CcIcon name={copied ? 'check' : 'copy'} size={17} />
                      {copied ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'نسخ' : 'Copy')}
                    </button>
                  )}
                </div>
              </div>

              {busy && !out?.trim() && (
                <div className="briefings-page__skeleton" aria-hidden>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="shimmer briefings-page__skeleton-line"
                      style={{ width: ['42%', '88%', '76%', '94%', '68%'][i] }}
                    />
                  ))}
                </div>
              )}

              {out?.trim() && (
                <div className={`briefings-page__content${ar ? ' lang-ar' : ''}`}>
                  {mdToNodes(out)}
                </div>
              )}
            </div>
            )}
          </IntelCard>
        </section>
      </div>
    </div>
  );
}


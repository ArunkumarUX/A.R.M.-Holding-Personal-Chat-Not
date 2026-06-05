/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CcIcon } from '../../command-centre/CcIcon';
import { buildKbCorpus, humanizeFileName } from '../../command-centre/kbCorpus';
import { KbFiltersRow } from '../../components/knowledge/KbFiltersRow';
import { KB_COMPANIES, getKbCompany } from '../../config/kbCompanies';
import { Emblem, AnimatedNumber, Sparkline, RingGauge, RagPill } from '../../command-centre/CcPrimitives';
import { RadarChart, Donut, MomentumChart, CapitalFlow } from '../../command-centre/CcCharts';
import { mdToNodes } from '../../command-centre/CcMarkdown';
import {
  SIGNALS, DEPARTMENTS, AGENTS, CENTRES, BENCH_DIMS, BRIEF_FORMATS, PLAN, INTEGRATIONS,
  SUGGESTIONS, CANNED, TICKER, MOMENTUM, FLOWS, REGULATORY, KB_CATS, KB_DOCS, DIFFERENTIATION,
} from '../../data/commandCentreData';
import { useApp } from '../../context/AppContext';
import { IntelCard, IntelCardBody, IntelIconBox } from '../../command-centre/CcCard';


const TOPIC_ICON = { 'Digital assets': 'bitcoin', 'Funds': 'layers', 'AML': 'shield-alert', 'Capital markets': 'candlestick-chart', 'Fintech': 'cpu', 'Sustainable finance': 'leaf', 'Banking': 'landmark' };
const REL_TONE = { High: 'risk', Medium: 'warn', Low: 'info' };

function RegulatoryView({ lang, onAsk }) {
  const ar = lang === 'ar';
  const [filter, setFilter] = useState('all');
  const bodies = ['FSRA', 'FCA', 'SEC', 'MAS', 'HKMA', 'BIS', 'IOSCO', 'FATF', 'CSSF'];
  const items = REGULATORY.filter((r) => filter === 'all' || (filter === 'high' && r.rel === 'High'));
  const highCount = REGULATORY.filter((r) => r.rel === 'High').length;
  return (
    <div className="grid mi-stagger cc-page" style={{ gap: 22 }}>
      <div className="section-head" style={{ marginBottom: -2 }}>
        <div>
          <div className="eyebrow">{ar ? 'استخبارات تنظيمية وسياسات' : 'Regulatory & policy intelligence'}</div>
          <h2 style={{ fontSize: 24, marginTop: 4 }}>{ar ? 'مراقب التغيّرات التنظيمية' : 'Regulatory change monitor'}</h2>
        </div>
        <span className="pill ghost"><CcIcon name="rss" size={13} />{ar ? 'يُستوعب خلال 4 ساعات' : 'Ingested within 4 hours'}</span>
      </div>

      <IntelCard>
        <IntelCardBody className="regulatory-summary__body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
          <IntelIconBox icon="gavel" />
          <div style={{ minWidth: 0 }}>
            <div className="type-title" style={{ fontSize: 15 }}>{ar ? '12 جهة اختصاص مُراقَبة' : '12 jurisdictions monitored'}</div>
            <div className="muted-3" style={{ fontSize: 12 }}>{ar ? 'مراقبة مباشرة عبر Policy AI' : 'Live monitoring via Policy AI'}</div>
          </div>
        </div>
        <div className="regulatory-summary__chips">
          {bodies.map((b) => <span key={b} className="pill ghost" style={{ height: 26, fontSize: 11 }}>{b}</span>)}
        </div>
        <div className="seg">
          <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>{ar ? 'الكل' : 'All'} {REGULATORY.length}</button>
          <button className={filter === 'high' ? 'on' : ''} onClick={() => setFilter('high')}>{ar ? 'عالية' : 'High'} {highCount}</button>
        </div>
      </IntelCardBody>
      </IntelCard>

      <div className="grid" style={{ gap: 12 }}>
        {items.map((r, i) => (
          <IntelCard
            key={i}
            interactive
            onClick={() => onAsk((ar ? 'حلّل أثر هذا التطور التنظيمي على سوق أبوظبي: ' : 'Analyse the impact of this regulatory development on ADGM: ') + (ar ? r.titleAr : r.title))}
          >
            <IntelCardBody className="reg-item__body">
              <IntelIconBox icon={TOPIC_ICON[r.topic] || 'file-text'} size="lg" background="color-mix(in oklab, var(--accent-bright) 12%, transparent)" />
              <div className="reg-item__main">
                <div className="reg-item__meta">
                  <span className="pill ghost" style={{ height: 22, fontSize: 10.5, fontWeight: 600 }}>{r.body}</span>
                  <span className="muted-3" style={{ fontSize: 12 }}>{r.region}</span>
                  <span className="muted-3" style={{ fontSize: 12 }}>·</span>
                  <span className="muted-3" style={{ fontSize: 12 }}>{r.topic}</span>
                  <span className={'pill ' + REL_TONE[r.rel]} style={{ height: 22, fontSize: 10.5 }}>{ar ? 'الصلة' : 'Relevance'}: {r.rel}</span>
                </div>
                <div className="type-title" style={{ fontSize: 15.5, marginBottom: 6, overflowWrap: 'anywhere' }}>{ar ? r.titleAr : r.title}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: 0 }}>
                  <CcIcon name="sparkles" size={14} style={{ color: 'var(--accent-bright)', flex: 'none', marginTop: 2 }} />
                  <span className="muted" style={{ fontSize: 13, lineHeight: 1.5, overflowWrap: 'anywhere' }}>{ar ? r.impactAr : r.impact}</span>
                </div>
              </div>
              {!ar && <div className="muted-3 reg-item__date">{r.date}</div>}
            </IntelCardBody>
          </IntelCard>
        ))}
      </div>
    </div>
  );
}

export function RegulatoryMonitorPage() {
  const { settings, startNewChat } = useApp();
  const navigate = useNavigate();
  const lang = settings.language === 'ar' ? 'ar' : 'en';
  const onAsk = (q: string) => {
    startNewChat();
    navigate(`/chat?seed=${encodeURIComponent(q)}`);
  };
  return <RegulatoryView lang={lang} onAsk={onAsk} />;
}

function KbStatusPill({ status, ar }) {
  if (status === 'uploading') {
    return (
      <span className="pill info kb-status-pill">
        <CcIcon name="upload" size={12} className="kb-status-pill__pulse" />
        {ar ? 'جارٍ الرفع' : 'Uploading'}
      </span>
    );
  }
  if (status === 'processing') {
    return (
      <span className="pill warn kb-status-pill">
        <CcIcon name="loader-circle" size={12} className="kb-status-pill__spin" />
        {ar ? 'معالجة' : 'Processing'}
      </span>
    );
  }
  if (status === 'error') {
    return <span className="pill risk kb-status-pill">{ar ? 'فشل' : 'Failed'}</span>;
  }
  return (
    <span className="pill good kb-status-pill">
      <span className="dot good" style={{ background: 'currentColor' }} />
      {ar ? 'جاهز' : 'Ready'}
    </span>
  );
}

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getKbPortalHost() {
  if (typeof document === 'undefined') return null;
  return (
    document.querySelector('.command-centre-app.app') ||
    document.querySelector('.command-centre-app') ||
    document.body
  );
}

function renderKbPortal(node) {
  const host = getKbPortalHost();
  if (!host) return node;
  return createPortal(node, host);
}

function buildUploadName(displayTitle, fileName) {
  const ext = fileName.match(/\.[^.]+$/)?.[0] ?? '';
  const base = displayTitle.trim().replace(/\.(pdf|docx?|xlsx|xls)$/i, '').trim();
  if (!base) return fileName;
  return `${base}${ext}`;
}

function KbUploadProgress({ phase, ar, compact }) {
  const steps = ar
    ? [
        { key: 'uploading', label: 'رفع الملف' },
        { key: 'processing', label: 'معالجة' },
        { key: 'ready', label: 'جاهز' },
      ]
    : [
        { key: 'uploading', label: 'Uploading' },
        { key: 'processing', label: 'Processing' },
        { key: 'ready', label: 'Ready' },
      ];
  const order = ['uploading', 'processing', 'ready'];
  const idx = order.indexOf(phase);

  if (compact) {
    return (
      <div className="kb-progress kb-progress--compact" role="status" aria-live="polite">
        <div className="kb-progress__track" aria-hidden>
          <span
            className="kb-progress__fill"
            style={{ width: `${((idx + 1) / steps.length) * 100}%` }}
          />
        </div>
        <span className="kb-progress__compact-label muted-3">{steps[idx]?.label}</span>
      </div>
    );
  }

  return (
    <div className="kb-progress" role="status" aria-live="polite">
      <div className="kb-progress__track" aria-hidden>
        <span
          className="kb-progress__fill"
          style={{ width: `${((idx + 1) / steps.length) * 100}%` }}
        />
      </div>
      <ol className="kb-progress__steps">
        {steps.map((s, i) => {
          const done = i < idx;
          const active = s.key === phase;
          return (
            <li
              key={s.key}
              className={
                'kb-progress__step' +
                (done ? ' kb-progress__step--done' : '') +
                (active ? ' kb-progress__step--active' : '')
              }
            >
              <span className="kb-progress__dot">
                {done ? <CcIcon name="check" size={12} /> : i + 1}
              </span>
              <span>{s.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function KbUploadFlowSteps({ ar, flowPhase }) {
  const steps = ar
    ? [
        { id: 'file', label: 'الملف' },
        { id: 'details', label: 'التفاصيل' },
        { id: 'upload', label: 'الرفع' },
      ]
    : [
        { id: 'file', label: 'File' },
        { id: 'details', label: 'Details' },
        { id: 'upload', label: 'Upload' },
      ];

  const activeIdx =
    flowPhase === 'details'
      ? 1
      : flowPhase === 'uploading' || flowPhase === 'processing'
        ? 2
        : flowPhase === 'ready'
          ? 3
          : 0;

  return (
    <ol className="kb-upload-steps" aria-label={ar ? 'مراحل الرفع' : 'Upload steps'}>
      {steps.map((s, i) => {
        const complete = flowPhase === 'ready' || i < activeIdx;
        const active = i === activeIdx && flowPhase !== 'ready';
        return (
          <li
            key={s.id}
            className={
              'kb-upload-steps__item' +
              (complete ? ' kb-upload-steps__item--done' : '') +
              (active ? ' kb-upload-steps__item--active' : '')
            }
          >
            <span className="kb-upload-steps__dot" aria-hidden>
              {complete && !active ? <CcIcon name="check" size={11} /> : i + 1}
            </span>
            <span className="kb-upload-steps__label">{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function KbUploadSheet({
  open,
  ar,
  onClose,
  pendingFile,
  pendingFileSize,
  pendingTitle,
  pendingCat,
  pendingCompany,
  pendingDate,
  catLabel,
  companyLabel,
  submitPhase,
  pickFile,
  onTitleChange,
  onCatChange,
  onCompanyChange,
  onDateChange,
  onSubmit,
  onClearFile,
  onDone,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}) {
  const busy = Boolean(submitPhase);
  const isReady = submitPhase === 'ready';
  const displayName = pendingTitle?.trim() || (pendingFile ? humanizeFileName(pendingFile) : '');

  const formComplete = Boolean(pendingCompany && pendingCat && pendingDate && pendingTitle?.trim());
  const flowPhase = isReady
    ? 'ready'
    : submitPhase || 'details';

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (isReady) onDone();
        else if (!busy) onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, busy, isReady, onClose, onDone]);

  useEffect(() => {
    if (!open || busy || !pendingFile) return;
    const t = window.setTimeout(() => {
      const el = document.querySelector('.kb-upload-panel__form .kb-upload-panel__input');
      el?.focus();
    }, 380);
    return () => window.clearTimeout(t);
  }, [open, busy, pendingFile]);

  if (!open) return null;

  const phaseTitle = isReady
    ? ar
      ? 'المستند جاهز'
      : 'Document ready'
    : submitPhase === 'processing'
      ? ar
        ? 'جارٍ المعالجة والفهرسة…'
        : 'Processing & indexing…'
      : submitPhase === 'uploading'
        ? ar
          ? 'جارٍ رفع المستند…'
          : 'Uploading your document…'
        : null;

  const closeBackdrop = isReady ? onDone : busy ? undefined : onClose;

  return renderKbPortal(
    <div className="kb-sheet-layer kb-sheet-layer--open" role="presentation">
      <div
        className="kb-sheet-layer__backdrop"
        role="button"
        tabIndex={busy && !isReady ? -1 : 0}
        aria-label={ar ? 'إغلاق' : 'Close'}
        onClick={closeBackdrop}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            closeBackdrop?.();
          }
        }}
      />
      <aside
        className="kb-sheet kb-sheet--upload"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-upload-sheet-title"
      >
        <header className="kb-sheet__head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>
              {ar ? 'مستند جديد' : 'New document'}
            </div>
            <h2 id="kb-upload-sheet-title" className="kb-sheet__title" style={{ marginTop: 0 }}>
              {busy
                ? ar
                  ? 'جارٍ الإضافة للمستودع'
                  : 'Adding to knowledge base'
                : ar
                  ? 'تفاصيل المستند'
                  : 'Document details'}
            </h2>
            {!busy ? (
              <p className="kb-sheet__subtitle muted-3">
                {ar
                  ? 'اختر الشركة والمجموعة والتاريخ، ثم ارفع إلى مستودع تلك الشركة.'
                  : 'Select company, category, and date — documents upload to that company’s repository.'}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="kb-sheet__close btn btn-ghost btn-sm"
            onClick={isReady ? onDone : onClose}
            disabled={busy && !isReady}
            aria-label={ar ? 'إغلاق' : 'Close'}
          >
            <CcIcon name="x" size={18} />
          </button>
        </header>

        <KbUploadFlowSteps ar={ar} flowPhase={flowPhase} />

        <div className="kb-sheet__body kb-upload-panel">
          {submitPhase ? (
            <div
              className={
                'kb-upload-panel__phase mi-pop' + (isReady ? ' kb-upload-panel__phase--done' : '')
              }
            >
              <div className={'kb-upload-panel__phase-icon' + (isReady ? ' kb-upload-panel__phase-icon--done' : '')}>
                {isReady ? (
                  <CcIcon name="check" size={28} />
                ) : (
                  <IntelIconBox icon={submitPhase === 'processing' ? 'loader-circle' : 'upload'} size="lg" />
                )}
              </div>
              <p className="type-title" style={{ fontSize: 15, margin: '12px 0 4px' }}>
                {phaseTitle}
              </p>
              {displayName ? (
                <p className="kb-upload-panel__phase-file">{displayName}</p>
              ) : null}
              {companyLabel && !isReady ? (
                <span className="pill ghost kb-upload-panel__phase-cat">{companyLabel}</span>
              ) : null}
              {catLabel && !isReady ? (
                <span className="pill ghost kb-upload-panel__phase-cat">{catLabel}</span>
              ) : null}
              <p className="muted" style={{ margin: '12px 0 16px', fontSize: 13 }}>
                {isReady
                  ? ar
                    ? 'متاح الآن للبحث والذكاء الاصطناعي مع الاستشهادات.'
                    : 'Available for search and AI with source citations.'
                  : ar
                    ? 'رفع ← معالجة ← جاهز في المستودع المعتمد'
                    : 'Upload → Processing → Ready in approved repository'}
              </p>
              <KbUploadProgress phase={isReady ? 'ready' : submitPhase} ar={ar} />
            </div>
          ) : !pendingFile ? (
            <button
              type="button"
              className={'kb-upload-drop' + (dragOver ? ' kb-upload-drop--active' : '')}
              onClick={pickFile}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <span className="kb-upload-drop__icon">
                <CcIcon name="upload" size={26} />
              </span>
              <span className="kb-upload-drop__title">
                {dragOver
                  ? ar
                    ? 'أفلت الملف هنا'
                    : 'Drop file here'
                  : ar
                    ? 'اختر ملفاً من جهازك'
                    : 'Choose a file from your device'}
              </span>
              <span className="kb-upload-drop__hint muted-3">
                {ar ? 'PDF · DOCX · XLSX — أو اسحب وأفلت' : 'PDF · DOCX · XLSX — or drag and drop'}
              </span>
            </button>
          ) : (
            <div className="kb-upload-panel__form kb-upload-panel__form--enter">
              <div className="kb-upload-panel__file mi-pop">
                <CcIcon name="file-text" size={22} style={{ color: 'var(--accent-bright)', flex: 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="kb-upload-panel__file-name">{pendingFile}</div>
                  {pendingFileSize ? (
                    <div className="kb-upload-panel__file-meta muted-3">{pendingFileSize}</div>
                  ) : null}
                  <button type="button" className="kb-upload-panel__change" onClick={pickFile}>
                    {ar ? 'تغيير الملف' : 'Change file'}
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={onClearFile}
                  aria-label={ar ? 'إزالة' : 'Remove'}
                >
                  <CcIcon name="x" size={16} />
                </button>
              </div>

              <label className="kb-upload-panel__field">
                <span className="kb-upload-panel__label">{ar ? 'الشركة' : 'Company'} *</span>
                <select
                  className="kb-upload-panel__input"
                  value={pendingCompany}
                  onChange={(e) => onCompanyChange(e.target.value)}
                >
                  <option value="">{ar ? 'اختر شركة…' : 'Select company…'}</option>
                  {KB_COMPANIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {ar ? c.labelAr : c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="kb-upload-panel__field">
                <span className="kb-upload-panel__label">{ar ? 'عنوان العرض' : 'Display title'} *</span>
                <input
                  type="text"
                  className="kb-upload-panel__input"
                  value={pendingTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder={ar ? 'مثال: حزمة مجلس الربع الأول 2026' : 'e.g. Q1 2026 board pack'}
                />
              </label>

              <label className="kb-upload-panel__field">
                <span className="kb-upload-panel__label">{ar ? 'المجموعة' : 'Category'} *</span>
                <select
                  className="kb-upload-panel__input"
                  value={pendingCat}
                  onChange={(e) => onCatChange(e.target.value)}
                >
                  <option value="">{ar ? 'اختر مجموعة…' : 'Select category…'}</option>
                  {KB_CATS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {ar ? c.labelAr : c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="kb-upload-panel__field">
                <span className="kb-upload-panel__label">{ar ? 'تاريخ المستند' : 'Document date'} *</span>
                <input
                  type="date"
                  className="kb-upload-panel__input"
                  value={pendingDate}
                  onChange={(e) => onDateChange(e.target.value)}
                />
              </label>

              <p className="kb-upload-panel__note muted-3">
                {ar
                  ? 'يُفهرس المستند للبحث والذكاء الاصطناعي مع الاستشهادات بعد المعالجة.'
                  : 'Document will be indexed for search and AI with citations after processing.'}
              </p>
            </div>
          )}
        </div>

        <footer className="kb-sheet__foot kb-upload-panel__foot">
          {isReady ? (
            <button type="button" className="btn btn-primary" onClick={onDone}>
              <CcIcon name="check" size={16} />
              {ar ? 'تم' : 'Done'}
            </button>
          ) : !submitPhase && pendingFile ? (
            <button
              type="button"
              className={'btn btn-primary kb-upload-submit' + (formComplete ? ' kb-upload-submit--ready' : '')}
              disabled={!formComplete}
              onClick={onSubmit}
            >
              <CcIcon name="upload" size={16} />
              {ar ? 'رفع المستند' : 'Upload document'}
            </button>
          ) : null}
          {!isReady ? (
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
              {ar ? 'إلغاء' : 'Cancel'}
            </button>
          ) : null}
        </footer>
      </aside>
    </div>,
  );
}

function KbDocSheet({ doc, cat, company, ar, onClose, onAsk, onDelete }) {
  const ready = doc.status === 'ready';
  const busy = doc.status === 'uploading' || doc.status === 'processing';

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return renderKbPortal(
    <div className="kb-sheet-layer kb-sheet-layer--open" role="presentation">
      <div
        className="kb-sheet-layer__backdrop"
        role="button"
        tabIndex={0}
        aria-label={ar ? 'إغلاق' : 'Close'}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClose();
          }
        }}
      />
      <aside className="kb-sheet kb-sheet--detail" role="dialog" aria-modal="true" aria-labelledby="kb-sheet-title">
        <header className="kb-sheet__head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <KbStatusPill status={doc.status} ar={ar} />
            <h2 id="kb-sheet-title" className="kb-sheet__title">{doc.t}</h2>
          </div>
          <button type="button" className="kb-sheet__close btn btn-ghost btn-sm" onClick={onClose} aria-label={ar ? 'إغلاق' : 'Close'}>
            <CcIcon name="x" size={18} />
          </button>
        </header>
        <div className="kb-sheet__body">
          <div className="kb-sheet__tags">
            <span className="kb-sheet__topic pill ghost">
              <span className="kb-sheet__dot" style={{ background: company?.color ?? cat.color }} />
              {ar ? company?.labelAr ?? company?.label : company?.label}
            </span>
            <span className="kb-sheet__topic pill ghost">
              <span className="kb-sheet__dot" style={{ background: cat.color }} />
              {ar ? cat.labelAr : cat.label}
            </span>
          </div>
          <p className="kb-sheet__meta-line muted-3">
            {doc.date} · <span className="mono">{doc.pages}p</span> · {doc.by}
          </p>
          {busy ? (
            <div className="kb-sheet__progress-wrap">
              <KbUploadProgress
                phase={doc.status === 'uploading' ? 'uploading' : 'processing'}
                ar={ar}
              />
              <p className="kb-sheet__processing muted">
                {doc.status === 'uploading'
                  ? ar
                    ? 'يتم رفع الملف إلى المستودع المعتمد…'
                    : 'Uploading your file to the approved repository…'
                  : ar
                    ? 'جارٍ الفهرسة للبحث والذكاء الاصطناعي…'
                    : 'Indexing for search and AI…'}
              </p>
            </div>
          ) : doc.summary ? (
            <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{doc.summary}</p>
          ) : null}
        </div>
        <footer className="kb-sheet__foot">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!ready}
            onClick={() => onAsk((ar ? 'لخّص المستند: ' : 'Summarise the document: ') + doc.t)}
          >
            <CcIcon name="sparkles" size={16} />
            {ar ? 'تلخيص' : 'Summarise'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!ready}
            onClick={() => onAsk((ar ? 'اسأل عن: ' : 'Ask about: ') + doc.t)}
          >
            <CcIcon name="message-circle" size={16} />
            {ar ? 'اسأل' : 'Ask'}
          </button>
          {doc.isUpload && onDelete ? (
            <button
              type="button"
              className="btn btn-ghost kb-sheet__delete"
              onClick={() => onDelete(doc)}
            >
              <CcIcon name="trash-2" size={16} />
              {ar ? 'حذف' : 'Delete'}
            </button>
          ) : null}
        </footer>
      </aside>
    </div>,
  );
}

function KbDocTable({ docs, catMap, companyMap, ar, onOpen, onAsk, onDelete }) {
  return (
    <div className="kb-table-wrap">
      <table className="kb-table">
        <colgroup>
          <col className="kb-col-doc" />
          <col className="kb-col-company" />
          <col className="kb-col-topic" />
          <col className="kb-col-status" />
          <col className="kb-col-date" />
          <col className="kb-col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">{ar ? 'المستند' : 'Document'}</th>
            <th scope="col">{ar ? 'الشركة' : 'Company'}</th>
            <th scope="col">{ar ? 'المجموعة' : 'Topic'}</th>
            <th scope="col">{ar ? 'الحالة' : 'Status'}</th>
            <th scope="col">{ar ? 'تاريخ' : 'Updated'}</th>
            <th scope="col" className="kb-table__actions-h">
              <span className="sr-only">{ar ? 'إجراءات' : 'Actions'}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => {
            const c = catMap[d.cat] ?? catMap.general;
            const co = companyMap[d.companyId] ?? companyMap.adgm;
            const ready = d.status === 'ready';
            const busy = d.status === 'uploading' || d.status === 'processing';
            return (
              <tr
                key={d.id}
                className={
                  'kb-table__row' +
                  (busy ? ' kb-table__row--busy' : '') +
                  (d.status === 'uploading' ? ' kb-table__row--uploading' : '')
                }
              >
                <td>
                  <button type="button" className="kb-table__doc" onClick={() => onOpen(d)}>
                    <IntelIconBox
                      icon={
                        d.status === 'uploading'
                          ? 'upload'
                          : d.status === 'processing'
                            ? 'loader-circle'
                            : 'file-text'
                      }
                      size="sm"
                      color={c.color}
                      background={'color-mix(in oklab, ' + c.color + ' 12%, transparent)'}
                    />
                    <span>
                      <span className="kb-table__title">{d.t}</span>
                      <span className="kb-table__sub muted-3">
                        <span className="mono">{d.pages}p</span>
                        <span aria-hidden> · </span>
                        <span>{d.by}</span>
                      </span>
                      {busy ? (
                        <span className="kb-table__mini-bar" aria-hidden>
                          <span
                            className={
                              'kb-table__mini-fill' +
                              (d.status === 'uploading' ? ' kb-table__mini-fill--upload' : '')
                            }
                          />
                        </span>
                      ) : null}
                    </span>
                  </button>
                </td>
                <td>
                  <span className="kb-table__company pill ghost">
                    <span className="kb-table__topic-dot" style={{ background: co.color }} />
                    {ar ? co.labelAr : co.label}
                  </span>
                </td>
                <td>
                  <span className="kb-table__topic">
                    <span className="kb-table__topic-dot" style={{ background: c.color }} />
                    {ar ? c.labelAr : c.label}
                  </span>
                </td>
                <td className="kb-table__status-cell">
                  <KbStatusPill status={d.status} ar={ar} />
                </td>
                <td className="kb-table__date muted-3">{d.date}</td>
                <td className="kb-table__actions">
                  <button
                    type="button"
                    className="kb-table__icon-btn"
                    title={ar ? 'تلخيص' : 'Summarise'}
                    disabled={!ready}
                    onClick={() => onAsk((ar ? 'لخّص المستند: ' : 'Summarise the document: ') + d.t)}
                  >
                    <CcIcon name="sparkles" size={16} />
                  </button>
                  <button
                    type="button"
                    className="kb-table__icon-btn"
                    title={ar ? 'فتح' : 'Open'}
                    onClick={() => onOpen(d)}
                  >
                    <CcIcon name={ar ? 'chevron-left' : 'chevron-right'} size={16} />
                  </button>
                  {d.isUpload && onDelete ? (
                    <button
                      type="button"
                      className="kb-table__icon-btn kb-table__icon-btn--danger"
                      title={ar ? 'حذف' : 'Delete'}
                      onClick={() => onDelete(d)}
                    >
                      <CcIcon name="trash-2" size={16} />
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function KnowledgeBaseView({ lang, onAsk }) {
  const ar = lang === 'ar';
  const { documents, uploadDocument, removeKnowledgeBaseDocument } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileRef = useRef(null);
  const [company, setCompany] = useState('all');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [sheetDoc, setSheetDoc] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingFileSize, setPendingFileSize] = useState('');
  const [pendingTitle, setPendingTitle] = useState('');
  const [pendingCat, setPendingCat] = useState('');
  const [pendingCompany, setPendingCompany] = useState('');
  const [pendingDate, setPendingDate] = useState(todayIso);
  const [submitPhase, setSubmitPhase] = useState(null);
  const [trackingId, setTrackingId] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const readyAutoCloseRef = useRef(false);

  const corpus = useMemo(() => buildKbCorpus(documents, ar), [documents, ar]);
  const catMap = Object.fromEntries(KB_CATS.map((c) => [c.id, c]));
  const companyMap = Object.fromEntries(KB_COMPANIES.map((c) => [c.id, c]));
  const query = q.trim().toLowerCase();

  useEffect(() => {
    const docId = searchParams.get('doc');
    if (!docId) return;
    const match = corpus.find((d) => d.id === docId || d.fileId === docId);
    if (match) setSheetDoc(match);
    setSearchParams({}, { replace: true });
  }, [corpus, searchParams, setSearchParams]);

  const filtered = corpus.filter((d) => {
    if (company !== 'all' && d.companyId !== company) return false;
    if (cat !== 'all' && d.cat !== cat) return false;
    if (query && !d.t.toLowerCase().includes(query)) return false;
    return true;
  });

  const isSearchMode = Boolean(query);
  const sheetCat = sheetDoc ? catMap[sheetDoc.cat] ?? catMap.general : null;
  const sheetCompany = sheetDoc ? companyMap[sheetDoc.companyId] : null;
  const hasFilters = company !== 'all' || cat !== 'all' || query;
  const busyCount = corpus.filter(
    (d) => d.status === 'uploading' || d.status === 'processing',
  ).length;

  const pickFile = () => fileRef.current?.click();

  const applyChosenFile = (f, { openSheet = true } = {}) => {
    if (!f) return;
    setPendingFile(f.name);
    setPendingFileSize(formatFileSize(f.size));
    setPendingTitle(humanizeFileName(f.name));
    setPendingCat('');
    setPendingCompany(company !== 'all' ? company : '');
    setPendingDate(todayIso());
    setSubmitPhase(null);
    setTrackingId(null);
    if (openSheet) setUploadOpen(true);
  };

  const onFileChosen = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const replacing = Boolean(pendingFile && uploadOpen);
    applyChosenFile(f, { openSheet: true });
    if (!replacing) setSheetDoc(null);
  };

  const resetPending = () => {
    setPendingFile(null);
    setPendingFileSize('');
    setPendingTitle('');
    setPendingCat('');
    setPendingCompany('');
    setPendingDate(todayIso());
    setSubmitPhase(null);
    setTrackingId(null);
    setDragOver(false);
  };

  const finishUpload = useCallback(() => {
    readyAutoCloseRef.current = false;
    setPendingFile(null);
    setPendingFileSize('');
    setPendingTitle('');
    setPendingCat('');
    setPendingCompany('');
    setPendingDate(todayIso());
    setSubmitPhase(null);
    setTrackingId(null);
    setDragOver(false);
    setUploadOpen(false);
  }, []);

  const closeUpload = () => {
    if (submitPhase && submitPhase !== 'ready') return;
    if (submitPhase === 'ready') {
      finishUpload();
      return;
    }
    resetPending();
    setUploadOpen(false);
  };

  const openUpload = () => {
    setSheetDoc(null);
    resetPending();
    if (company !== 'all') setPendingCompany(company);
    setUploadOpen(false);
    // Picker only on click — slider opens after a file is chosen (see onFileChosen).
    fileRef.current?.click();
  };

  useEffect(() => {
    if (!trackingId) return;
    const doc = documents.find((d) => d.id === trackingId);
    if (!doc) return;
    if (doc.status === 'uploading') setSubmitPhase('uploading');
    else if (doc.status === 'processing') setSubmitPhase('processing');
    else if (doc.status === 'ready') setSubmitPhase('ready');
    else if (doc.status === 'error') {
      setSubmitPhase(null);
      setTrackingId(null);
    }
  }, [documents, trackingId]);

  useEffect(() => {
    if (submitPhase !== 'ready') {
      readyAutoCloseRef.current = false;
      return;
    }
    if (readyAutoCloseRef.current) return;
    readyAutoCloseRef.current = true;
    const t = window.setTimeout(finishUpload, 2400);
    return () => window.clearTimeout(t);
  }, [submitPhase, finishUpload]);

  const pendingCatMeta = KB_CATS.find((c) => c.id === pendingCat);
  const pendingCatLabel = pendingCatMeta ? (ar ? pendingCatMeta.labelAr : pendingCatMeta.label) : '';
  const pendingCompanyMeta = getKbCompany(pendingCompany);
  const pendingCompanyLabel = pendingCompanyMeta
    ? ar
      ? pendingCompanyMeta.labelAr
      : pendingCompanyMeta.label
    : '';

  const submitUpload = () => {
    if (
      !pendingFile ||
      !pendingCompany ||
      !pendingCat ||
      !pendingDate ||
      !pendingTitle?.trim() ||
      submitPhase
    ) {
      return;
    }
    const name = buildUploadName(pendingTitle, pendingFile);
    const id = uploadDocument(name, {
      knowledgeBase: true,
      category: pendingCat,
      documentDate: pendingDate,
      companyId: pendingCompany,
    });
    setTrackingId(id);
    setSubmitPhase('uploading');
  };

  const onUploadDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onUploadDragLeave = () => setDragOver(false);
  const onUploadDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    applyChosenFile(f, { openSheet: true });
  };

  const handleDelete = (doc) => {
    if (!doc.fileId) return;
    const ok = window.confirm(
      ar
        ? `حذف «${doc.t}» من قاعدة المعرفة؟`
        : `Remove “${doc.t}” from the knowledge base?`,
    );
    if (!ok) return;
    removeKnowledgeBaseDocument(doc.fileId);
    if (sheetDoc?.id === doc.id) setSheetDoc(null);
  };

  return (
    <div className="grid mi-stagger cc-page kb-page" style={{ gap: 20 }}>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,.xlsx,.xls"
        className="kb-upload__input"
        onChange={onFileChosen}
        tabIndex={-1}
        aria-hidden
      />
      {!isSearchMode ? (
        <div className="section-head" style={{ marginBottom: -4 }}>
          <div>
            <div className="eyebrow">{ar ? 'المعرفة المؤسسية' : 'Institutional knowledge'}</div>
            <h2 style={{ fontSize: 24, marginTop: 4 }}>{ar ? 'قاعدة المعرفة المعتمدة' : 'Approved knowledge base'}</h2>
            <p className="muted" style={{ margin: '6px 0 0', fontSize: 14, maxWidth: 480 }}>
              {ar
                ? 'ابحث بالعنوان أو صفِّ حسب الشركة والموضوع.'
                : 'Search by document title, or filter by company and topic.'}
            </p>
          </div>
          <span className="pill ghost">
            <span className="dot good pulse" style={{ color: 'var(--status-good)', background: 'currentColor' }} />
            {ar ? 'مزامنة SharePoint' : 'SharePoint sync'}
          </span>
        </div>
      ) : null}

      <div className="kb-page-bar">
        <form
          className="kb-page-bar__search"
          onSubmit={(e) => e.preventDefault()}
          role="search"
        >
          <CcIcon name="search" size={18} className="kb-page-bar__search-icon" aria-hidden />
          <input
            type="search"
            className="kb-page-bar__search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ar ? 'ابحث بعنوان المستند…' : 'Search by document title…'}
            aria-label={ar ? 'بحث في المستندات' : 'Search documents'}
          />
          {q.trim() ? (
            <button
              type="button"
              className="kb-page-bar__search-clear"
              onClick={() => setQ('')}
              aria-label={ar ? 'مسح البحث' : 'Clear search'}
            >
              <CcIcon name="x" size={15} />
            </button>
          ) : null}
        </form>
        {!isSearchMode ? (
          <button type="button" className="btn btn-primary btn-sm kb-page-bar__upload" onClick={openUpload}>
            <CcIcon name="upload" size={15} />
            {ar ? 'إضافة مستند' : 'Add document'}
          </button>
        ) : null}
      </div>

      <KbFiltersRow
        company={company}
        cat={cat}
        corpus={corpus}
        ar={ar}
        hasFilters={hasFilters}
        onCompanyChange={setCompany}
        onCatChange={setCat}
        onClear={() => {
          setCompany('all');
          setCat('all');
          setQ('');
        }}
      />

      <IntelCard className="kb-docs">
        <header className="kb-docs__head">
          <div>
            <h3 className="kb-docs__title">{ar ? 'المستندات' : 'Documents'}</h3>
            <p className="kb-docs__sub muted-3">
              {isSearchMode
                ? ar
                  ? query
                    ? `${filtered.length} نتيجة لـ «${q.trim()}»`
                    : `${filtered.length} مستند`
                  : query
                    ? `${filtered.length} result${filtered.length === 1 ? '' : 's'} for “${q.trim()}”`
                    : `${filtered.length} document${filtered.length === 1 ? '' : 's'}`
                : hasFilters
                  ? ar
                    ? `${filtered.length} من ${corpus.length} مستند`
                    : `${filtered.length} of ${corpus.length} documents`
                  : ar
                    ? `${corpus.length} مستند${busyCount ? ` · ${busyCount} قيد المعالجة` : ''}`
                    : `${corpus.length} document${corpus.length === 1 ? '' : 's'}${busyCount ? ` · ${busyCount} in progress` : ''}`}
            </p>
          </div>
          {isSearchMode ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQ('')}>
              {ar ? 'إنهاء البحث' : 'Exit search'}
            </button>
          ) : null}
        </header>

        {filtered.length === 0 ? (
          <div className="kb-docs__empty">
            <IntelIconBox icon="file-search" size="lg" />
            <p className="type-title" style={{ margin: 0, fontSize: 15 }}>{ar ? 'لا توجد نتائج' : 'No documents found'}</p>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              {ar ? 'غيّر البحث أو اختر موضوعاً آخر.' : 'Change your search or pick another topic.'}
            </p>
          </div>
        ) : (
          <KbDocTable
            docs={filtered}
            catMap={catMap}
            companyMap={companyMap}
            ar={ar}
            onOpen={(d) => {
              setUploadOpen(false);
              setSheetDoc(d);
            }}
            onAsk={onAsk}
            onDelete={handleDelete}
          />
        )}
      </IntelCard>

      {uploadOpen ? (
        <KbUploadSheet
          open={uploadOpen}
          ar={ar}
          onClose={closeUpload}
          onDone={finishUpload}
          pendingFile={pendingFile}
          pendingFileSize={pendingFileSize}
          pendingTitle={pendingTitle}
          pendingCat={pendingCat}
          pendingCompany={pendingCompany}
          pendingDate={pendingDate}
          catLabel={pendingCatLabel}
          companyLabel={pendingCompanyLabel}
          submitPhase={submitPhase}
          dragOver={dragOver}
          onDragOver={onUploadDragOver}
          onDragLeave={onUploadDragLeave}
          onDrop={onUploadDrop}
          pickFile={pickFile}
          onTitleChange={setPendingTitle}
          onCatChange={setPendingCat}
          onCompanyChange={setPendingCompany}
          onDateChange={setPendingDate}
          onSubmit={submitUpload}
          onClearFile={() => {
            resetPending();
            setUploadOpen(false);
          }}
        />
      ) : null}

      {sheetDoc && sheetCat && sheetCompany && !uploadOpen ? (
        <KbDocSheet
          doc={sheetDoc}
          cat={sheetCat}
          company={sheetCompany}
          ar={ar}
          onClose={() => setSheetDoc(null)}
          onAsk={onAsk}
          onDelete={handleDelete}
        />
      ) : null}
    </div>
  );
}

export function KnowledgeBasePage() {
  const { settings, startNewChat } = useApp();
  const navigate = useNavigate();
  const lang = settings.language === 'ar' ? 'ar' : 'en';
  const onAsk = (q) => {
    startNewChat();
    navigate(`/chat?seed=${encodeURIComponent(q)}`);
  };
  return <KnowledgeBaseView lang={lang} onAsk={onAsk} />;
}


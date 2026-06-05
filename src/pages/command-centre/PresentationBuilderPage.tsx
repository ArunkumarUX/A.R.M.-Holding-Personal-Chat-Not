// @ts-nocheck
import { useCallback, useEffect, useState } from 'react';
import { CcIcon } from '../../command-centre/CcIcon';
import { IntelCard, IntelCardBody } from '../../command-centre/CcCard';
import { useApp } from '../../context/AppContext';
import {
  checkPresentationApiAvailable,
  fetchClarifications,
  fetchOutline,
  fetchSlides,
  regenerateSlide,
} from '../../api/presentationBuilder';
import {
  downloadDeckJson,
  downloadDeckMarkdown,
  downloadDeckPptx,
  downloadDeckHtml,
  UNIFIED_PPT_CURSOR_PROMPT,
  printDeckPdfPreview,
} from '../../utils/presentationExport';
import { mergeBrandCheck } from '../../config/adgmBrandForDeck';

const CRAFT_STACK = ['McKinsey', 'Open Design', 'Claude Design', 'PPT Master'];

const STEPS = ['input', 'clarify', 'outline', 'preview', 'export'];

const TONES = [
  { id: 'executive', en: 'Executive / board', ar: 'تنفيذي / مجلس' },
  { id: 'investor', en: 'Investor pitch', ar: 'عرض مستثمرين' },
  { id: 'client', en: 'Client proposal', ar: 'عرض عميل' },
  { id: 'internal', en: 'Internal strategy', ar: 'استراتيجية داخلية' },
];

export function PresentationBuilderPage() {
  const { settings } = useApp();
  const ar = settings.language === 'ar';

  const [step, setStep] = useState('input');
  const [prompt, setPrompt] = useState('');
  const [notes, setNotes] = useState('');
  const [link, setLink] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [slideCount, setSlideCount] = useState(10);
  const [tone, setTone] = useState('executive');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [outline, setOutline] = useState(null);
  const [deck, setDeck] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(true);
  const [pptxBusy, setPptxBusy] = useState(false);
  const [apiLive, setApiLive] = useState(true);

  useEffect(() => {
    checkPresentationApiAvailable().then(setApiLive);
  }, []);

  const inputPayload = useCallback(
    () => ({ prompt, notes, link, documentText, slideCount, tone }),
    [prompt, notes, link, documentText, slideCount, tone],
  );

  const t = ar
    ? {
        eyebrow: 'العروض التقديمية',
        title: 'منشئ العروض بالذكاء الاصطناعي',
        sub: 'عرض استثنائي لمجلس ADGM — McKinsey + Open Design + Claude Design + PPT Master في مسار واحد.',
        craftLabel: 'حرفة التصميم',
        exportUnified: 'جميع المهارات (Cursor)',
        badge: 'محلي · غير منشور',
        statusOffline: 'التوليف بالذكاء الاصطناعي غير متصل — تحقق من الخادم وANTHROPIC_API_KEY.',
        steps: ['المدخلات', 'توضيح', 'المخطط', 'معاينة', 'تصدير'],
        prompt: 'صف العرض',
        promptPh: 'مثال: عرض استراتيجي Q2 لمجلس ADGM — Falcon Economy والأصول الرقمية',
        notes: 'ملاحظات أو أفكار خام',
        link: 'رابط (اختياري)',
        doc: 'لصق نص مستند',
        upload: 'رفع ملف نصي',
        slides: 'عدد الشرائح',
        tone: 'النبرة',
        optional: 'اختياري',
        continue: 'متابعة',
        back: 'رجوع',
        clarifyTitle: 'أسئلة سريعة',
        clarifySub: 'اختياري — ساعد الذكاء الاصطناعي على ضبط الجمهور والنبرة.',
        noQuestions: 'لا أسئلة إضافية — تابع إلى المخطط.',
        outlineTitle: 'اعتماد المخطط',
        editOutline: 'عدّل العناوين ثم أنشئ الشرائح',
        generate: 'إنشاء الشرائح',
        regen: 'إعادة توليد',
        exportTitle: 'تصدير',
        exportMd: 'Markdown',
        exportJson: 'JSON',
        exportPptx: 'PowerPoint (.pptx)',
        exportPdf: 'PDF (طباعة)',
        exportPptxBusy: 'جاري إنشاء PowerPoint…',
        exportHtml: 'HTML deck (مميز)',
        exportHint:
          'كل المهارات مدمجة: عناوين إجرائية، أبراج KPI، معارض — .pptx أو HTML بمظهر استثنائي.',
        brand: 'فحص الهوية',
        busy: 'جاري التوليد…',
        speakerNotes: 'ملاحظات المتحدث',
        slideOf: 'شريحة',
        preview: 'الشرائح',
      }
    : {
        eyebrow: 'Presentations',
        title: 'AI Presentation Builder',
        sub: 'Outstanding board decks — McKinsey, Open Design, Claude Design, and PPT Master unified in one flow.',
        craftLabel: 'Design craft',
        exportUnified: 'All skills (Cursor)',
        badge: 'Local · not on production',
        statusOffline: 'AI synthesis offline — check server connection and ANTHROPIC_API_KEY.',
        steps: ['Input', 'Clarify', 'Outline', 'Preview', 'Export'],
        prompt: 'Describe your presentation',
        promptPh: 'e.g. Q2 board pack for ADGM — Falcon Economy, digital assets, FSRA outlook',
        notes: 'Notes or rough ideas',
        link: 'Website link (optional)',
        doc: 'Paste document text',
        upload: 'Upload text file',
        slides: 'Slide count',
        tone: 'Tone',
        optional: 'Optional',
        continue: 'Continue',
        back: 'Back',
        clarifyTitle: 'Quick clarifications',
        clarifySub: 'Optional — helps the AI tune audience and tone.',
        noQuestions: 'No extra questions — continue to outline.',
        outlineTitle: 'Approve outline',
        editOutline: 'Edit slide titles, then generate content.',
        generate: 'Generate slides',
        regen: 'Regenerate slide',
        exportTitle: 'Export deck',
        exportMd: 'Markdown',
        exportJson: 'JSON',
        exportPptx: 'PowerPoint (.pptx)',
        exportPdf: 'PDF (print)',
        exportPptxBusy: 'Building PowerPoint…',
        exportHtml: 'HTML deck (premium)',
        exportHint:
          'All skills applied: action titles, KPI towers, exhibit panels. Export .pptx or HTML for wow board-ready output. See docs/ADGM-PPT-MASTER.md.',
        brand: 'Brand check',
        busy: 'Generating…',
        speakerNotes: 'Speaker notes',
        slideOf: 'Slide',
        preview: 'Slides',
      };

  const stepIndex = STEPS.indexOf(step);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDocumentText(String(reader.result || ''));
    reader.readAsText(file);
  };

  const startClarify = async () => {
    setError('');
    setBusy(true);
    try {
      const { questions: q } = await fetchClarifications(inputPayload());
      setQuestions(q?.length ? q : []);
      setAnswers(q?.map(() => '') || []);
      setStep('clarify');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const buildOutline = async () => {
    setError('');
    setBusy(true);
    try {
      const o = await fetchOutline(inputPayload(), answers.filter(Boolean));
      setOutline(o);
      setStep('outline');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const buildSlides = async () => {
    setError('');
    setBusy(true);
    try {
      const d = await fetchSlides(inputPayload(), outline);
      setDeck({ ...d, brandCheck: mergeBrandCheck(d.brandCheck) });
      setPreviewIndex(0);
      setStep('preview');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onRegenSlide = async () => {
    if (!deck?.slides?.[previewIndex]) return;
    setBusy(true);
    setError('');
    try {
      const { slide } = await regenerateSlide(inputPayload(), deck.slides[previewIndex]);
      const slides = [...deck.slides];
      slides[previewIndex] = slide;
      setDeck({ ...deck, slides });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const updateOutlineItem = (i, field, value) => {
    setOutline((o) => {
      if (!o) return o;
      const outlineItems = [...o.outline];
      outlineItems[i] = { ...outlineItems[i], [field]: value };
      return { ...o, outline: outlineItems };
    });
  };

  const [copiedKind, setCopiedKind] = useState('');

  const copyPrompt = async (text: string, kind: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKind(kind);
    window.setTimeout(() => setCopiedKind(''), 2000);
  };

  const onExportPptx = async () => {
    if (!deck) return;
    setError('');
    setPptxBusy(true);
    try {
      await downloadDeckPptx(deck, { includeSpeakerNotes: showNotes });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export PowerPoint file');
    } finally {
      setPptxBusy(false);
    }
  };

  const currentSlide = deck?.slides?.[previewIndex];

  const formatSlideType = (type?: string) =>
    (type || 'slide').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="grid mi-stagger cc-page cc-pres-builder" style={{ gap: 20 }}>
      <div className="section-head">
        <div>
          <div className="eyebrow">{t.eyebrow}</div>
          <h2>{t.title}</h2>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: 14, maxWidth: 560 }}>
            {t.sub}
          </p>
        </div>
        <span className="pill ghost">
          <CcIcon name="presentation" size={14} />
          {t.badge}
        </span>
      </div>

      <div className="cc-pres-builder__craft" aria-label={t.craftLabel}>
        <span className="cc-pres-builder__craft-label">{t.craftLabel}</span>
        {CRAFT_STACK.map((name) => (
          <span key={name} className="cc-pres-builder__craft-pill">
            {name}
          </span>
        ))}
      </div>

      {!apiLive ? (
        <p className="cc-pres-builder__status">
          <CcIcon name="info" size={14} />
          {t.statusOffline}
        </p>
      ) : null}

      <nav className="cc-pres-builder__stepper" aria-label="Progress">
        {t.steps.map((label, i) => (
          <div
            key={STEPS[i]}
            className={`cc-pres-builder__step${i < stepIndex ? ' cc-pres-builder__step--done' : ''}${i === stepIndex ? ' cc-pres-builder__step--current' : ''}`}
          >
            <span className="cc-pres-builder__step-dot">{i < stepIndex ? '✓' : i + 1}</span>
            <span className="cc-pres-builder__step-label">{label}</span>
          </div>
        ))}
      </nav>

      {error ? (
        <div className="adgm-info-panel">
          <div className="adgm-info-panel__body">{error}</div>
        </div>
      ) : null}

      {step === 'input' && (
        <IntelCard>
          <IntelCardBody>
            <h3 className="settings-section-title">{t.steps[0]}</h3>
            <div className="cc-pres-builder__form-grid">
              <div className="cc-pres-builder__form-main">
                <label className="cc-pres-builder__label" htmlFor="pres-prompt">
                  {t.prompt}
                </label>
                <textarea
                  id="pres-prompt"
                  className="cc-pres-builder__textarea cc-pres-builder__textarea--hero"
                  rows={5}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t.promptPh}
                />
                <label className="cc-pres-builder__label" htmlFor="pres-notes">
                  {t.notes}{' '}
                  <span className="muted-3" style={{ fontWeight: 400 }}>
                    ({t.optional})
                  </span>
                </label>
                <textarea
                  id="pres-notes"
                  className="cc-pres-builder__textarea"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="cc-pres-builder__form-side">
                <label className="cc-pres-builder__label" htmlFor="pres-link">
                  {t.link}
                </label>
                <input
                  id="pres-link"
                  className="cc-pres-builder__input"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://"
                />
                <label className="cc-pres-builder__label" htmlFor="pres-doc">
                  {t.doc}
                </label>
                <textarea
                  id="pres-doc"
                  className="cc-pres-builder__textarea"
                  rows={4}
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                />
                <label className="cc-pres-builder__upload">
                  <CcIcon name="upload" size={16} />
                  {t.upload}
                  <input type="file" accept=".txt,.md,.csv,.json" hidden onChange={onFile} />
                </label>
                <div className="cc-pres-builder__meta-row">
                  <label className="cc-pres-builder__label" htmlFor="pres-count">
                    {t.slides}
                  </label>
                  <input
                    id="pres-count"
                    type="number"
                    min={6}
                    max={20}
                    className="cc-pres-builder__input"
                    value={slideCount}
                    onChange={(e) => setSlideCount(Number(e.target.value))}
                  />
                </div>
                <div className="cc-pres-builder__meta-row">
                  <label className="cc-pres-builder__label" htmlFor="pres-tone">
                    {t.tone}
                  </label>
                  <select
                    id="pres-tone"
                    className="cc-pres-builder__input"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                  >
                    {TONES.map((x) => (
                      <option key={x.id} value={x.id}>
                        {ar ? x.ar : x.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="cc-pres-builder__footer">
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy || !prompt.trim()}
                onClick={startClarify}
              >
                {busy ? t.busy : t.continue}
                {!busy && <CcIcon name="arrow-right" size={16} />}
              </button>
            </div>
          </IntelCardBody>
        </IntelCard>
      )}

      {step === 'clarify' && (
        <IntelCard>
          <IntelCardBody>
            <h3 className="settings-section-title">{t.clarifyTitle}</h3>
            <p className="muted-3" style={{ margin: '0 0 16px', fontSize: 13 }}>
              {t.clarifySub}
            </p>
            {questions.length === 0 ? (
              <p className="muted-3">{t.noQuestions}</p>
            ) : (
              <div className="cc-pres-builder__qa-list">
                {questions.map((q, i) => (
                  <div key={i} className="cc-pres-builder__qa">
                    <p className="cc-pres-builder__q">{q}</p>
                    <input
                      className="cc-pres-builder__input"
                      value={answers[i] || ''}
                      onChange={(e) => {
                        const next = [...answers];
                        next[i] = e.target.value;
                        setAnswers(next);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="cc-pres-builder__footer">
              <button type="button" className="btn btn-ghost" onClick={() => setStep('input')}>
                {t.back}
              </button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={buildOutline}>
                {busy ? t.busy : t.continue}
              </button>
            </div>
          </IntelCardBody>
        </IntelCard>
      )}

      {step === 'outline' && outline && (
        <IntelCard>
          <IntelCardBody>
            <h3 className="settings-section-title">{t.outlineTitle}</h3>
            <p className="cc-pres-builder__storyline">{outline.storyline}</p>
            <input
              className="cc-pres-builder__input cc-pres-builder__input--title"
              value={outline.title}
              onChange={(e) => setOutline({ ...outline, title: e.target.value })}
            />
            <p className="muted-3" style={{ fontSize: 12, margin: '0 0 14px' }}>
              {t.editOutline}
            </p>
            <ul className="cc-pres-builder__outline-list">
              {outline.outline.map((item, i) => (
                <li key={i} className="cc-pres-builder__outline-item">
                  <span className="cc-pres-builder__outline-num">{i + 1}</span>
                  <div className="cc-pres-builder__outline-fields">
                    <span className="cc-pres-builder__outline-type">{item.type.replace(/-/g, ' ')}</span>
                    <input
                      className="cc-pres-builder__input"
                      value={item.title}
                      onChange={(e) => updateOutlineItem(i, 'title', e.target.value)}
                    />
                    <input
                      className="cc-pres-builder__input cc-pres-builder__input--muted"
                      value={item.summary}
                      onChange={(e) => updateOutlineItem(i, 'summary', e.target.value)}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <div className="cc-pres-builder__footer">
              <button type="button" className="btn btn-ghost" onClick={() => setStep('clarify')}>
                {t.back}
              </button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={buildSlides}>
                {busy ? t.busy : t.generate}
              </button>
            </div>
          </IntelCardBody>
        </IntelCard>
      )}

      {step === 'preview' && deck && (
        <div className="cc-pres-builder__preview-layout">
          <aside className="cc-pres-builder__thumb-panel" aria-label={t.preview}>
            <div className="cc-pres-builder__thumb-head">
              <p className="cc-pres-builder__panel-label">{t.preview}</p>
              <span className="cc-pres-builder__thumb-count">
                {previewIndex + 1} / {deck.slides.length}
              </span>
            </div>
            <div className="cc-pres-builder__thumb-strip" role="tablist">
              {deck.slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === previewIndex}
                  className={`cc-pres-builder__thumb${i === previewIndex ? ' cc-pres-builder__thumb--on' : ''}`}
                  onClick={() => setPreviewIndex(i)}
                >
                  <span className="cc-pres-builder__thumb-index">{i + 1}</span>
                  <span className="cc-pres-builder__thumb-copy">
                    <span className="cc-pres-builder__thumb-title">{s.title}</span>
                    <span className="cc-pres-builder__thumb-type">{formatSlideType(s.type)}</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>
          <div className="cc-pres-builder__stage">
            <article className="cc-pres-builder__slide cc-pres-builder__slide--wow">
              <header className="cc-pres-builder__slide-header">
                <span className="cc-pres-builder__slide-brand">ADGM</span>
                <span className="cc-pres-builder__slide-meta">
                  {t.slideOf} {previewIndex + 1} / {deck.slides.length}
                </span>
              </header>
              <div className="cc-pres-builder__slide-body">
                <span className="cc-pres-builder__slide-type">{currentSlide?.type?.replace(/-/g, ' ')}</span>
                <h2 className="cc-pres-builder__slide-title">{currentSlide?.title}</h2>
                <ul className="cc-pres-builder__bullets">
                  {currentSlide?.bullets?.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
                {currentSlide?.metrics?.length ? (
                  <table className="cc-pres-builder__metrics">
                    <tbody>
                      {currentSlide.metrics.map((m) => (
                        <tr key={m.label}>
                          <td>{m.label}</td>
                          <td>{m.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
                {currentSlide?.visualHint ? (
                  <p className="cc-pres-builder__visual">
                    <CcIcon name="bar-chart-2" size={14} />
                    {currentSlide.visualHint}
                  </p>
                ) : null}
              </div>
              {showNotes && currentSlide?.speakerNotes ? (
                <footer className="cc-pres-builder__slide-notes">{currentSlide.speakerNotes}</footer>
              ) : null}
            </article>
            <div className="cc-pres-builder__footer">
              <label className="pill ghost cc-pres-builder__notes-toggle">
                <input type="checkbox" checked={showNotes} onChange={(e) => setShowNotes(e.target.checked)} />
                {t.speakerNotes}
              </label>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={onRegenSlide}>
                {t.regen}
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setStep('export')}>
                {t.continue}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'export' && deck && (
        <IntelCard>
          <IntelCardBody>
            <h3 className="settings-section-title">{t.exportTitle}</h3>
            {deck.brandCheck?.length ? (
              <ul className="cc-pres-builder__brand-list">
                {deck.brandCheck.map((b) => (
                  <li key={b}>
                    <CcIcon name="check-circle" size={14} />
                    {b}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="cc-pres-builder__export-grid">
              <button
                type="button"
                className="cc-pres-builder__export-btn cc-pres-builder__export-btn--primary"
                disabled={pptxBusy}
                onClick={onExportPptx}
              >
                <CcIcon name="presentation" size={22} />
                <span>{pptxBusy ? t.exportPptxBusy : t.exportPptx}</span>
              </button>
              <button type="button" className="cc-pres-builder__export-btn" onClick={() => downloadDeckHtml(deck)}>
                <CcIcon name="layout" size={20} />
                <span>{t.exportHtml}</span>
              </button>
              <button type="button" className="cc-pres-builder__export-btn" onClick={() => downloadDeckMarkdown(deck, outline, showNotes)}>
                <CcIcon name="file-text" size={20} />
                <span>{t.exportMd}</span>
              </button>
              <button type="button" className="cc-pres-builder__export-btn" onClick={() => downloadDeckJson(deck)}>
                <CcIcon name="braces" size={20} />
                <span>{t.exportJson}</span>
              </button>
              <button type="button" className="cc-pres-builder__export-btn" onClick={printDeckPdfPreview}>
                <CcIcon name="printer" size={20} />
                <span>{t.exportPdf}</span>
              </button>
              <button
                type="button"
                className="cc-pres-builder__export-btn cc-pres-builder__export-btn--unified"
                onClick={() => copyPrompt(UNIFIED_PPT_CURSOR_PROMPT, 'unified')}
              >
                <CcIcon name="sparkles" size={20} />
                <span>{copiedKind === 'unified' ? 'Copied' : t.exportUnified}</span>
              </button>
            </div>
            <p className="muted-3 cc-pres-builder__export-hint">{t.exportHint}</p>
            <div className="cc-pres-builder__footer">
              <button type="button" className="btn btn-ghost" onClick={() => setStep('preview')}>
                {t.back}
              </button>
            </div>
          </IntelCardBody>
        </IntelCard>
      )}
    </div>
  );
}

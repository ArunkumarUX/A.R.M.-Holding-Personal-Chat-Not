// @ts-nocheck
import { useCallback, useState } from 'react';
import { CcIcon } from '../../command-centre/CcIcon';
import { useApp } from '../../context/AppContext';
import {
  fetchClarifications,
  fetchOutline,
  fetchSlides,
  regenerateSlide,
} from '../../api/presentationBuilder';
import {
  downloadDeckJson,
  downloadDeckMarkdown,
  PPT_MASTER_CURSOR_PROMPT,
  printDeckPdfPreview,
} from '../../utils/presentationExport';

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
  const [copied, setCopied] = useState(false);

  const inputPayload = useCallback(
    () => ({ prompt, notes, link, documentText, slideCount, tone }),
    [prompt, notes, link, documentText, slideCount, tone],
  );

  const t = ar
    ? {
        title: 'منشئ العروض بالذكاء الاصطناعي',
        sub: 'من أي فكرة أو مستند إلى عرض ADGM بمستوى استشاري — محلي فقط',
        local: 'محلي · غير منشور',
        steps: ['المدخلات', 'توضيح', 'المخطط', 'معاينة', 'تصدير'],
        prompt: 'صف العرض',
        promptPh: 'مثال: عرض استراتيجي Q2 لمجلس ADGM — D33 والأصول الرقمية',
        notes: 'ملاحظات أو أفكار خام',
        link: 'رابط (اختياري)',
        doc: 'لصق نص مستند',
        upload: 'رفع ملف نصي',
        slides: 'عدد الشرائح',
        tone: 'النبرة',
        continue: 'متابعة',
        skip: 'تخطي',
        back: 'رجوع',
        clarifyTitle: 'أسئلة سريعة (اختياري)',
        outlineTitle: 'اعتماد المخطط',
        editOutline: 'عدّل العناوين ثم أنشئ الشرائح',
        generate: 'إنشاء الشرائح',
        preview: 'معاينة',
        regen: 'إعادة توليد',
        exportMd: 'تصدير Markdown',
        exportJson: 'تصدير JSON',
        exportPpt: 'تعليمات PPTX',
        exportPdf: 'معاينة PDF (طباعة)',
        brand: 'فحص الهوية',
        busy: 'جاري التوليد…',
      }
    : {
        title: 'AI Presentation Builder',
        sub: 'From any prompt or document to a McKinsey-level ADGM deck — local only',
        local: 'Local · not on production',
        steps: ['Input', 'Clarify', 'Outline', 'Preview', 'Export'],
        prompt: 'Describe your presentation',
        promptPh: 'e.g. Q2 board pack for ADGM — D33, digital assets, FSRA outlook',
        notes: 'Notes or rough ideas',
        link: 'Website link (optional)',
        doc: 'Paste document text',
        upload: 'Upload text file',
        slides: 'Slide count',
        tone: 'Tone',
        continue: 'Continue',
        skip: 'Skip',
        back: 'Back',
        clarifyTitle: 'Quick clarifications (optional)',
        outlineTitle: 'Approve outline',
        editOutline: 'Edit titles, then build slides',
        generate: 'Generate slides',
        preview: 'Preview',
        regen: 'Regenerate slide',
        exportMd: 'Export Markdown',
        exportJson: 'Export JSON',
        exportPpt: 'PPTX instructions',
        exportPdf: 'PDF preview (print)',
        brand: 'Brand check',
        busy: 'Generating…',
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
      setDeck(d);
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

  const copyPptPrompt = async () => {
    await navigator.clipboard.writeText(PPT_MASTER_CURSOR_PROMPT);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const currentSlide = deck?.slides?.[previewIndex];

  return (
    <div className="content-pad mi-page-enter cc-pres-builder">
      <header className="cc-pres-builder__head">
        <div>
          <span className="pill warn">{t.local}</span>
          <h1 className="type-title" style={{ marginTop: 10 }}>
            {t.title}
          </h1>
          <p className="muted-3" style={{ marginTop: 6, maxWidth: 640 }}>
            {t.sub}
          </p>
        </div>
        <CcIcon name="presentation" size={36} className="cc-pres-builder__icon" />
      </header>

      <nav className="cc-pres-builder__stepper" aria-label="Progress">
        {t.steps.map((label, i) => (
          <span
            key={STEPS[i]}
            className={`cc-pres-builder__step${i <= stepIndex ? ' cc-pres-builder__step--on' : ''}${i === stepIndex ? ' cc-pres-builder__step--current' : ''}`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </nav>

      {error ? (
        <div className="adgm-info-panel" style={{ marginBottom: 16 }}>
          <div className="adgm-info-panel__body">{error}</div>
        </div>
      ) : null}

      {step === 'input' && (
        <section className="card card-pad">
          <label className="cc-pres-builder__label">{t.prompt}</label>
          <textarea
            className="cc-pres-builder__textarea"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t.promptPh}
          />
          <label className="cc-pres-builder__label">{t.notes}</label>
          <textarea
            className="cc-pres-builder__textarea"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <label className="cc-pres-builder__label">{t.link}</label>
          <input
            className="cc-pres-builder__input"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://"
          />
          <label className="cc-pres-builder__label">{t.doc}</label>
          <textarea
            className="cc-pres-builder__textarea"
            rows={3}
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
          />
          <label className="cc-pres-builder__file">
            <CcIcon name="upload" size={16} />
            {t.upload}
            <input type="file" accept=".txt,.md,.csv,.json" hidden onChange={onFile} />
          </label>
          <div className="cc-pres-builder__row">
            <label className="cc-pres-builder__label">
              {t.slides}
              <input
                type="number"
                min={6}
                max={20}
                className="cc-pres-builder__input cc-pres-builder__input--narrow"
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
              />
            </label>
            <label className="cc-pres-builder__label">
              {t.tone}
              <select className="cc-pres-builder__input" value={tone} onChange={(e) => setTone(e.target.value)}>
                {TONES.map((x) => (
                  <option key={x.id} value={x.id}>
                    {ar ? x.ar : x.en}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !prompt.trim()}
            onClick={startClarify}
          >
            {busy ? t.busy : t.continue}
          </button>
        </section>
      )}

      {step === 'clarify' && (
        <section className="card card-pad">
          <h2 className="type-sub">{t.clarifyTitle}</h2>
          {questions.length === 0 ? (
            <p className="muted-3">No extra questions — continue to outline.</p>
          ) : (
            questions.map((q, i) => (
              <div key={i} style={{ marginTop: 14 }}>
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
            ))
          )}
          <div className="cc-pres-builder__actions">
            <button type="button" className="btn btn-ghost" onClick={() => setStep('input')}>
              {t.back}
            </button>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={buildOutline}>
              {busy ? t.busy : t.continue}
            </button>
          </div>
        </section>
      )}

      {step === 'outline' && outline && (
        <section className="card card-pad">
          <h2 className="type-sub">{t.outlineTitle}</h2>
          <p className="muted-3">{outline.storyline}</p>
          <input
            className="cc-pres-builder__input"
            style={{ marginTop: 12, fontWeight: 600 }}
            value={outline.title}
            onChange={(e) => setOutline({ ...outline, title: e.target.value })}
          />
          <p className="muted-3" style={{ fontSize: 12, margin: '8px 0 12px' }}>
            {t.editOutline}
          </p>
          <ul className="cc-pres-builder__outline-list">
            {outline.outline.map((item, i) => (
              <li key={i} className="cc-pres-builder__outline-item">
                <span className="cc-pres-builder__outline-type">{item.type}</span>
                <input
                  className="cc-pres-builder__input"
                  value={item.title}
                  onChange={(e) => updateOutlineItem(i, 'title', e.target.value)}
                />
                <input
                  className="cc-pres-builder__input muted-3"
                  value={item.summary}
                  onChange={(e) => updateOutlineItem(i, 'summary', e.target.value)}
                />
              </li>
            ))}
          </ul>
          <div className="cc-pres-builder__actions">
            <button type="button" className="btn btn-ghost" onClick={() => setStep('clarify')}>
              {t.back}
            </button>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={buildSlides}>
              {busy ? t.busy : t.generate}
            </button>
          </div>
        </section>
      )}

      {step === 'preview' && deck && (
        <section className="cc-pres-builder__preview-wrap">
          <div className="cc-pres-builder__thumb-strip">
            {deck.slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`cc-pres-builder__thumb${i === previewIndex ? ' cc-pres-builder__thumb--on' : ''}`}
                onClick={() => setPreviewIndex(i)}
              >
                <span className="cc-pres-builder__thumb-num">{i + 1}</span>
                <span className="cc-pres-builder__thumb-title">{s.title}</span>
              </button>
            ))}
          </div>
          <article className="cc-pres-builder__slide card card-pad">
            <span className="cc-pres-builder__slide-type">{currentSlide?.type}</span>
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
                <CcIcon name="image" size={14} /> {currentSlide.visualHint}
              </p>
            ) : null}
            {showNotes && currentSlide?.speakerNotes ? (
              <p className="cc-pres-builder__notes">{currentSlide.speakerNotes}</p>
            ) : null}
            <div className="cc-pres-builder__actions">
              <label className="pill ghost" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showNotes}
                  onChange={(e) => setShowNotes(e.target.checked)}
                  style={{ marginInlineEnd: 6 }}
                />
                Speaker notes
              </label>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={onRegenSlide}>
                {t.regen}
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setStep('export')}>
                {t.continue}
              </button>
            </div>
          </article>
        </section>
      )}

      {step === 'export' && deck && (
        <section className="card card-pad">
          <h2 className="type-sub">Export</h2>
          {deck.brandCheck?.length ? (
            <>
              <p className="cc-pres-builder__label">{t.brand}</p>
              <ul className="muted-3">
                {deck.brandCheck.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </>
          ) : null}
          <div className="cc-pres-builder__actions">
            <button type="button" className="btn btn-primary" onClick={() => downloadDeckMarkdown(deck, outline, showNotes)}>
              {t.exportMd}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => downloadDeckJson(deck)}>
              {t.exportJson}
            </button>
            <button type="button" className="btn btn-ghost" onClick={copyPptPrompt}>
              {copied ? 'Copied' : t.exportPpt}
            </button>
            <button type="button" className="btn btn-ghost" onClick={printDeckPdfPreview}>
              {t.exportPdf}
            </button>
          </div>
          <p className="muted-3" style={{ fontSize: 12, marginTop: 12 }}>
            Save Markdown to{' '}
            <code>tools/ppt-master-adgm/projects/adgm-command-centre/sources/deck-source.md</code>, then run PPT
            Master in Cursor for editable <strong>.pptx</strong>.
          </p>
          <button type="button" className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => setStep('preview')}>
            {t.back}
          </button>
        </section>
      )}
    </div>
  );
}

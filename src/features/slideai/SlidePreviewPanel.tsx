import { Suspense, lazy, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { CcIcon } from '../../command-centre/CcIcon';
import { useSlideStore } from './useSlideStore';
import { usePerceptisDeckStore, UX_PROGRESS_STEPS } from './perceptisDeckStore';

const PerceptisPptxViewer = lazy(() =>
  import('./PerceptisPptxViewer').then((m) => ({ default: m.PerceptisPptxViewer })),
);

const PROGRESS_STEPS_AR = [
  'تحليل الموجز',
  'بناء القصة التنفيذية',
  'اختيار هياكل الشرائح',
  'تصميم العرض',
  'إنهاء PowerPoint',
];

const ENGAGING_TIPS_EN = [
  'Crafting action titles for each slide…',
  'Applying Apparel Group navy & lime branding…',
  'Building native charts and executive exhibits…',
  'Writing speaker notes for board delivery…',
  'Structuring the storyline — answer first…',
  'Polishing layout for 16:9 boardroom view…',
];

const ENGAGING_TIPS_AR = [
  'صياغة عناوين تنفيذية لكل شريحة…',
  'تطبيق هوية Apparel Group…',
  'بناء الرسوم البيانية والجداول…',
  'كتابة ملاحظات المتحدث…',
  'هيكلة القصة — التوصية أولاً…',
  'تحسين التخطيط لعرض مجلس الإدارة…',
];

function formatElapsed(sec: number, ar: boolean) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return ar ? `${s} ث` : `${s}s`;
  return ar ? `${m}:${String(s).padStart(2, '0')} د` : `${m}:${String(s).padStart(2, '0')}`;
}

function SlideStackPreview({ slideCount, activeIndex }: { slideCount: number; activeIndex: number }) {
  const total = Math.min(Math.max(slideCount, 4), 6);
  return (
    <div className="cc-slideai__progress-slides" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={[
            'cc-slideai__progress-slide',
            i <= activeIndex ? 'cc-slideai__progress-slide--built' : '',
            i === activeIndex ? 'cc-slideai__progress-slide--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ '--slide-i': i } as CSSProperties}
        >
          <span className="cc-slideai__progress-slide-bar" />
          <span className="cc-slideai__progress-slide-line" />
          <span className="cc-slideai__progress-slide-line cc-slideai__progress-slide-line--short" />
        </div>
      ))}
    </div>
  );
}

function PerceptisProgressPanel({
  ar,
  message,
  elapsedSec,
  progressStep,
  slideCount,
  stalled,
}: {
  ar: boolean;
  message: string;
  elapsedSec: number;
  progressStep: number;
  slideCount: number;
  stalled?: boolean;
}) {
  const steps = ar ? PROGRESS_STEPS_AR : UX_PROGRESS_STEPS;
  const tips = ar ? ENGAGING_TIPS_AR : ENGAGING_TIPS_EN;
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [tips.length]);

  const activeStep = Math.min(progressStep, steps.length - 1);
  const builtSlides = Math.min(
    slideCount,
    Math.max(1, Math.floor((elapsedSec / 45) * (slideCount / steps.length)) + 1),
  );

  return (
    <div className={`cc-slideai__perceptis-progress${stalled ? ' cc-slideai__perceptis-progress--stalled' : ''}`}>
      <div className="cc-slideai__perceptis-progress-hero">
        <SlideStackPreview slideCount={slideCount} activeIndex={Math.min(builtSlides - 1, 5)} />
        <div className="cc-slideai__perceptis-progress-icon-wrap">
          <span className="cc-slideai__perceptis-progress-ring" aria-hidden />
          <div className="cc-slideai__perceptis-progress-icon">
            <CcIcon name="sparkles" size={32} />
          </div>
        </div>
      </div>

      <span className="cc-slideai__perceptis-progress-live">
        <span className="cc-slideai__perceptis-progress-live-dot" aria-hidden />
        {stalled
          ? ar
            ? 'لا يزال قيد الإنشاء'
            : 'Still creating'
          : ar
            ? 'جاري الإنشاء'
            : 'Creating now'}
      </span>

      <h3 className="cc-slideai__perceptis-progress-title">
        {steps[activeStep]}
      </h3>

      <p className="cc-slideai__perceptis-progress-msg cc-slideai__perceptis-progress-msg--tip" key={tipIndex}>
        {tips[tipIndex]}
      </p>

      {slideCount > 0 && (
        <p className="cc-slideai__perceptis-progress-slides">
          {ar
            ? `بناء ${builtSlides} من ${slideCount} شريحة`
            : `Building slide ${builtSlides} of ${slideCount}`}
        </p>
      )}

      <div
        className="cc-slideai__perceptis-progress-bar cc-slideai__perceptis-progress-bar--indeterminate"
        role="progressbar"
        aria-valuetext={message}
        aria-busy="true"
      >
        <span className="cc-slideai__perceptis-progress-fill" />
        <span className="cc-slideai__perceptis-progress-shimmer" aria-hidden />
      </div>

      <ul className="cc-slideai__perceptis-progress-steps">
        {steps.map((label, i) => (
          <li
            key={label}
            className={[
              i < activeStep ? 'cc-slideai__perceptis-progress-step--done' : '',
              i === activeStep ? 'cc-slideai__perceptis-progress-step--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className="cc-slideai__perceptis-progress-dot" aria-hidden>
              {i < activeStep ? <CcIcon name="check" size={10} /> : null}
            </span>
            {label}
          </li>
        ))}
      </ul>

      <p className="cc-slideai__perceptis-progress-elapsed">
        <span className="cc-slideai__perceptis-progress-clock">{formatElapsed(elapsedSec, ar)}</span>
        <span className="muted-3">
          {stalled
            ? ar
              ? ' · العروض المعقدة قد تستغرق بضع دقائق إضافية'
              : ' · complex decks can take a few extra minutes'
            : ar
              ? ' · عادةً 1–5 دقائق · يمكنك متابعة المحادثة'
              : ' · typically 1–5 min · you can keep chatting'}
        </span>
      </p>
    </div>
  );
}

export function SlidePreviewPanel({ ar }: { ar: boolean }) {
  const { activeSlideIndex, setActiveSlide } = useSlideStore(
    useShallow((s) => ({
      activeSlideIndex: s.activeSlideIndex,
      setActiveSlide: s.setActiveSlide,
    })),
  );

  const {
    phase,
    message,
    prompt,
    blob,
    slideCount,
    error,
    elapsedSec,
    progressStep,
    retry,
    downloadReady,
  } = usePerceptisDeckStore(
    useShallow((s) => ({
      phase: s.phase,
      message: s.message,
      prompt: s.prompt,
      blob: s.blob,
      slideCount: s.slideCount,
      error: s.error,
      elapsedSec: s.elapsedSec,
      progressStep: s.progressStep,
      retry: s.retry,
      downloadReady: s.downloadReady,
    })),
  );

  const [perceptisSlideCount, setPerceptisSlideCount] = useState(0);
  const isActive = ['queued', 'analysing', 'generating', 'downloading', 'stalled'].includes(phase);
  const wasStopped = phase === 'idle' && Boolean(prompt) && !blob && !downloadReady;
  const showPerceptisPreview = (phase === 'ready' || phase === 'preview_loading') && Boolean(blob);
  const showPptReadyPlaceholder = phase === 'ppt_ready' && downloadReady && !blob;
  const navTotal = useMemo(() => {
    if (perceptisSlideCount > 0) return perceptisSlideCount;
    if (slideCount > 0) return slideCount;
    return 1;
  }, [perceptisSlideCount, slideCount]);

  useEffect(() => {
    if (!showPerceptisPreview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSlide(Math.min(activeSlideIndex + 1, navTotal - 1));
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSlide(Math.max(activeSlideIndex - 1, 0));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPerceptisPreview, activeSlideIndex, navTotal, setActiveSlide]);

  if (phase === 'idle' && !prompt) {
    return (
      <div className="cc-slideai__preview-empty">
        <CcIcon name="presentation" size={40} className="cc-slideai__preview-icon" />
        <p>{ar ? 'سيُنشأ عرضك هنا' : 'Your presentation will appear here'}</p>
        <span className="cc-slideai__preview-empty-hint">
          {ar ? 'أرسل موجزك في المحادثة للبدء' : 'Send your brief in chat to start'}
        </span>
      </div>
    );
  }

  return (
    <div className={`cc-slideai__preview${isActive ? ' cc-slideai__preview--busy' : ''}`}>
      <div className="cc-slideai__theater">
        <div className="cc-slideai__canvas-wrap cc-slideai__canvas-wrap--perceptis">
          {showPerceptisPreview ? (
            <Suspense
              fallback={
                <div className="cc-slideai__perceptis-placeholder">
                  <span className="cc-slideai__preview-busy-pulse" />
                  <p>{ar ? 'جاري تحميل المعاينة…' : 'Loading preview…'}</p>
                </div>
              }
            >
              <PerceptisPptxViewer
                blob={blob!}
                slideIndex={activeSlideIndex}
                onSlideCount={setPerceptisSlideCount}
              />
            </Suspense>
          ) : showPptReadyPlaceholder || phase === 'preview_loading' ? (
            <div className="cc-slideai__perceptis-placeholder cc-slideai__perceptis-placeholder--ready">
              <CcIcon name="download" size={36} />
              <p>{ar ? 'PowerPoint جاهز للتنزيل' : 'PowerPoint is ready to download'}</p>
              <span className="cc-slideai__preview-empty-hint">
                {phase === 'preview_loading'
                  ? ar
                    ? 'جاري تحميل المعاينة في الخلفية…'
                    : 'Loading slide preview in the background…'
                  : ar
                    ? 'يمكنك التنزيل الآن — المعاينة تُحمّل بالتوازي'
                    : 'Download now — preview loads in parallel'}
              </span>
            </div>
          ) : isActive ? (
            <PerceptisProgressPanel
              ar={ar}
              message={message}
              elapsedSec={elapsedSec}
              progressStep={progressStep}
              slideCount={slideCount}
              stalled={phase === 'stalled'}
            />
          ) : wasStopped ? (
            <div className="cc-slideai__perceptis-placeholder">
              <p>{ar ? 'تم إيقاف الإنشاء' : 'Generation stopped'}</p>
              <button type="button" className="btn-primary btn-sm" onClick={retry}>
                {ar ? 'متابعة الإنشاء' : 'Resume generation'}
              </button>
            </div>
          ) : phase === 'error' ? (
            <div className="cc-slideai__perceptis-error-panel">
              <CcIcon name="alert-circle" size={40} />
              <h3>{ar ? 'تعذّر إنشاء العرض' : 'Could not generate your deck'}</h3>
              <p className="cc-slideai__perceptis-error-detail">{error}</p>
              {prompt ? (
                <p className="cc-slideai__perceptis-error-prompt">
                  {ar ? 'موجزك محفوظ — أعد المحاولة للمتابعة' : 'Your brief is saved — retry to continue'}
                </p>
              ) : null}
              <button type="button" className="btn-primary" onClick={retry}>
                {ar ? 'إعادة المحاولة' : 'Retry'}
              </button>
            </div>
          ) : null}
        </div>

        {showPerceptisPreview && (
          <div className="cc-slideai__stage-nav">
            <button
              type="button"
              className="icon-btn"
              disabled={activeSlideIndex <= 0}
              onClick={() => setActiveSlide(activeSlideIndex - 1)}
              aria-label={ar ? 'الشريحة السابقة' : 'Previous slide'}
            >
              <CcIcon name="chevron-left" size={18} />
            </button>
            <span className="cc-slideai__stage-counter">
              {activeSlideIndex + 1} / {navTotal}
            </span>
            <button
              type="button"
              className="icon-btn"
              disabled={activeSlideIndex >= navTotal - 1}
              onClick={() => setActiveSlide(activeSlideIndex + 1)}
              aria-label={ar ? 'الشريحة التالية' : 'Next slide'}
            >
              <CcIcon name="chevron-right" size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

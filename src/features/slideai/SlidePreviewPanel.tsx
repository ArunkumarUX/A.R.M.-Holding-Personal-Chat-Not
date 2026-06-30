import { useEffect, type CSSProperties } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { CcIcon } from '../../command-centre/CcIcon';
import { slideDisplayTitle } from './deckNormalize';
import { SlideCanvas, SlideThumb } from './SlideCanvas';
import { useSlideStore } from './useSlideStore';

const OPUS_STEPS_EN = [
  'Analysing your brief',
  'Structuring the executive storyline',
  'Building slides & exhibits',
  'Finalising preview',
];

const OPUS_STEPS_AR = [
  'تحليل الموجز',
  'هيكلة القصة التنفيذية',
  'بناء الشرائح والجداول',
  'إنهاء المعاينة',
];

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

function OpusProgressPanel({
  ar,
  slideCount,
  loadingStep,
}: {
  ar: boolean;
  slideCount: number;
  loadingStep: number;
}) {
  const steps = ar ? OPUS_STEPS_AR : OPUS_STEPS_EN;
  const activeStep = Math.min(loadingStep, steps.length - 1);

  return (
    <div className="cc-slideai__perceptis-progress cc-slideai__perceptis-progress--opus">
      <div className="cc-slideai__perceptis-progress-hero">
        <SlideStackPreview slideCount={slideCount} activeIndex={activeStep} />
        <div className="cc-slideai__perceptis-progress-icon-wrap">
          <span className="cc-slideai__perceptis-progress-ring" aria-hidden />
          <div className="cc-slideai__perceptis-progress-icon">
            <CcIcon name="cpu" size={26} />
          </div>
        </div>
      </div>
      <div className="cc-slideai__perceptis-progress-body">
        <span className="cc-slideai__perceptis-progress-live">
          <span className="cc-slideai__perceptis-progress-live-dot" aria-hidden />
          SlideAI
        </span>
        <h3 className="cc-slideai__perceptis-progress-title">{steps[activeStep]}</h3>
        <p className="cc-slideai__perceptis-progress-msg">
          {ar ? 'عادةً 15–45 ثانية' : 'Typically 15–45 seconds'}
        </p>
        <div
          className="cc-slideai__perceptis-progress-bar cc-slideai__perceptis-progress-bar--indeterminate"
          role="progressbar"
          aria-busy="true"
        >
          <span className="cc-slideai__perceptis-progress-fill" />
          <span className="cc-slideai__perceptis-progress-shimmer" aria-hidden />
        </div>
      </div>
    </div>
  );
}

export function SlidePreviewPanel({ ar }: { ar: boolean }) {
  const {
    deck,
    isLoading,
    loadingStep,
    activeSlideIndex,
    previewFlash,
    contentKey,
    setActiveSlide,
    clearPreviewFlash,
  } = useSlideStore(
    useShallow((s) => ({
      deck: s.deck,
      isLoading: s.isLoading,
      loadingStep: s.loadingStep,
      activeSlideIndex: s.activeSlideIndex,
      previewFlash: s.previewFlash,
      contentKey: s.contentKey,
      setActiveSlide: s.setActiveSlide,
      clearPreviewFlash: s.clearPreviewFlash,
    })),
  );

  const hasDeck = Boolean(deck?.slides?.length);
  const navTotal = deck?.slides.length ?? 1;

  useEffect(() => {
    if (!previewFlash) return;
    const timer = window.setTimeout(() => clearPreviewFlash(), 900);
    return () => window.clearTimeout(timer);
  }, [previewFlash, contentKey, clearPreviewFlash]);

  useEffect(() => {
    if (!hasDeck) return;
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
  }, [hasDeck, activeSlideIndex, navTotal, setActiveSlide]);

  if (!hasDeck && !isLoading) {
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
    <div className={`cc-slideai__preview${isLoading ? ' cc-slideai__preview--busy' : ''}`}>
      <div className="cc-slideai__theater">
        <div
          className={`cc-slideai__canvas-wrap${previewFlash ? ' cc-slideai__canvas-wrap--flash' : ''}`}
        >
          {hasDeck ? (
            <SlideCanvas
              key={contentKey}
              slide={deck!.slides[Math.min(activeSlideIndex, deck!.slides.length - 1)]}
              deckTheme={deck!.theme}
              index={activeSlideIndex}
              total={deck!.slides.length}
            />
          ) : (
            <OpusProgressPanel ar={ar} slideCount={8} loadingStep={loadingStep} />
          )}

          {isLoading && hasDeck && (
            <div className="cc-slideai__canvas-loading-overlay" aria-live="polite" aria-busy="true">
              <span className="cc-slideai__preview-busy-pulse" />
              <p>{ar ? 'جاري تحديث الشرائح…' : 'Updating slides…'}</p>
            </div>
          )}
        </div>

        {hasDeck && (
          <div className="cc-slideai__stage-nav">
            <button
              type="button"
              className="icon-btn"
              disabled={activeSlideIndex <= 0 || isLoading}
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
              disabled={activeSlideIndex >= navTotal - 1 || isLoading}
              onClick={() => setActiveSlide(activeSlideIndex + 1)}
              aria-label={ar ? 'الشريحة التالية' : 'Next slide'}
            >
              <CcIcon name="chevron-right" size={18} />
            </button>
          </div>
        )}
      </div>

      {hasDeck && (
        <div className="cc-slideai__filmstrip" role="tablist" aria-label={ar ? 'الشرائح' : 'Slides'}>
          {deck!.slides.map((s, i) => (
            <div
              key={`thumb-${contentKey}-${s.id}-${i}-${slideDisplayTitle(s, i, deck!.title).slice(0, 24)}`}
              className="cc-slideai__filmstrip-item"
            >
              <span className="cc-slideai__filmstrip-num">{i + 1}</span>
              <SlideThumb
                slide={s}
                deckTheme={deck!.theme}
                isActive={i === activeSlideIndex}
                isUpdating={isLoading && i === activeSlideIndex}
                onClick={() => setActiveSlide(i)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

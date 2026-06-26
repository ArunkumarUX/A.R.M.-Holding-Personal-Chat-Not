import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { CcIcon } from '../../command-centre/CcIcon';
import { slideDisplayTitle } from './deckNormalize';
import { useSlideStore } from './useSlideStore';
import { slideStyleToken } from './slideStyle';
import { SlideCanvas, SlideThumb } from './SlideCanvas';

export function SlidePreviewPanel({ ar }: { ar: boolean }) {
  const {
    deck,
    activeSlideIndex,
    deckRevision,
    contentKey,
    isLoading,
    previewFlash,
    setActiveSlide,
    clearPreviewFlash,
  } = useSlideStore(
    useShallow((s) => ({
      deck: s.deck,
      activeSlideIndex: s.activeSlideIndex,
      deckRevision: s.deckRevision,
      contentKey: s.contentKey,
      isLoading: s.isLoading,
      previewFlash: s.previewFlash,
      setActiveSlide: s.setActiveSlide,
      clearPreviewFlash: s.clearPreviewFlash,
    })),
  );

  useEffect(() => {
    if (!deck) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSlide(Math.min(activeSlideIndex + 1, deck.slides.length - 1));
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSlide(Math.max(activeSlideIndex - 1, 0));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deck, activeSlideIndex, setActiveSlide]);

  useEffect(() => {
    if (!previewFlash) return;
    const t = window.setTimeout(() => clearPreviewFlash(), 700);
    return () => window.clearTimeout(t);
  }, [previewFlash, deckRevision, contentKey, clearPreviewFlash]);

  if (!deck) {
    return (
      <div className="cc-slideai__preview-empty">
        <CcIcon name="presentation" size={40} className="cc-slideai__preview-icon" />
        <p>{ar ? 'ستظهر شرائحك هنا' : 'Your slides will appear here'}</p>
        <span className="muted-3">{ar ? 'اكتب في المحادثة للبدء' : 'Chat to start building'}</span>
      </div>
    );
  }

  const active = deck.slides[activeSlideIndex] ?? deck.slides[0];
  if (!active) {
    return (
      <div className="cc-slideai__preview-empty">
        <CcIcon name="presentation" size={40} className="cc-slideai__preview-icon" />
        <p>{ar ? 'لا توجد شرائح بعد' : 'No slides yet'}</p>
      </div>
    );
  }
  const previewClass = [
    'cc-slideai__preview',
    isLoading ? 'cc-slideai__preview--busy' : '',
    previewFlash ? 'cc-slideai__preview--flash' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={previewClass} key={`preview-root-${contentKey}`}>
      {isLoading && (
        <div className="cc-slideai__preview-busy" aria-live="polite" aria-busy="true">
          <span className="cc-slideai__preview-busy-pulse" />
          <span>{ar ? 'جاري تحديث الشرائح…' : 'Updating slides…'}</span>
        </div>
      )}
      <div className="cc-slideai__theater">
        <div
          className={`cc-slideai__canvas-wrap${isLoading ? ' cc-slideai__canvas-wrap--busy' : ''}`}
          key={`canvas-${contentKey}-${deckRevision}`}
        >
          <SlideCanvas
            key={`slide-${contentKey}-${activeSlideIndex}-${active.id}-${slideStyleToken(active)}`}
            slide={active}
            deckTheme={deck.theme}
            index={activeSlideIndex}
            total={deck.slides.length}
          />
        </div>
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
            {activeSlideIndex + 1} / {deck.slides.length}
          </span>
          <button
            type="button"
            className="icon-btn"
            disabled={activeSlideIndex >= deck.slides.length - 1 || isLoading}
            onClick={() => setActiveSlide(activeSlideIndex + 1)}
            aria-label={ar ? 'الشريحة التالية' : 'Next slide'}
          >
            <CcIcon name="chevron-right" size={18} />
          </button>
        </div>
      </div>

      <div className="cc-slideai__filmstrip" role="tablist" aria-label={ar ? 'الشرائح' : 'Slides'}>
        {deck.slides.map((s, i) => (
          <div
            key={`thumb-${contentKey}-${s.id}-${i}-${slideDisplayTitle(s, i, deck.title).slice(0, 24)}`}
            className="cc-slideai__filmstrip-item"
          >
            <span className="cc-slideai__filmstrip-num">{i + 1}</span>
            <SlideThumb
              slide={s}
              deckTheme={deck.theme}
              isActive={i === activeSlideIndex}
              isUpdating={isLoading && i === activeSlideIndex}
              onClick={() => setActiveSlide(i)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

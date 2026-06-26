import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { CcIcon } from '../../command-centre/CcIcon';
import { useApp } from '../../context/AppContext';
import { downloadDeckHtml } from '../../utils/presentationHtmlDeckExport';
import { useSlideStore } from './useSlideStore';
import { exportToPptx } from './pptxExporter';
import { slideAiDeckToPresentationDeck } from './deckAdapters';
import { bccPortfolioCssVars } from './bccPortfolioTemplate';
import SlideAIChat from './SlideAIChat';
import { SlideAiHistorySheet } from './SlideAiHistorySheet';
import { SlidePreviewPanel } from './SlidePreviewPanel';

export function SlideAIPage() {
  const { settings, showToast } = useApp();
  const ar = settings.language === 'ar';
  const [showHistory, setShowHistory] = useState(false);
  const { deck, deckRevision, reset, exportBusy, setExportBusy, refreshHistory } = useSlideStore(
    useShallow((s) => ({
      deck: s.deck,
      deckRevision: s.deckRevision,
      reset: s.reset,
      exportBusy: s.exportBusy,
      setExportBusy: s.setExportBusy,
      refreshHistory: s.refreshHistory,
    })),
  );

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const onExportPptx = async () => {
    if (!deck) return;
    setExportBusy(true);
    try {
      await exportToPptx(deck);
      showToast(ar ? 'تم تنزيل PowerPoint' : 'PowerPoint downloaded', 'success');
    } catch (err) {
      showToast(
        ar ? 'فشل التصدير' : `Export failed: ${err instanceof Error ? err.message : 'unknown error'}`,
        'info',
      );
    } finally {
      setExportBusy(false);
    }
  };

  const onExportHtml = () => {
    if (!deck) return;
    try {
      downloadDeckHtml(slideAiDeckToPresentationDeck(deck));
      showToast(ar ? 'تم تنزيل HTML' : 'HTML deck downloaded', 'success');
    } catch (err) {
      showToast(ar ? 'فشل تصدير HTML' : 'HTML export failed', 'info');
    }
  };

  const onExportJson = () => {
    if (!deck) return;
    const blob = new Blob([JSON.stringify(deck, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arm-holding-deck.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast(ar ? 'تم تنزيل JSON' : 'Deck JSON downloaded', 'success');
  };

  return (
    <div className="cc-slideai" style={bccPortfolioCssVars() as CSSProperties}>
      <aside className="cc-slideai__panel cc-slideai__panel--chat">
        <header className="cc-slideai__panel-head">
          <div>
            <span className="cc-slideai__brand">SlideAI</span>
            <span className="cc-slideai__brand-sub">
              {ar ? 'محادثة لبناء العروض' : 'Chat to build decks'}
            </span>
          </div>
          <div className="cc-slideai__panel-head-actions">
            <button
              type="button"
              className={`pill ghost cc-slideai__history-toggle${showHistory ? ' cc-slideai__history-toggle--on' : ''}`}
              onClick={() => setShowHistory((v) => !v)}
              aria-pressed={showHistory}
            >
              <CcIcon name="history" size={14} />
              {ar ? 'السجل' : 'History'}
            </button>
            {deck && (
              <button type="button" className="pill ghost" onClick={reset}>
                {ar ? 'عرض جديد' : 'New deck'}
              </button>
            )}
          </div>
        </header>
        <SlideAIChat />
        <SlideAiHistorySheet
          ar={ar}
          open={showHistory}
          onClose={() => setShowHistory(false)}
        />
      </aside>

      <section className="cc-slideai__panel cc-slideai__panel--preview">
        <header className="cc-slideai__panel-head">
          <div className="cc-slideai__preview-title">
            <span key={deckRevision}>{deck ? deck.title : ar ? 'معاينة' : 'Preview'}</span>
          </div>
          {deck && (
            <div className="cc-slideai__preview-actions">
              <span className="muted-3">
                {deck.slides.length} {ar ? 'شرائح' : 'slides'}
              </span>
              <button type="button" className="pill ghost cc-slideai__export-secondary" onClick={onExportJson}>
                JSON
              </button>
              <button type="button" className="pill ghost cc-slideai__export-secondary" onClick={onExportHtml}>
                HTML
              </button>
              <button
                type="button"
                className="btn-primary cc-slideai__export"
                onClick={onExportPptx}
                disabled={exportBusy}
              >
                <CcIcon name="download" size={16} />
                {exportBusy ? (ar ? 'جاري التصدير…' : 'Exporting…') : '.pptx'}
              </button>
            </div>
          )}
        </header>
        <SlidePreviewPanel ar={ar} />
      </section>
    </div>
  );
}

export default SlideAIPage;

import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { CcIcon } from '../../command-centre/CcIcon';
import { useApp } from '../../context/AppContext';
import { downloadDeckJob } from '../../api/perceptisDeck';
import { useSlideStore } from './useSlideStore';
import { usePerceptisDeckStore } from './perceptisDeckStore';
import { bccPortfolioCssVars } from './bccPortfolioTemplate';
import SlideAIChat from './SlideAIChat';
import { SlideAiHistorySheet } from './SlideAiHistorySheet';
import { SlidePreviewPanel } from './SlidePreviewPanel';

export function SlideAIPage() {
  const { settings, showToast } = useApp();
  const ar = settings.language === 'ar';
  const [showHistory, setShowHistory] = useState(false);
  const { reset: resetChat, refreshHistory } = useSlideStore(
    useShallow((s) => ({
      reset: s.reset,
      refreshHistory: s.refreshHistory,
    })),
  );

  const { phase, title, prompt, jobId, downloadReady } = usePerceptisDeckStore(
    useShallow((s) => ({
      phase: s.phase,
      title: s.title,
      prompt: s.prompt,
      jobId: s.jobId,
      downloadReady: s.downloadReady,
    })),
  );

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const onReset = () => {
    usePerceptisDeckStore.getState().reset();
    resetChat();
  };

  const onDownloadPptx = () => {
    if (!jobId || !downloadReady) return;
    try {
      const name = (title || prompt || 'apparel-group-deck').replace(/[^\w.-]+/g, '-').slice(0, 60);
      downloadDeckJob(jobId, `${name}.pptx`);
      showToast(ar ? 'تم تنزيل PowerPoint' : 'PowerPoint downloaded', 'success');
    } catch (err) {
      showToast(
        ar ? 'فشل التنزيل' : `Download failed: ${err instanceof Error ? err.message : 'unknown'}`,
        'info',
      );
    }
  };

  const hasJob = phase !== 'idle' || Boolean(prompt);
  const downloadReadyNow = downloadReady && Boolean(jobId);
  const isGenerating = ['queued', 'analysing', 'generating', 'downloading', 'stalled'].includes(phase);
  const downloadLabel = isGenerating
    ? ar
      ? 'جاري الإنشاء…'
      : 'Generating…'
    : ar
      ? 'تنزيل .pptx'
      : 'Download .pptx';

  return (
    <div className="cc-slideai" style={bccPortfolioCssVars() as CSSProperties}>
      <aside className="cc-slideai__panel cc-slideai__panel--chat">
        <header className="cc-slideai__panel-head">
          <div>
            <span className="cc-slideai__brand">SlideAI</span>
            <span className="cc-slideai__brand-sub">
              {ar ? 'Perceptis AI · عروض تنفيذية' : 'Perceptis AI · executive decks'}
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
            {hasJob && (
              <button type="button" className="pill ghost" onClick={onReset}>
                {ar ? 'عرض جديد' : 'New deck'}
              </button>
            )}
          </div>
        </header>
        <SlideAIChat />
        <SlideAiHistorySheet ar={ar} open={showHistory} onClose={() => setShowHistory(false)} />
      </aside>

      <section className="cc-slideai__panel cc-slideai__panel--preview">
        <header className="cc-slideai__panel-head">
          <div className="cc-slideai__preview-title">
            <span className="cc-slideai__preview-title-text" title={title || prompt}>
              {title || (ar ? 'معاينة العرض' : 'Deck preview')}
            </span>
          </div>
          {hasJob && (
            <div className="cc-slideai__preview-actions">
              <span className="cc-slideai__perceptis-pill" data-phase={phase}>
                <CcIcon name="sparkles" size={14} />
                {phase === 'ready' || phase === 'ppt_ready'
                  ? ar
                    ? 'جاهز'
                    : 'Ready'
                  : phase === 'stalled'
                    ? ar
                      ? 'لا يزال قيد المعالجة'
                      : 'Still processing'
                  : phase === 'error'
                    ? ar
                      ? 'أعد المحاولة'
                      : 'Retry available'
                    : isGenerating
                      ? ar
                        ? 'جاري الإنشاء…'
                        : 'Generating…'
                      : ar
                        ? 'في الانتظار'
                        : 'Waiting'}
              </span>
              <button
                type="button"
                className="btn-primary cc-slideai__export"
                onClick={onDownloadPptx}
                disabled={!downloadReadyNow}
              >
                <CcIcon name="download" size={16} />
                {downloadLabel}
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

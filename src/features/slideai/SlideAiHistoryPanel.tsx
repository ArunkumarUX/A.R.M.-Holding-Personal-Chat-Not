import { useMemo } from 'react';
import type { MouseEvent } from 'react';
import { CcIcon } from '../../command-centre/CcIcon';
import {
  formatSlideAiHistoryFullTitle,
  formatSlideAiHistoryPreview,
  formatSlideAiHistoryTitle,
  formatSlideAiHistoryWhen,
  listSlideAiHistory,
  type SlideAiHistoryEntry,
} from './slideAiHistory';
import { useSlideStore } from './useSlideStore';

type Props = {
  ar: boolean;
  variant?: 'preview' | 'inline' | 'sheet';
  onRestored?: () => void;
};

function HistoryItemBody({
  ar,
  variant,
  entry,
  displayTitle,
  displayPreview,
  fullTitle,
}: {
  ar: boolean;
  variant: Props['variant'];
  entry: SlideAiHistoryEntry;
  displayTitle: string;
  displayPreview: string;
  fullTitle: string;
}) {
  const when = formatSlideAiHistoryWhen(entry.updatedAt, ar);
  const slideMeta = `${entry.slideCount} ${ar ? 'شرائح' : 'slides'}`;

  if (variant === 'sheet') {
    return (
      <>
        <strong className="cc-slideai__history-item-title" title={fullTitle}>
          {displayTitle}
        </strong>
        <span className="cc-slideai__history-item-foot">
          <span className="cc-slideai__history-item-meta">{slideMeta}</span>
          <span className="cc-slideai__history-item-when">{when}</span>
        </span>
      </>
    );
  }

  return (
    <>
      <span className="cc-slideai__history-item-top">
        <strong className="cc-slideai__history-item-title" title={fullTitle}>
          {displayTitle}
        </strong>
        <span className="cc-slideai__history-item-meta">{slideMeta}</span>
      </span>
      {displayPreview ? (
        <span className="cc-slideai__history-item-preview">{displayPreview}</span>
      ) : null}
      <span className="cc-slideai__history-item-when">{when}</span>
    </>
  );
}

export function SlideAiHistoryPanel({ ar, variant = 'preview', onRestored }: Props) {
  const historyRevision = useSlideStore((s) => s.historyRevision);
  const entries = useMemo(() => listSlideAiHistory(), [historyRevision]);

  const sessionId = useSlideStore((s) => s.sessionId);
  const restoreSession = useSlideStore((s) => s.restoreSession);
  const removeSession = useSlideStore((s) => s.removeSession);

  if (!entries.length) {
    return (
      <div className={`cc-slideai__history cc-slideai__history--${variant} cc-slideai__history--empty`}>
        <p className="cc-slideai__history-empty">
          {ar ? 'لا يوجد سجل بعد — أنشئ عرضك الأول في المحادثة.' : 'No history yet — build your first deck in chat.'}
        </p>
      </div>
    );
  }

  const onOpen = (entry: SlideAiHistoryEntry) => {
    restoreSession(entry.id);
    onRestored?.();
  };

  const onDelete = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    removeSession(id);
  };

  return (
    <div className={`cc-slideai__history cc-slideai__history--${variant}`}>
      {variant !== 'sheet' && (
        <div className="cc-slideai__history-head">
          <CcIcon name="history" size={14} />
          <span>{ar ? 'السجل' : 'History'}</span>
          <span className="cc-slideai__history-count">{entries.length}</span>
        </div>
      )}
      <ul className="cc-slideai__history-list">
        {entries.map((entry) => {
          const displayTitle = formatSlideAiHistoryTitle(entry);
          const displayPreview =
            variant === 'sheet' ? '' : formatSlideAiHistoryPreview(entry, displayTitle);
          const fullTitle = formatSlideAiHistoryFullTitle(entry);

          return (
            <li key={entry.id}>
              <button
                type="button"
                className={`cc-slideai__history-item${sessionId === entry.id ? ' cc-slideai__history-item--on' : ''}`}
                onClick={() => onOpen(entry)}
              >
                <HistoryItemBody
                  ar={ar}
                  variant={variant}
                  entry={entry}
                  displayTitle={displayTitle}
                  displayPreview={displayPreview}
                  fullTitle={fullTitle}
                />
              </button>
              <button
                type="button"
                className="cc-slideai__history-delete"
                aria-label={ar ? 'حذف من السجل' : 'Remove from history'}
                onClick={(e) => onDelete(e, entry.id)}
              >
                <CcIcon name="trash-2" size={13} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

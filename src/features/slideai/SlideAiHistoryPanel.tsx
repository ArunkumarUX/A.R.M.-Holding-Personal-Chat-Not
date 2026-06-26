import { useMemo } from 'react';
import type { MouseEvent } from 'react';
import { CcIcon } from '../../command-centre/CcIcon';
import {
  formatSlideAiHistoryWhen,
  listSlideAiHistory,
  type SlideAiHistoryEntry,
} from './slideAiHistory';
import { useSlideStore } from './useSlideStore';

type Props = {
  ar: boolean;
  variant?: 'preview' | 'inline';
  onRestored?: () => void;
};

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
      <div className="cc-slideai__history-head">
        <CcIcon name="history" size={14} />
        <span>{ar ? 'السجل' : 'History'}</span>
        <span className="cc-slideai__history-count">{entries.length}</span>
      </div>
      <ul className="cc-slideai__history-list">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              className={`cc-slideai__history-item${sessionId === entry.id ? ' cc-slideai__history-item--on' : ''}`}
              onClick={() => onOpen(entry)}
            >
              <span className="cc-slideai__history-item-top">
                <strong className="cc-slideai__history-item-title">{entry.title}</strong>
                <span className="cc-slideai__history-item-meta">
                  {entry.slideCount} {ar ? 'شرائح' : 'slides'}
                </span>
              </span>
              <span className="cc-slideai__history-item-preview">{entry.previewLine}</span>
              <span className="cc-slideai__history-item-when">
                {formatSlideAiHistoryWhen(entry.updatedAt, ar)}
              </span>
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
        ))}
      </ul>
    </div>
  );
}

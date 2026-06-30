import { useState } from 'react';
import { CcIcon } from '../../command-centre/CcIcon';
import type { Source } from '../../types';
import { sourceDomainLabel, sourcesForStack, type SourceStackItem } from '../../utils/sourceFavicon';

function StackAvatar({ item }: { item: SourceStackItem }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = Boolean(item.faviconUrl) && !imgFailed;

  return (
    <span
      className="chat-source-citation__avatar"
      style={
        showImg
          ? undefined
          : { background: item.bg, color: item.fg }
      }
      aria-hidden
    >
      {showImg ? (
        <img
          src={item.faviconUrl}
          alt=""
          width={22}
          height={22}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="chat-source-citation__letter">{item.letter}</span>
      )}
    </span>
  );
}

type Props = {
  sources: Source[];
  ar?: boolean;
  onClick: () => void;
  maxAvatars?: number;
  /** Inline row for chat footer — no stacked domain pill */
  compact?: boolean;
};

export function SourceCitationChip({ sources, ar, onClick, maxAvatars = 3, compact = false }: Props) {
  const count = sources.length;
  if (count === 0) return null;

  const stack = sourcesForStack(sources, maxAvatars);
  const overflow = Math.max(0, count - stack.length);
  const primaryDomain = sourceDomainLabel(sources[0]);
  const showDomainPill = !compact && primaryDomain && count > 1;

  return (
    <div className={`chat-source-citation-wrap${compact ? ' chat-source-citation-wrap--compact' : ''}`}>
      {showDomainPill && (
        <span className="chat-source-citation__domain-pill">
          {primaryDomain}
          {overflow > 0 ? ` +${overflow}` : ''}
        </span>
      )}
      <button
        type="button"
        className="chat-source-citation"
        onClick={onClick}
        aria-label={
          ar
            ? `عرض ${count} مصدر`
            : `View ${count} source${count === 1 ? '' : 's'}`
        }
      >
        <CcIcon name="link-2" size={15} className="chat-source-citation__link-icon" aria-hidden />
        <span className="chat-source-citation__stack" aria-hidden>
          {stack.map((item) => (
            <StackAvatar key={item.key} item={item} />
          ))}
        </span>
        <span className="chat-source-citation__label">
          {compact
            ? ar
              ? 'المصادر'
              : 'Sources'
            : ar
              ? `${count} مصدر`
              : `${count} source${count === 1 ? '' : 's'}`}
        </span>
      </button>
    </div>
  );
}

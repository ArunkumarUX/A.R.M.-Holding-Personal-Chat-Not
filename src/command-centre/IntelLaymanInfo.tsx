import { useId, useRef, useState } from 'react';
import type { IntelLaymanBlock } from '../data/intelLaymanCopy';
import { CcIcon } from './CcIcon';

/** Blue info icon — plain-language panel for non-specialist readers */
export function IntelLaymanInfo({
  copy,
}: {
  copy: IntelLaymanBlock;
}) {
  const dismiss =
    typeof document !== 'undefined' && document.documentElement.dir === 'rtl'
      ? 'فهمت'
      : 'Got it';
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  return (
    <div className="intel-layman-info" ref={wrapRef}>
      <button
        type="button"
        className="intel-layman-info__btn"
        aria-label={copy.label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        onBlur={(e) => {
          if (!wrapRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
        }}
      >
        <CcIcon name="info" size={16} />
      </button>
      {open ? (
        <div
          className="intel-layman-info__scrim"
          role="presentation"
          onClick={() => setOpen(false)}
          onKeyDown={() => {}}
        />
      ) : null}
      {open ? (
        <div id={id} className="intel-layman-info__panel" role="dialog" aria-labelledby={`${id}-title`}>
          <div id={`${id}-title`} className="intel-layman-info__panel-title">
            {copy.title}
          </div>
          <p className="intel-layman-info__intro">{copy.intro}</p>
          <ul className="intel-layman-info__list">
            {copy.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <p className="intel-layman-info__note">{copy.note}</p>
          <button
            type="button"
            className="intel-layman-info__close"
            onClick={() => setOpen(false)}
          >
            {dismiss}
          </button>
        </div>
      ) : null}
    </div>
  );
}

import { X, ExternalLink, Copy, Library } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import type { Source } from '../../types';

function openHref(href: string) {
  if (href.startsWith('http')) {
    window.open(href, '_blank', 'noopener,noreferrer');
    return;
  }
  window.location.assign(href);
}

function SourceCard({
  src,
  onCopy,
  onOpen,
}: {
  src: Source;
  onCopy: (text: string) => void;
  onOpen: (src: Source) => void;
}) {
  const isKb = src.sourceType === 'knowledge';
  const isExternal = src.sourceType === 'external' || Boolean(src.externalUrl);
  const badge = isKb
    ? 'Knowledge base'
    : isExternal
      ? 'External'
      : src.documentName;

  return (
    <article className="cc-sources-panel__card">
      <div className="cc-sources-panel__card-head">
        <div>
          {src.handle && <code className="cc-sources-panel__handle">{src.handle}</code>}
          <p className="cc-sources-panel__title">{src.title}</p>
          <p className="cc-sources-panel__meta">{badge} · {src.date}</p>
        </div>
      </div>
      {src.excerpt && (
        <p className="cc-sources-panel__excerpt">"{src.excerpt}"</p>
      )}
      <div className="cc-sources-panel__actions">
        {isKb && src.href && (
          <button type="button" className="cc-sources-panel__btn cc-sources-panel__btn--primary" onClick={() => onOpen(src)}>
            <Library className="h-3.5 w-3.5" />
            {src.openLabel ?? 'Open in Knowledge Base'}
          </button>
        )}
        {src.externalUrl && (
          <button
            type="button"
            className="cc-sources-panel__btn"
            onClick={() => openHref(src.externalUrl!)}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open website
          </button>
        )}
        {!isKb && src.href && !src.externalUrl && (
          <button type="button" className="cc-sources-panel__btn" onClick={() => onOpen(src)}>
            <ExternalLink className="h-3.5 w-3.5" />
            {src.openLabel ?? 'Open'}
          </button>
        )}
        {isExternal && src.href && !src.externalUrl && (
          <button type="button" className="cc-sources-panel__btn cc-sources-panel__btn--primary" onClick={() => openHref(src.href!)}>
            <ExternalLink className="h-3.5 w-3.5" />
            {src.openLabel ?? 'Open website'}
          </button>
        )}
        <button
          type="button"
          className="cc-sources-panel__btn cc-sources-panel__btn--ghost"
          onClick={() => onCopy(`"${src.excerpt}" — ${src.title}${src.handle ? ` [${src.handle}]` : ''}`)}
        >
          <Copy className="h-3.5 w-3.5" />
          Copy citation
        </button>
      </div>
    </article>
  );
}

export function SourcePanel() {
  const { sourcesPanelOpen, setSourcesPanelOpen, activeSources, copyMessage, settings } = useApp();
  const ar = settings.language === 'ar';
  const navigate = useNavigate();

  const kbSources = activeSources.filter((s) => s.sourceType === 'knowledge');
  const externalSources = activeSources.filter(
    (s) => s.sourceType === 'external' || (s.externalUrl && s.sourceType !== 'knowledge'),
  );

  const handleOpen = (src: Source) => {
    if (src.sourceType === 'knowledge' && src.href) {
      setSourcesPanelOpen(false);
      navigate(src.href);
      return;
    }
    if (src.href) openHref(src.href);
  };

  return (
    <AnimatePresence>
      {sourcesPanelOpen && (
        <>
          <motion.div
            className="cc-sources-panel__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSourcesPanelOpen(false)}
            aria-hidden
          />
          <motion.aside
            className="cc-sources-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            role="complementary"
            aria-label={ar ? 'المصادر' : 'Sources'}
          >
            <div className="cc-sources-panel__header">
              <div>
                <h2 className="cc-sources-panel__heading">{ar ? 'المصادر' : 'Sources'}</h2>
                <p className="cc-sources-panel__sub">
                  {ar
                    ? `${activeSources.length} مرجع`
                    : `${activeSources.length} reference${activeSources.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSourcesPanelOpen(false)}
                className="cc-sources-panel__close"
                aria-label={ar ? 'إغلاق المصادر' : 'Close sources'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="cc-sources-panel__body">
              {kbSources.length > 0 && (
                <section>
                  <h3 className="cc-sources-panel__section">{ar ? 'قاعدة المعرفة' : 'Knowledge base'}</h3>
                  <div className="cc-sources-panel__list">
                    {kbSources.map((src) => (
                      <SourceCard key={src.id} src={src} onCopy={copyMessage} onOpen={handleOpen} />
                    ))}
                  </div>
                </section>
              )}

              {externalSources.length > 0 && (
                <section>
                  <h3 className="cc-sources-panel__section">
                    {kbSources.length === 0
                      ? ar
                        ? 'تغذيات السوق والتنظيم'
                        : 'Market & regulatory feeds'
                      : ar
                        ? 'روابط خارجية'
                        : 'External links'}
                  </h3>
                  <div className="cc-sources-panel__list">
                    {externalSources.map((src) => (
                      <SourceCard key={src.id} src={src} onCopy={copyMessage} onOpen={handleOpen} />
                    ))}
                  </div>
                </section>
              )}

              {activeSources.length === 0 && (
                <p className="cc-sources-panel__empty">
                  {ar
                    ? 'لا مصادر لهذه الإجابة. افتح محادثة سابقة واضغط شارة المصادر تحت الرسالة.'
                    : 'No sources for this answer. Open a past thread and tap the source chip under the AI message.'}
                </p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

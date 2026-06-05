// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CcIcon } from '../../command-centre/CcIcon';
import { useApp } from '../../context/AppContext';
import { conversationSourceCount, formatChatRelativeTime } from '../../utils/chatMessages';

function groupByTime(conversations, ar) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 86_400_000;
  const groups = {
    today: { label: ar ? 'اليوم' : 'Today', items: [] },
    yesterday: { label: ar ? 'أمس' : 'Yesterday', items: [] },
    earlier: { label: ar ? 'سابقاً' : 'Earlier', items: [] },
  };
  for (const c of conversations) {
    const t = new Date(c.updatedAt).getTime();
    if (t >= startToday) groups.today.items.push(c);
    else if (t >= startYesterday) groups.yesterday.items.push(c);
    else groups.earlier.items.push(c);
  }
  return [groups.today, groups.yesterday, groups.earlier].filter((g) => g.items.length > 0);
}

export function ChatHistorySheet({
  ar,
  open,
  onClose,
}: {
  ar: boolean;
  open: boolean;
  onClose: () => void;
}) {
  const {
    conversations,
    activeConversationId,
    selectConversation,
    startNewChat,
    deleteConversation,
    pinConversation,
    searchQuery,
    setSearchQuery,
    executiveState,
  } = useApp();

  const [menuId, setMenuId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    if (open) setLocalSearch(searchQuery);
  }, [open, searchQuery]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!menuId) return;
    const onPointerDown = (e) => {
      const el = e.target;
      if (el instanceof Element && el.closest('.chat-history-card__more, .chat-history-card__menu')) return;
      setMenuId(null);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [menuId]);

  const t = ar
    ? {
        title: 'المحادثات السابقة',
        sub: 'اختر محادثة أو ابدأ جديدة',
        newChat: 'محادثة جديدة',
        search: 'بحث في المحادثات…',
        empty: 'لا توجد محادثات محفوظة',
        pin: 'تثبيت',
        unpin: 'إلغاء التثبيت',
        delete: 'حذف',
        close: 'إغلاق',
        sources: 'مصادر',
      }
    : {
        title: 'Past conversations',
        sub: 'Pick a thread or start fresh',
        newChat: 'New chat',
        search: 'Search conversations…',
        empty: 'No saved conversations yet',
        pin: 'Pin',
        unpin: 'Unpin',
        delete: 'Delete',
        close: 'Close',
        sources: 'sources',
      };

  const filtered = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    const list = [...conversations].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    if (!q) return list;
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.preview.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q),
    );
  }, [conversations, localSearch]);

  const groups = useMemo(() => groupByTime(filtered, ar), [filtered, ar]);

  const host =
    typeof document !== 'undefined'
      ? document.querySelector('.command-centre-app.app') ??
        document.querySelector('.command-centre-app') ??
        document.body
      : null;

  if (!open || !host) return null;

  const pick = (id) => {
    selectConversation(id);
    setSearchQuery(localSearch);
    onClose();
  };

  const handleNew = () => {
    startNewChat();
    onClose();
  };

  return createPortal(
    <div
      className={`chat-history-sheet-layer ${open ? 'chat-history-sheet-layer--open' : ''}`}
      role="presentation"
    >
      <div
        className="chat-history-sheet-layer__backdrop"
        role="button"
        tabIndex={0}
        aria-label={t.close}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClose();
          }
        }}
      />
      <aside className="chat-history-sheet" aria-label={t.title}>
        <header className="chat-history-sheet__head">
          <div>
            <h2 className="chat-history-sheet__title">{t.title}</h2>
            <p className="chat-history-sheet__sub muted-3">{t.sub}</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t.close}>
            <CcIcon name="x" size={18} />
          </button>
        </header>

        <div className="chat-history-sheet__actions">
          <button type="button" className="btn btn-primary chat-history-sheet__new" onClick={handleNew}>
            <CcIcon name="plus" size={16} />
            {t.newChat}
          </button>
          <div className="chat-history-sheet__search">
            <CcIcon name="search" size={15} className="muted-3" />
            <input
              type="search"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={t.search}
            />
          </div>
        </div>

        <div className="chat-history-sheet__body">
          {groups.length === 0 ? (
            <p className="chat-history-sheet__empty muted-3">{t.empty}</p>
          ) : (
            groups.map((group) => (
              <section key={group.label} className="chat-history-sheet__group">
                <h3 className="chat-history-sheet__group-label">{group.label}</h3>
                <div className="chat-history-sheet__cards">
                  {group.items.map((c) => {
                    const active = c.id === activeConversationId;
                    const srcN = conversationSourceCount(c.messages, executiveState);
                    return (
                      <article
                        key={c.id}
                        className={[
                          'chat-history-card',
                          active ? 'chat-history-card--active' : '',
                          menuId === c.id ? 'chat-history-card--menu-open' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <button type="button" className="chat-history-card__main" onClick={() => pick(c.id)}>
                          <div className="chat-history-card__top">
                            <CcIcon name="message-square" size={16} className="chat-history-card__icon" />
                            <span className="chat-history-card__title">{c.title}</span>
                            {c.pinned && <CcIcon name="pin" size={12} className="chat-history-card__pin" />}
                          </div>
                          {c.preview ? <p className="chat-history-card__preview muted-3">{c.preview}</p> : null}
                          <div className="chat-history-card__foot">
                            {c.category && c.category !== 'General' ? (
                              <span className="pill ghost chat-history-card__cat">{c.category}</span>
                            ) : null}
                            <span className="muted-3" style={{ fontSize: 11 }}>
                              {formatChatRelativeTime(c.updatedAt, ar)}
                              {c.messages.length > 0 ? ` · ${c.messages.length} msgs` : ''}
                              {srcN > 0 ? (
                                <span className="chat-history-card__sources">
                                  {' · '}
                                  <CcIcon name="link-2" size={11} />
                                  {srcN} {t.sources}
                                </span>
                              ) : null}
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          className="chat-history-card__more"
                          aria-label={ar ? 'خيارات المحادثة' : 'Conversation options'}
                          title={ar ? 'خيارات' : 'Options'}
                          aria-expanded={menuId === c.id}
                          aria-haspopup="menu"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuId(menuId === c.id ? null : c.id);
                          }}
                        >
                          <CcIcon name="more-horizontal" size={15} />
                        </button>
                        {menuId === c.id && (
                          <div
                            className="chat-history-card__menu"
                            role="menu"
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                pinConversation(c.id);
                                setMenuId(null);
                              }}
                            >
                              {c.pinned ? t.unpin : t.pin}
                            </button>
                            <button
                              type="button"
                              className="chat-history-card__menu-danger"
                              onClick={() => {
                                deleteConversation(c.id);
                                setMenuId(null);
                              }}
                            >
                              {t.delete}
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </aside>
    </div>,
    host,
  );
}

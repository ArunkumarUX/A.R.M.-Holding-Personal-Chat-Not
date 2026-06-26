import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CcIcon } from '../../command-centre/CcIcon';
import { AdgmLogo } from '../brand/AdgmLogo';
import { useApp } from '../../context/AppContext';
import { needsTour } from '../../auth/authStorage';
import { EXECUTIVE_USER } from '../../config/user';
import { ARCHITECTURE_ENABLED, PPT_MASTER_ENABLED, PRESENTATION_BUILDER_ENABLED } from '../../config/features';

const NAV = [
  {
    group: 'Overview',
    groupAr: 'نظرة عامة',
    items: [
      { id: 'dashboard', path: '/dashboard', icon: 'layout-dashboard', label: 'Executive Home', labelAr: 'الرئيسية التنفيذية' },
      { id: 'chat', path: '/chat', icon: 'sparkles', label: 'Ask Personal AI Agent', labelAr: 'اسأل وكيل الذكاء الشخصي' },
    ],
  },
  {
    group: 'Intelligence',
    groupAr: 'الاستخبارات',
    items: [
      { id: 'performance', path: '/performance', icon: 'gauge', label: 'Performance', labelAr: 'الأداء' },
      { id: 'market', path: '/market', icon: 'globe', label: 'Market Intelligence', labelAr: 'استخبارات السوق' },
      { id: 'regulatory', path: '/regulatory', icon: 'gavel', label: 'Regulatory', labelAr: 'التنظيم' },
      { id: 'knowledge', path: '/knowledge', icon: 'library', label: 'Knowledge Base', labelAr: 'قاعدة المعرفة' },
      { id: 'briefings', path: '/briefings', icon: 'file-text', label: 'Briefings', labelAr: 'الإحاطات' },
    ],
  },
  {
    group: 'System',
    groupAr: 'النظام',
    items: [
      ...(PPT_MASTER_ENABLED
        ? [
            {
              id: 'create-ppt',
              path: '/create-ppt',
              icon: 'presentation',
              label: 'Presentations',
              labelAr: 'إنشاء عرض',
            },
            ...(PRESENTATION_BUILDER_ENABLED
              ? [
                  {
                    id: 'presentation-builder',
                    path: '/presentation-builder',
                    icon: 'file-text',
                    label: 'Deck Builder',
                    labelAr: 'منشئ العروض',
                  },
                ]
              : []),
          ]
        : []),
      ...(ARCHITECTURE_ENABLED
        ? [
            {
              id: 'architecture',
              path: '/architecture',
              icon: 'workflow',
              label: 'Architecture',
              labelAr: 'البنية',
            },
          ]
        : []),
      { id: 'settings', path: '/settings', icon: 'settings', label: 'Settings', labelAr: 'الإعدادات' },
    ],
  },
];

function pathToView(pathname: string) {
  if (pathname.startsWith('/chat')) return 'chat';
  if (pathname.startsWith('/performance')) return 'performance';
  if (pathname.startsWith('/market')) return 'market';
  if (pathname.startsWith('/regulatory')) return 'regulatory';
  if (pathname.startsWith('/knowledge')) return 'knowledge';
  if (pathname.startsWith('/briefings')) return 'briefings';
  if (pathname.startsWith('/create-ppt') || pathname.startsWith('/deck-builder')) return 'create-ppt';
  if (pathname.startsWith('/presentation-builder')) return 'presentation-builder';
  if (pathname.startsWith('/architecture')) return 'architecture';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'dashboard';
}

export function CommandCentreShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings, updateSettings } = useApp();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('cc-sidebar-collapsed') === '1';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tourActive, setTourActive] = useState(() => needsTour());

  useEffect(() => {
    const sync = () => setTourActive(needsTour());
    sync();
    window.addEventListener('adgm-tour-start', sync);
    window.addEventListener('adgm-tour-complete', sync);
    return () => {
      window.removeEventListener('adgm-tour-start', sync);
      window.removeEventListener('adgm-tour-complete', sync);
    };
  }, [location.pathname]);

  const effectiveCollapsed = tourActive ? false : collapsed;

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('cc-sidebar-collapsed', next ? '1' : '0');
      return next;
    });
  };

  const ar = settings.language === 'ar';
  const view = pathToView(location.pathname);
  const isChat = view === 'chat';
  const isSlideAi = view === 'create-ppt' || view === 'presentation-builder';

  /** Icon-only rail on desktop; mobile drawer always shows labels */
  const showSidebarText = tourActive || !effectiveCollapsed || mobileOpen;

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark =
      typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = settings.theme === 'system' && prefersDark ? 'dark' : 'light';
    root.setAttribute('data-theme', theme);
    root.removeAttribute('data-accent');
    root.setAttribute('data-density', 'comfortable');
    root.setAttribute('dir', ar ? 'rtl' : 'ltr');
    root.setAttribute('lang', ar ? 'ar' : 'en');
  }, [settings.theme, ar]);

  return (
    <div className={`command-centre-app app${effectiveCollapsed ? ' collapsed' : ''}`}>
      {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} aria-hidden />}

      <aside
        className={[
          'sidebar',
          effectiveCollapsed ? 'collapsed' : '',
          mobileOpen ? 'mobile-open' : 'mobile-hidden',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={ar ? 'التنقل الرئيسي' : 'Main navigation'}
      >
        <div className="brand-row">
          {showSidebarText ? (
            <AdgmLogo variant="onLight" horizontal size={60} className="brand-logo-full" />
          ) : (
            <AdgmLogo variant="onLight" markOnly size={36} className="brand-mark" />
          )}
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', margin: '0 -6px', padding: '0 6px' }}>
          {NAV.map((g) => (
            <div key={g.group}>
              {showSidebarText ? (
                <div className="nav-group-label">
                  <span>{ar ? g.groupAr : g.group}</span>
                </div>
              ) : (
                <div style={{ height: 14 }} aria-hidden />
              )}
              {g.items.map((it) => {
                const active = location.pathname === it.path || location.pathname.startsWith(`${it.path}/`);
                return (
                  <button
                    key={it.id}
                    type="button"
                    data-nav={it.id}
                    className={['nav-item', active ? 'active' : ''].filter(Boolean).join(' ')}
                    onClick={() => {
                      navigate(it.path);
                      setMobileOpen(false);
                    }}
                    title={ar ? it.labelAr : it.label}
                    aria-label={ar ? it.labelAr : it.label}
                    aria-current={active ? 'page' : undefined}
                  >
                    <CcIcon name={it.icon} size={19} className="ic" />
                    <span className="nav-label">{ar ? it.labelAr : it.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sb-user">
          <div
            className="sb-user-avatar sb-user-avatar--initials"
            aria-label={EXECUTIVE_USER.fullName}
            title={EXECUTIVE_USER.fullName}
          >
            {EXECUTIVE_USER.initials}
          </div>
          {showSidebarText && (
            <div className="sb-user-meta">
              <div className="sb-user-name" title={EXECUTIVE_USER.fullName}>
                {EXECUTIVE_USER.shortName}
              </div>
              <div className="sb-user-role">{EXECUTIVE_USER.orgShort}</div>
            </div>
          )}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="menu">
            <CcIcon name="menu" size={20} />
          </button>
          <button
            type="button"
            className="icon-btn topbar-collapse-btn"
            onClick={toggleCollapsed}
            aria-label={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <CcIcon name={effectiveCollapsed ? 'panel-left-open' : 'panel-left-close'} size={20} />
          </button>
          <div className="topbar__spacer" aria-hidden />
          <div className="seg" role="group" aria-label="language">
            <button type="button" className={!ar ? 'on' : ''} onClick={() => updateSettings({ language: 'en' })}>
              EN
            </button>
            <button type="button" className={ar ? 'on' : ''} onClick={() => updateSettings({ language: 'ar' })}>
              ع
            </button>
          </div>
          <button type="button" className="icon-btn" onClick={() => navigate('/performance')} aria-label="notifications">
            <CcIcon name="bell" size={19} />
          </button>
        </header>

        {isChat || isSlideAi ? (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
        ) : (
          <div className="content">
            <div className="content-pad">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
}

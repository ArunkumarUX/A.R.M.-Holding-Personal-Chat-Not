/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BUILD_FEATURES } from '../../config/features';
import { clearStoredAuth, restartProductTour } from '../../auth/authStorage';
import { CHAT_PATH } from '../../config/auth';
import { AGENTS } from '../../data/commandCentreData';
import { CcIcon } from '../../command-centre/CcIcon';
import { IntelCard, IntelCardBody, IntelIconBox } from '../../command-centre/CcCard';
import type { LanguagePref, ResponseStyle, ThemePref } from '../../types';

const COPY = {
  en: {
    eyebrow: 'Preferences',
    title: 'Settings',
    sub: 'Profile, AI routing, language, privacy, and notifications.',
    profile: 'User profile',
    fullName: 'Full name',
    email: 'Email',
    jobTitle: 'Job title',
    agents: 'AI specialists',
    agentsSub: 'Five agents: Policy, Strategy, Chief of Staff, Relationship, Communications.',
    smartOn: 'Smart routing on — best agents selected automatically',
    smartOff: 'Smart routing off — pick agents manually',
    smartRouting: 'Smart routing',
    lang: 'Language & response',
    prefLang: 'Preferred language',
    responseStyle: 'Response style',
    concise: 'Concise',
    detailed: 'Detailed',
    executive: 'Executive summary',
    privacy: 'Data privacy',
    retain: 'Retain conversation history',
    retainDesc: 'Store chats for continuity across sessions',
    share: 'Share anonymised data for model improvement',
    shareDesc: 'Help improve quality (no confidential content)',
    notifications: 'Notifications',
    emailNotif: 'Email notifications',
    pushNotif: 'Push notifications',
    appearance: 'Appearance',
    appearanceSub: 'Light theme is the default for an institutional executive experience.',
    light: 'Light',
    system: 'System',
    dark: 'Dark',
    darkHint: 'Prototype — light only',
    save: 'Save settings',
    signOut: 'Sign out',
    signOutDesc: 'Return to secure login (QR + PIN)',
    replayTour: 'Replay product tour',
    replayTourDesc: 'Walk through Personal AI features with in-app coach marks',
    dataSync: 'Command Centre data',
    dataSyncSub: 'Auto-refresh at 08:00 & 22:00 GST daily. Use below to refresh meetings, actions, and market snapshot now.',
    lastSync: 'Last sync',
    refreshData: 'Refresh data now',
    refreshing: 'Refreshing…',
    buildInfo: 'Build',
    buildHidden: 'Hidden on live: Create PPT, Architecture',
    langAr: 'Arabic (RTL)',
    langBi: 'Bilingual',
  },
  ar: {
    eyebrow: 'التفضيلات',
    title: 'الإعدادات',
    sub: 'الملف الشخصي، توجيه الذكاء الاصطناعي، اللغة، الخصوصية، والإشعارات.',
    profile: 'الملف الشخصي',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    jobTitle: 'المسمى الوظيفي',
    agents: 'وكلاء الذكاء الاصطناعي',
    agentsSub: 'خمسة وكلاء: السياسات، الاستراتيجية، رئيس الموظفين، العلاقات، الاتصالات.',
    smartOn: 'التوجيه الذكي مفعّل — يختار أفضل الوكلاء تلقائياً',
    smartOff: 'التوجيه الذكي متوقف — اختر الوكلاء يدوياً',
    smartRouting: 'التوجيه الذكي',
    lang: 'اللغة والرد',
    prefLang: 'اللغة المفضلة',
    responseStyle: 'أسلوب الرد',
    concise: 'مختصر',
    detailed: 'مفصّل',
    executive: 'ملخص تنفيذي',
    privacy: 'خصوصية البيانات',
    retain: 'الاحتفاظ بسجل المحادثات',
    retainDesc: 'تخزين المحادثات للاستمرارية بين الجلسات',
    share: 'مشاركة بيانات مجهولة لتحسين النموذج',
    shareDesc: 'المساعدة في التحسين (بدون محتوى سري)',
    notifications: 'الإشعارات',
    emailNotif: 'إشعارات البريد',
    pushNotif: 'إشعارات فورية',
    appearance: 'المظهر',
    appearanceSub: 'السمة الفاتحة هي الافتراضية لتجربة تنفيذية مؤسسية.',
    light: 'فاتح',
    system: 'النظام',
    dark: 'داكن',
    darkHint: 'نموذج أولي — فاتح فقط',
    save: 'حفظ الإعدادات',
    signOut: 'تسجيل الخروج',
    signOutDesc: 'العودة إلى تسجيل الدخول الآمن (QR + PIN)',
    replayTour: 'إعادة جولة المنتج',
    replayTourDesc: 'جولة داخل التطبيق لاستكشاف ميزات الذكاء الشخصي',
    dataSync: 'بيانات مركز القيادة',
    dataSyncSub: 'تحديث تلقائي الساعة 08:00 و22:00 بتوقيت الإمارات. استخدم الزر أدناه للتحديث الفوري.',
    lastSync: 'آخر مزامنة',
    refreshData: 'تحديث البيانات الآن',
    refreshing: 'جاري التحديث…',
    buildInfo: 'الإصدار',
    buildHidden: 'مخفي على الموقع المباشر: إنشاء عرض، البنية',
    langEn: 'English',
    langAr: 'العربية (RTL)',
    langBi: 'ثنائي اللغة',
  },
};

function SettingsField({ label, children }) {
  return (
    <label className="settings-field">
      <span className="settings-field__label">{label}</span>
      {children}
    </label>
  );
}

function SettingsToggle({ label, description, checked, onChange }) {
  return (
    <div className="settings-toggle-row">
      <div className="settings-toggle-row__text">
        <p className="settings-toggle-row__label">{label}</p>
        {description ? <p className="settings-toggle-row__desc muted-3">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={'settings-switch' + (checked ? ' settings-switch--on' : '')}
        onClick={() => onChange(!checked)}
      >
        <span className="settings-switch__thumb" />
      </button>
    </div>
  );
}

function SettingsAgentRow({ agent, selected, ar, onToggle }) {
  return (
    <button
      type="button"
      className={'settings-agent' + (selected ? ' settings-agent--on' : '')}
      onClick={onToggle}
      aria-pressed={selected}
    >
      <IntelIconBox
        icon={agent.icon}
        size="sm"
        color={agent.color}
        background={`color-mix(in oklab, ${agent.color} 14%, transparent)`}
      />
      <div className="settings-agent__body">
        <span className="settings-agent__name">{agent.name}</span>
        <span className="settings-agent__fn muted-3">{agent.fn}</span>
      </div>
      {selected ? (
        <span className="pill good settings-agent__check">
          <CcIcon name="check" size={12} />
          {ar ? 'مفعّل' : 'On'}
        </span>
      ) : (
        <span className="pill ghost settings-agent__check">{ar ? 'إيقاف' : 'Off'}</span>
      )}
    </button>
  );
}

export function SettingsView() {
  const navigate = useNavigate();
  const {
    settings,
    updateSettings,
    saveSettings,
    autoRouteAgents,
    setAutoRouteAgents,
    selectedAgents,
    toggleAgent,
    executiveState,
    refreshExecutiveData,
    isRefreshingData,
  } = useApp();

  const ar = settings.language === 'ar';
  const t = ar ? COPY.ar : COPY.en;

  const [deploySha, setDeploySha] = useState<string | null>(null);

  useEffect(() => {
    fetch('/build-info.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setDeploySha(j?.gitSha ?? null))
      .catch(() => setDeploySha(null));
  }, []);

  const lastSyncLabel = useMemo(() => {
    try {
      return new Date(executiveState.lastSync).toLocaleString(ar ? 'ar-AE' : 'en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Dubai',
      });
    } catch {
      return executiveState.lastSync;
    }
  }, [executiveState.lastSync, ar]);

  const responseStyles: { id: ResponseStyle; label: string }[] = [
    { id: 'concise', label: t.concise },
    { id: 'detailed', label: t.detailed },
    { id: 'executive', label: t.executive },
  ];

  return (
    <div className="grid mi-stagger cc-page settings-page" style={{ gap: 20 }}>
      <div className="section-head">
        <div>
          <div className="eyebrow">{t.eyebrow}</div>
          <h2 style={{ fontSize: 24, marginTop: 4 }}>{t.title}</h2>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: 14, maxWidth: 520 }}>
            {t.sub}
          </p>
        </div>
        <span className="pill ghost">
          <CcIcon name="settings" size={13} />
          {ar ? 'حساب تنفيذي' : 'Executive account'}
        </span>
      </div>

      <IntelCard>
        <IntelCardBody>
          <h3 className="settings-section-title">{t.profile}</h3>
          <div className="settings-form">
            <SettingsField label={t.fullName}>
              <input
                className="settings-input"
                value={settings.name}
                onChange={(e) => updateSettings({ name: e.target.value })}
              />
            </SettingsField>
            <SettingsField label={t.email}>
              <input
                type="email"
                className="settings-input"
                value={settings.email}
                onChange={(e) => updateSettings({ email: e.target.value })}
              />
            </SettingsField>
            <SettingsField label={t.jobTitle}>
              <input
                className="settings-input"
                value={settings.title}
                onChange={(e) => updateSettings({ title: e.target.value })}
              />
            </SettingsField>
          </div>
        </IntelCardBody>
      </IntelCard>

      <IntelCard>
        <IntelCardBody>
          <h3 className="settings-section-title">{t.dataSync}</h3>
          <p className="muted-3" style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.45 }}>
            {t.dataSyncSub}
          </p>
          <p className="settings-sync-meta muted">
            <CcIcon name="refresh-cw" size={14} />
            <span>
              {t.lastSync}: <strong className="kpi-num">{lastSyncLabel}</strong> (GST)
            </span>
          </p>
          <button
            type="button"
            className="btn btn-primary settings-refresh-data"
            disabled={isRefreshingData}
            onClick={() => refreshExecutiveData()}
          >
            <CcIcon name="refresh-cw" size={16} className={isRefreshingData ? 'spin' : ''} />
            {isRefreshingData ? t.refreshing : t.refreshData}
          </button>
          <p className="muted-3 settings-build-foot" style={{ margin: '14px 0 0', fontSize: 12 }}>
            {t.buildInfo}: {BUILD_FEATURES.production ? (ar ? 'إنتاج' : 'Production') : (ar ? 'تطوير' : 'Development')}
            {deploySha ? ` · deploy ${deploySha}` : ''}
            {' · '}
            {t.buildHidden}
          </p>
        </IntelCardBody>
      </IntelCard>

      <IntelCard>
        <IntelCardBody>
          <h3 className="settings-section-title">{t.agents}</h3>
          <p className="muted-3" style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.45 }}>
            {t.agentsSub}
          </p>
          <div className="settings-toggle-row settings-toggle-row--flush">
            <div className="settings-toggle-row__text">
              <p className="settings-toggle-row__label">{t.smartRouting}</p>
              <p className="settings-toggle-row__desc muted-3">
                {autoRouteAgents ? t.smartOn : t.smartOff}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoRouteAgents}
              className={'settings-switch' + (autoRouteAgents ? ' settings-switch--on' : '')}
              onClick={() => setAutoRouteAgents(!autoRouteAgents)}
            >
              <span className="settings-switch__thumb" />
            </button>
          </div>
          {!autoRouteAgents ? (
            <div className="settings-agents">
              {AGENTS.map((agent) => (
                <SettingsAgentRow
                  key={agent.id}
                  agent={agent}
                  ar={ar}
                  selected={selectedAgents.includes(agent.id)}
                  onToggle={() => toggleAgent(agent.id)}
                />
              ))}
            </div>
          ) : (
            <div className="settings-agents-hint mi-pop">
              <CcIcon name="sparkles" size={16} style={{ color: 'var(--accent-bright)', flex: 'none' }} />
              <span className="muted" style={{ fontSize: 13 }}>{t.smartOn}</span>
            </div>
          )}
        </IntelCardBody>
      </IntelCard>

      <IntelCard>
        <IntelCardBody>
          <h3 className="settings-section-title">{t.lang}</h3>
          <div className="settings-form">
            <SettingsField label={t.prefLang}>
              <select
                className="settings-input"
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value as LanguagePref })}
              >
                <option value="en">{t.langEn}</option>
                <option value="ar">{t.langAr}</option>
                <option value="bilingual">{t.langBi}</option>
              </select>
            </SettingsField>
            <div className="settings-field">
              <span className="settings-field__label">{t.responseStyle}</span>
              <div className="seg settings-seg" role="group" aria-label={t.responseStyle}>
                {responseStyles.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={settings.responseStyle === s.id ? 'on' : ''}
                    onClick={() => updateSettings({ responseStyle: s.id })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </IntelCardBody>
      </IntelCard>

      <IntelCard>
        <IntelCardBody>
          <h3 className="settings-section-title">{t.privacy}</h3>
          <SettingsToggle
            label={t.retain}
            description={t.retainDesc}
            checked={settings.retainHistory}
            onChange={(v) => updateSettings({ retainHistory: v })}
          />
          <SettingsToggle
            label={t.share}
            description={t.shareDesc}
            checked={settings.shareForImprovement}
            onChange={(v) => updateSettings({ shareForImprovement: v })}
          />
          <button
            type="button"
            className="btn btn-ghost settings-sign-out"
            onClick={() => {
              if (restartProductTour()) navigate(CHAT_PATH);
            }}
          >
            <CcIcon name="compass" size={16} />
            {t.replayTour}
          </button>
          <p className="muted-3" style={{ margin: '8px 0 12px', fontSize: 12 }}>
            {t.replayTourDesc}
          </p>
          <button
            type="button"
            className="btn btn-ghost settings-sign-out"
            onClick={() => {
              clearStoredAuth();
              navigate('/', { replace: true });
            }}
          >
            <CcIcon name="log-out" size={16} />
            {t.signOut}
          </button>
          <p className="muted-3" style={{ margin: '8px 0 0', fontSize: 12 }}>
            {t.signOutDesc}
          </p>
        </IntelCardBody>
      </IntelCard>

      <IntelCard>
        <IntelCardBody>
          <h3 className="settings-section-title">{t.notifications}</h3>
          <SettingsToggle
            label={t.emailNotif}
            checked={settings.emailNotifications}
            onChange={(v) => updateSettings({ emailNotifications: v })}
          />
          <SettingsToggle
            label={t.pushNotif}
            checked={settings.pushNotifications}
            onChange={(v) => updateSettings({ pushNotifications: v })}
          />
        </IntelCardBody>
      </IntelCard>

      <IntelCard>
        <IntelCardBody>
          <h3 className="settings-section-title">{t.appearance}</h3>
          <p className="muted-3" style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.45 }}>
            {t.appearanceSub}
          </p>
          <div className="seg settings-seg settings-seg--theme" role="group" aria-label={t.appearance}>
            <button
              type="button"
              className={settings.theme === 'light' ? 'on' : ''}
              onClick={() => updateSettings({ theme: 'light' as ThemePref })}
            >
              {t.light}
            </button>
            <button type="button" className="settings-seg__disabled" disabled title={t.darkHint}>
              {t.dark}
            </button>
            <button
              type="button"
              className={settings.theme === 'system' ? 'on' : ''}
              onClick={() => updateSettings({ theme: 'system' })}
            >
              {t.system}
            </button>
          </div>
        </IntelCardBody>
      </IntelCard>

      <button type="button" className="btn btn-primary settings-save" onClick={saveSettings}>
        <CcIcon name="check" size={16} />
        {t.save}
      </button>
    </div>
  );
}

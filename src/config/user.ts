/** Primary user — Personal AI for Rajiv Sehgal (CSO, ADGM) */
export const EXECUTIVE_USER = {
  firstName: 'Rajiv',
  fullName: 'Rajiv Sehgal',
  initials: 'RS',
  /** Sidebar profile — Abu Dhabi skyline */
  profileImage: '/images/executive-profile.png',
  title: 'Chief Strategy Officer',
  organisation: 'Abu Dhabi Global Market (ADGM)',
  orgShort: 'ADGM',
  email: 'rajiv.sehgal@adgm.com',
  /** Demo mobile for login (UAE format) */
  mobile: '+971 50 123 4567',
  mobileE164: '971501234567',
  role: 'cso' as const,
};

/** Product naming — browser title & auth chrome */
export const PRODUCT_NAME = 'Personal AI chat - ADGM';
export const PRODUCT_NAME_AR = 'محادثة الذكاء الشخصي - ADGM';
export const PRODUCT_AGENT_NAME = 'Personal AI Agent';
export const PRODUCT_AGENT_NAME_AR = 'وكيل الذكاء الشخصي';
/** @deprecated Use PRODUCT_AGENT_NAME in product UI */
export const PRODUCT_SHORT_NAME = PRODUCT_AGENT_NAME;
export const PRODUCT_SHORT_NAME_AR = PRODUCT_AGENT_NAME_AR;
export const PRODUCT_SUBTITLE = 'Chief Strategy Officer · ADGM';
export const PRODUCT_SUBTITLE_AR = 'كبير مسؤولي الاستراتيجية · سوق أبوظبي العالمي';
export const PRODUCT_TAGLINE =
  'Strategic intelligence, market opportunities, policy insight, stakeholder readiness and performance visibility.';
export const PRODUCT_TAGLINE_AR =
  'استخبارات استراتيجية، فرص السوق، رؤى السياسات، جاهزية أصحاب المصلحة، ورؤية الأداء.';

export const CSO_DAILY_CAPABILITIES = [
  'Ask strategic questions across approved knowledge sources',
  'Generate board-ready summaries and executive briefings',
  'Compare ADGM against global financial centres',
  'Review opportunities, risks and performance signals in one place',
] as const;

export { greetingForGstTime as greetingForTime } from '../utils/gstGreeting';

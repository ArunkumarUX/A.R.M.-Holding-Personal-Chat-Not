/** Primary user — Personal AI for Apparel Group CEO */
export const EXECUTIVE_USER = {
  firstName: 'Neeraj',
  fullName: 'Neeraj Teckchandani',
  /** Compact label for sidebar and tight UI slots */
  shortName: 'Neeraj',
  initials: 'NT',
  profileImage: '/images/executive-profile.png',
  title: 'Chief Executive Officer',
  /** Full title as listed on apparelgroup.com */
  titleFull: 'Chief Executive Officer, Apparel Group',
  organisation: 'Apparel Group',
  orgShort: 'Apparel Group',
  email: 'ceo@apparelgroup.com',
  mobile: '+971 4 881 8811',
  mobileE164: '97148818811',
  role: 'ceo' as const,
};

/** Product naming — browser title & auth chrome */
export const AGI_EXECUTIVE_OS_NAME = 'AGI Executive OS';
export const PRODUCT_NAME = 'Personal AI - CEO Agent';
export const PRODUCT_NAME_AR = 'الذكاء الشخصي - وكيل الرئيس التنفيذي';
export const PRODUCT_AGENT_NAME = 'AGI Executive OS';
export const PRODUCT_AGENT_NAME_AR = 'وكيل الذكاء الشخصي';
/** @deprecated Use PRODUCT_AGENT_NAME in product UI */
export const PRODUCT_SHORT_NAME = PRODUCT_AGENT_NAME;
export const PRODUCT_SHORT_NAME_AR = PRODUCT_AGENT_NAME_AR;
export const PRODUCT_SUBTITLE = 'CEO · Apparel Group';
export const PRODUCT_SUBTITLE_AR = 'الرئيس التنفيذي · Apparel Group';
export const PRODUCT_TAGLINE =
  'Exceed Expectations Everyday — retail intelligence, GCC market signals, and executive visibility across R&B, 6thStreet, Club Apparel and 85+ international brands.';
export const PRODUCT_TAGLINE_AR =
  'تتجاوز التوقعات كل يوم — استخبارات التجزئة، إشارات سوق الخليج، ورؤية تنفيذية عبر R&B و6thStreet وClub Apparel وأكثر من 85 علامة دولية.';

export const CEO_DAILY_CAPABILITIES = [
  'Ask strategic questions across approved retail and corporate knowledge sources',
  'Generate board-ready summaries and executive briefings for the group',
  'Compare R&B, 6thStreet and Club Apparel performance against GCC retail benchmarks',
  'Review opportunities, risks and performance signals across fashion, footwear, F&B and e-commerce',
  'Track expansion pipeline across 2,500+ stores in 14 countries',
] as const;

/** @deprecated Use CEO_DAILY_CAPABILITIES */
export const CSO_DAILY_CAPABILITIES = CEO_DAILY_CAPABILITIES;

export { greetingForGstTime as greetingForTime } from '../utils/gstGreeting';

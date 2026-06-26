/** Primary user — Personal AI for A.R.M. Holding CEO */
export const EXECUTIVE_USER = {
  firstName: 'Mohammad',
  fullName: 'H.E. Mohammad Saeed Al Shehhi',
  /** Compact label for sidebar and tight UI slots */
  shortName: 'Mohammad Al Shehhi',
  initials: 'MS',
  profileImage: '/images/executive-profile.png',
  title: 'Chief Executive Officer',
  /** Full title as listed on armholding.ae */
  titleFull: 'Vice Chairman of the National Media Authority, CEO of A.R.M. Holding and Director of the Board and General Manager of Emirates Racing Authority',
  organisation: 'A.R.M. Holding',
  orgShort: 'A.R.M. Holding',
  email: 'ceo@armholding.ae',
  mobile: '+971 4 373 0000',
  mobileE164: '97143730000',
  role: 'ceo' as const,
};

/** Product naming — browser title & auth chrome */
export const PRODUCT_NAME = 'Personal AI — A.R.M. Holding';
export const PRODUCT_NAME_AR = 'الذكاء الشخصي — A.R.M. Holding';
export const PRODUCT_AGENT_NAME = 'Personal AI Agent';
export const PRODUCT_AGENT_NAME_AR = 'وكيل الذكاء الشخصي';
/** @deprecated Use PRODUCT_AGENT_NAME in product UI */
export const PRODUCT_SHORT_NAME = PRODUCT_AGENT_NAME;
export const PRODUCT_SHORT_NAME_AR = PRODUCT_AGENT_NAME_AR;
export const PRODUCT_SUBTITLE = 'CEO · A.R.M. Holding';
export const PRODUCT_SUBTITLE_AR = 'الرئيس التنفيذي · A.R.M. Holding';
export const PRODUCT_TAGLINE =
  'Portfolio intelligence, Dubai market signals, real estate and investment insight, stakeholder readiness and performance visibility across DREC, HUNA, HIVE and Capri LLC.';
export const PRODUCT_TAGLINE_AR =
  'استخبارات المحفظة، إشارات سوق دبي، رؤى العقارات والاستثمار، جاهزية أصحاب المصلحة، ورؤية الأداء عبر DREC وHUNA وHIVE وCapri LLC.';

export const CEO_DAILY_CAPABILITIES = [
  'Ask strategic questions across approved portfolio and corporate knowledge sources',
  'Generate board-ready summaries and executive briefings for the holding group',
  'Compare DREC, HUNA and HIVE performance against Dubai market benchmarks',
  'Review opportunities, risks and performance signals across real estate, hospitality and coliving',
  'Track Capri LLC investment pipeline across UAE and international markets',
] as const;

/** @deprecated Use CEO_DAILY_CAPABILITIES */
export const CSO_DAILY_CAPABILITIES = CEO_DAILY_CAPABILITIES;

export { greetingForGstTime as greetingForTime } from '../utils/gstGreeting';

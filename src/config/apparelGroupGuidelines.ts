/**
 * Apparel Group — Brand Guidelines & CEO Intelligence Pack
 * @see https://www.apparelgroup.com/en/about-us/
 */
import { GOTHAM_FONT_STACK } from './fonts';

/** ── Brand identity ─────────────────────────────────────────── */

export const APPAREL_GROUP_BRAND = {
  name: 'Apparel Group',
  nameAr: 'Apparel Group',
  tagline: 'Exceed Expectations Everyday',
  taglineAr: 'تتجاوز التوقعات كل يوم',
  officialTagline: 'EXCEED EXPECTATIONS EVERYDAY',
  siteUrl: 'https://www.apparelgroup.com/',
  founded: 1996,
  headquarters: 'Jebel Ali Free Zone, Dubai, UAE',

  colors: {
    /** Elevate / Apparel Group digital palette */
    navy: '#003399',
    ink: '#003399',
    body: '#4D4D4D',
    black: '#000000',
    white: '#FFFFFF',
    canvas: '#F4F7F9',
    line: '#DDE4EA',
    slate: '#6F7A85',
    /** Official lime accent */
    lime: '#C5D92D',
    accent: '#C5D92D',
    success: '#157347',
    warning: '#B8860B',
    error: '#EB5757',
  },

  typography: {
    primary: GOTHAM_FONT_STACK,
    arabic: "'Noto Naskh Arabic', serif",
    trackingLogo: '0.28em',
    trackingBody: '0.02em',
  },

  voice: {
    tone: 'Confident, commercially sharp, customer-centric, globally minded',
    register: 'Board-level English; formal Modern Standard Arabic when bilingual',
    avoid: ['generic chatbot filler', 'retail jargon', 'unverified store counts'],
  },
} as const;

/** ── Executive leadership ───────────────────────────────────── */

export const APPAREL_GROUP_LEADERSHIP = {
  ceo: {
    name: 'Neeraj Teckchandani',
    title: 'Chief Executive Officer',
    organisation: 'Apparel Group',
  },
  founderChairwoman: {
    name: 'Sima Ganwani Ved',
    title: 'Founder & Chairwoman',
  },
  chairman: {
    name: 'Nilesh Ved',
    title: 'Chairman',
    note: 'AppCorp Holding & Owner of Apparel Group',
  },
  executiveTeam: [
    { name: 'Kamal Kotak', title: 'Chief Business Officer' },
    { name: 'Amit Samdaria', title: 'Chief Financial Officer' },
    { name: 'Krishnan Gopi', title: 'Chief Transformation Officer' },
    { name: 'Anda Dalati', title: 'Chief Marketing Officer' },
    { name: 'Aditi Chandra', title: 'Chief Human Capital Officer' },
    { name: 'Pankaj More', title: 'Chief Information Officer' },
    { name: 'Neethu Abraham', title: 'General Counsel — Legal' },
    { name: 'Arun Pagarani', title: 'Chief Executive Officer, R&B' },
    { name: 'Vivek Rajukumar', title: 'Chief Executive Officer, 6thStreet' },
    { name: 'Selina Ved', title: 'Founder & CEO, Nysaa' },
    { name: 'Jatin Kalra', title: 'VP & Country Head — UAE Sales & Operations' },
    { name: 'Dheeraj Kalwani', title: 'VP & Country Head — KSA' },
    { name: 'Sunil Thakkar', title: 'VP & Country Head — Qatar' },
    { name: 'Dheeraj Ratnani', title: 'VP & Country Head — Bahrain' },
  ],
} as const;

/** ── Company scale & footprint ──────────────────────────────── */

export const APPAREL_GROUP_FACTS = {
  stores: '2,500+',
  brands: '85+',
  employees: '27,000+',
  countries: 14,
  markets: [
    'UAE', 'Saudi Arabia', 'Qatar', 'Bahrain', 'Kuwait', 'Oman',
    'India', 'South Africa', 'Singapore', 'Indonesia', 'Thailand', 'Malaysia', 'Egypt',
  ],
  emergingMarkets: ['Hungary', 'Philippines'],
} as const;

/** ── Portfolio entities (CEO command centre) ──────────────── */

export const APPAREL_GROUP_PORTFOLIO = [
  {
    id: 'rb',
    name: 'R&B Fashion',
    tagline: 'Homegrown value fashion · 100+ stores across GCC',
    ceo: 'Arun Pagarani',
  },
  {
    id: '6thstreet',
    name: '6thStreet',
    tagline: 'Omnichannel e-commerce · phygital retail · 90-min delivery',
    ceo: 'Vivek Rajukumar',
  },
  {
    id: 'club-apparel',
    name: 'Club Apparel',
    tagline: 'Loyalty programme · 10M+ members',
    ceo: null,
  },
  {
    id: 'nysaa',
    name: 'Nysaa',
    tagline: 'Beauty retail · Nykaa GCC partnership',
    ceo: 'Selina Ved',
  },
] as const;

/** ── Key international brands ─────────────────────────────── */

export const APPAREL_GROUP_KEY_BRANDS = [
  'Tommy Hilfiger', 'Charles & Keith', 'Skechers', 'ALDO', 'Crocs', 'Nine West',
  'Calvin Klein', 'Aéropostale', 'Tim Hortons', 'Cold Stone Creamery', 'Inglot',
  'Rituals', 'Barbour', 'Forever New', 'HEYDUDE', 'MLB', 'BCBG', 'Levi\'s',
  'Birkenstock', 'Asics', 'Martha Stewart', 'Sur La Table',
] as const;

/** ── Strategic priorities (2025–2026) ───────────────────────── */

export const APPAREL_GROUP_PRIORITIES = [
  'Saudi Arabia expansion via Arabian Alesaar Group partnership',
  'Omnichannel growth — 6thStreet 90-minute fashion delivery',
  'Club Apparel loyalty scale — 10M+ members milestone',
  'New brand launches — HEYDUDE, Barbour, Forever New, MLB, BCBG',
  'Sustainability leadership — Gulf Sustainability Awards, CSR Impact Seal',
  'KSA, Qatar, Bahrain country-head execution',
] as const;

/** ── Awards & recognition ───────────────────────────────────── */

export const APPAREL_GROUP_AWARDS = [
  'Images RetailME Awards 2025 — dominated spotlight',
  'MENA Retail Partner of the Year — RLI MENA Awards 2024',
  'Most Admired Responsible Retailer of the Year 2023',
  'Retail Company of the Year',
  'Most Admired Retailer of the Year',
  'Gulf Sustainability Award — Waste & Water Management 2022',
] as const;

/** Deck / presentation footer standard */
export const APPAREL_GROUP_DECK_FOOTER = `Apparel Group · ${APPAREL_GROUP_BRAND.tagline} · Confidential`;

/** System-prompt block for SlideAI / presentation builder */
export const APPAREL_GROUP_DECK_BRAND_PROMPT = `
Apparel Group Executive Deck Standard (MANDATORY — always apply):
- Tagline: "${APPAREL_GROUP_BRAND.tagline}" · Brand: Apparel Group · CEO: Neeraj Teckchandani
- Portfolio: R&B Fashion, 6thStreet, Club Apparel, Nysaa + 85+ international brands
- Scale: 2,500+ stores · 27,000+ employees · 14 countries
- Primary palette: Navy ${APPAREL_GROUP_BRAND.colors.navy}, Lime ${APPAREL_GROUP_BRAND.colors.lime}, Body grey ${APPAREL_GROUP_BRAND.colors.body}, Canvas ${APPAREL_GROUP_BRAND.colors.canvas}
- Typography: Gotham (display/body), Noto Naskh Arabic for Arabic content
- Layout: 16:9 widescreen, white and light blue-grey section surfaces, navy headers, lime accents
- Footer: "${APPAREL_GROUP_DECK_FOOTER}"
- Every slide must be specific to Apparel Group retail, GCC expansion, omnichannel, R&B, 6thStreet, Club Apparel, or the user's topic
- Do NOT use generic ADGM, Falcon Economy, or unrelated holding-company content unless the user explicitly requests it
`.trim();

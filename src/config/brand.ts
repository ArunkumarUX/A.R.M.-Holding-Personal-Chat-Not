/**
 * ADGM Brand Book 2025 (May 2025) + digital UI tokens from adgm.com
 * @see docs/brand-2025/TOKENS.md
 * @see https://www.adgm.com/
 */
export const ADGM_BRAND = {
  version: '2025',
  tagline: 'Path to Forward',
  siteUrl: 'https://www.adgm.com/',
  logoSrc: '/adgm-logo.svg',
  /** Official ADGM emblem only — collapsed sidebar (no text) */
  logoSymbolSrc: '/adgm-symbol.svg',
  /** Personal AI app tile — favicon, chat inline */
  logoMarkSrc: '/personal-ai-mark.svg',
  logoAlt: 'ADGM',
  productMarkAlt: 'Personal AI chat - ADGM',

  typography: {
    /** Primary — Gilroy */
    primary: "'adgm-gilroy', 'Gilroy', 'Aptos', 'Segoe UI', system-ui, sans-serif",
    /** Secondary when Gilroy unavailable */
    secondary: "'Aptos', 'Segoe UI', system-ui, sans-serif",
    /** Arabic — Madani Arabic (brand book); Noto fallback for web */
    arabic: "'Madani Arabic', 'Noto Naskh Arabic', serif",
    sans: "'adgm-gilroy', 'Gilroy', 'Aptos', 'Segoe UI', system-ui, sans-serif",
    display: "'adgm-gilroy', 'Gilroy', 'Aptos', 'Segoe UI', system-ui, sans-serif",
    trackingBody: '0.4px',
    numeric: 'var(--font-sans)',
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
    },
  },

  /** Apple-style content canvas grey (product UI) */
  appleGrey: '#F5F5F7',
  appleGreySecondary: '#F2F2F7',

  /** Brand Book 2025 — primary palette */
  primary: {
    clearsky: '#0087FF',
    slate: '#A3ADC2',
    cyan: '#AFFAFF',
    black: '#000000',
  },

  /** Brand Book 2025 — secondary palette */
  secondary: {
    royal: '#002ED1',
    mint: '#E5F0F0',
    sand: '#F0E8D8',
  },

  /** Clearsky scale (digital) */
  blue: {
    50: '#EFFEFF',
    100: '#CCE7FF',
    200: '#99CFFF',
    300: '#66B8FF',
    400: '#33A0FF',
    500: '#0087FF',
    600: '#006DCC',
    700: '#005299',
  },

  /** Midnight navy (digital headers / body on light) */
  navy: {
    DEFAULT: '#00092A',
    mid: '#001C7D',
    deep: '#002ED1',
  },

  cyan: {
    50: '#AFFAFF',
    border: '#7EE8F0',
  },

  neutral: {
    50: '#F7F9FC',
    100: '#EDEFF3',
    200: '#DADEE7',
    300: '#C8CEDA',
    400: '#A3ADC2',
    500: '#6F8897',
    600: '#4A5568',
  },

  surface: {
    mint: '#E5F0F0',
    sand: '#F0E8D8',
    sky: '#EBF7FB',
    white: '#FFFFFF',
  },

  semantic: {
    success: '#157347',
    warning: '#B8860B',
    error: '#EB5757',
    info: '#0087FF',
  },
} as const;

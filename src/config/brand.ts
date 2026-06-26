/**
 * A.R.M. Holding brand tokens — sourced from armholding.ae
 * Official logo ink: #242321
 * @see https://www.armholding.ae/
 */
export const ADGM_BRAND = {
  version: '2026',
  tagline: 'We Emerge Stronger',
  siteUrl: 'https://www.armholding.ae/',
  logoSrc: '/arm-logo.svg',
  logoOnDarkSrc: '/arm-logo-white.svg',
  logoSymbolSrc: '/arm-symbol.svg',
  logoMarkSrc: '/arm-symbol.svg',
  logoAlt: 'A.R.M. Holding',
  productMarkAlt: 'Personal AI — A.R.M. Holding',

  /** Official logo aspect ratio (228×128 from armholding.ae) */
  logoAspect: 228 / 128,

  typography: {
    primary: "'proxima-nova', 'Proxima Nova', 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif",
    secondary: "'proxima-nova', 'Proxima Nova', 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif",
    arabic: "'Noto Naskh Arabic', serif",
    sans: "'proxima-nova', 'Proxima Nova', 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif",
    display: "'proxima-nova', 'Proxima Nova', 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif",
    trackingBody: '0.02em',
    trackingLogo: '0.28em',
    numeric: 'var(--font-sans)',
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
    },
  },

  appleGrey: '#F7F7F7',
  appleGreySecondary: '#F2F2F2',

  primary: {
    clearsky: '#242321',
    slate: '#8A8A8A',
    cyan: '#E8E8E8',
    black: '#000000',
  },

  secondary: {
    royal: '#242321',
    mint: '#F5F5F5',
    sand: '#EBEBEB',
  },

  blue: {
    50: '#FAFAFA',
    100: '#F0F0F0',
    200: '#E0E0E0',
    300: '#C8C8C8',
    400: '#8A8A8A',
    500: '#242321',
    600: '#1A1A1A',
    700: '#000000',
  },

  navy: {
    DEFAULT: '#000000',
    mid: '#141414',
    deep: '#242321',
  },

  cyan: {
    50: '#F5F5F5',
    border: '#E0E0E0',
  },

  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EBEBEB',
    300: '#D4D4D4',
    400: '#8A8A8A',
    500: '#6F6F6F',
    600: '#4A4A4A',
  },

  surface: {
    mint: '#F5F5F5',
    sand: '#EBEBEB',
    sky: '#FAFAFA',
    white: '#FFFFFF',
  },

  semantic: {
    success: '#157347',
    warning: '#B8860B',
    error: '#EB5757',
    info: '#242321',
  },
} as const;

export const ARM_BRAND = ADGM_BRAND;

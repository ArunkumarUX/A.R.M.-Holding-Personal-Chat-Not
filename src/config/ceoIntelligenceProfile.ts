/**
 * CEO Intelligence Profile — client-side mirror of server/ceoIntelligenceProfile.mjs
 * Update both files when priorities or delegation change.
 */

export const CEO_INTELLIGENCE_PROFILE = {
  productName: 'AGI Executive OS',
  ceoName: 'Neeraj Teckchandani',
  ceoRole: 'Chief Executive Officer',
  organisation: 'Apparel Group',
  businessScope:
    'Multinational fashion and lifestyle retail — 85+ brands, 2,500+ stores, 27,000+ employees, operations across 14 countries.',
  footprint: {
    brands: 85,
    stores: 2500,
    employees: 27000,
    countries: 14,
  },
  flagshipBrands: [
    'ALDO',
    'Tommy Hilfiger',
    'Skechers',
    'Charles & Keith',
    'Tim Hortons',
    'R&B',
    '6thStreet',
    'Club Apparel',
  ],
  strategicPriorities: [
    'Saudi Arabia expansion',
    'Omnichannel and digital growth (6thStreet)',
    'Comparable-store and margin improvement',
    'Club Apparel loyalty growth',
    'Cross-brand synergies',
  ],
} as const;

export const EXECUTIVE_COMMANDS = [
  'Morning Brief',
  'Board Mode',
  'Crisis Mode',
  'Deal Room',
  'Growth Mode',
  'Red Team',
  'Customer Mode',
  'Performance Mode',
  'Weekly Review',
  'Portfolio Review',
  'What Am I Missing?',
  'Simplify',
  'Go Deeper',
  'Challenge Me',
  'Act Now',
] as const;

export type MilestoneVisual = 'founding' | 'growth' | 'global' | 'digital' | 'awards' | 'future';

export type ApparelMilestone = {
  year: number;
  headline: string;
  items: string[];
  visual: MilestoneVisual;
  stat?: string;
};

export const MILESTONE_START_YEAR = 1996;
export const MILESTONE_END_YEAR = 2026;

export const APPAREL_MILESTONES: ApparelMilestone[] = [
  {
    year: 1996,
    headline: 'Apparel Group begins its journey towards success',
    items: [
      'Founded in Dubai with a vision to bring world-class brands to the Middle East',
      'First steps in Jebel Ali Free Zone — building a retail platform for the region',
      'Where dreams come alive — the foundation of a global fashion house',
    ],
    visual: 'founding',
    stat: 'Year one',
  },
  {
    year: 1999,
    headline: 'From one store to a regional retail platform',
    items: [
      'Opened the first Apparel Group store — the start of multi-brand retail in the GCC',
      'Established partnerships with international fashion and lifestyle brands',
      'Built the operating model that would scale across 14 countries',
    ],
    visual: 'growth',
    stat: '1 store',
  },
  {
    year: 2010,
    headline: 'Accelerating GCC footprint and brand portfolio',
    items: [
      'Expanded across UAE, Saudi Arabia, Qatar, Bahrain, and Kuwait',
      'Scaled Tommy Hilfiger, Skechers, ALDO, and Charles & Keith across the region',
      'Grew team strength to support multi-country operations',
    ],
    visual: 'growth',
    stat: 'GCC scale',
  },
  {
    year: 2018,
    headline: 'Digital commerce and loyalty take centre stage',
    items: [
      '6thStreet omnichannel platform gains momentum across the GCC',
      'Club Apparel loyalty programme scales member engagement',
      'R&B Fashion strengthens homegrown value fashion leadership',
    ],
    visual: 'digital',
    stat: 'Omnichannel',
  },
  {
    year: 2024,
    headline: 'Industry recognition and responsible retail leadership',
    items: [
      'MENA Retail Partner of the Year — RLI MENA Awards 2024',
      'Most Admired Responsible Retailer of the Year 2023',
      'Gulf Sustainability Award — Waste & Water Management',
      'Arabian Alesaar partnership accelerates Saudi Arabia expansion',
    ],
    visual: 'awards',
    stat: 'Award-winning',
  },
  {
    year: 2025,
    headline: 'A landmark year of launches and industry dominance',
    items: [
      'Wins big at the Images RetailME Awards 2025',
      'Launches HEYDUDE in KSA, UAE, Bahrain, Kuwait, Egypt, and Oman',
      'Launches Martha Stewart and Sur La Table in KSA',
      'Launches Barbour in the UAE; Forever New in KSA',
      'Launches MLB and BCBG in Qatar',
    ],
    visual: 'awards',
    stat: 'RetailME 2025',
  },
  {
    year: 2026,
    headline: '2,500+ stores · 85+ brands · 27,000+ team members',
    items: [
      '14 countries across Middle East, Africa, and Asia',
      'R&B, 6thStreet, Club Apparel, and Nysaa driving portfolio growth',
      '90-minute fashion delivery and phygital retail at scale',
      'Exceed Expectations Everyday — the journey continues',
    ],
    visual: 'future',
    stat: '2,500+ stores',
  },
];

export const MILESTONE_YEARS = APPAREL_MILESTONES.map((m) => m.year);

export const ALL_MILESTONE_YEARS = Array.from(
  { length: MILESTONE_END_YEAR - MILESTONE_START_YEAR + 1 },
  (_, i) => MILESTONE_START_YEAR + i,
);

export function getMilestoneForYear(year: number): ApparelMilestone {
  return (
    APPAREL_MILESTONES.find((m) => m.year === year) ??
    APPAREL_MILESTONES[APPAREL_MILESTONES.length - 1]
  );
}

export function getNearestMilestoneYear(year: number): number {
  const known = MILESTONE_YEARS;
  if (known.includes(year)) return year;
  let nearest = known[0];
  for (const y of known) {
    if (Math.abs(y - year) < Math.abs(nearest - year)) nearest = y;
  }
  return nearest;
}

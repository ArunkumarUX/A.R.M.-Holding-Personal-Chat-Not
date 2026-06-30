/**
 * CEO Intelligence Profile — maintained separately from the master system prompt.
 * Update here when priorities, targets, or delegation change.
 */

export const CEO_INTELLIGENCE_PROFILE = {
  productName: 'AGI Executive OS',
  ceoName: 'Neeraj Teckchandani',
  ceoRole: 'Chief Executive Officer',
  organisation: 'Apparel Group',
  businessScope:
    'Multinational fashion and lifestyle retail — 85+ brands, 2,500+ stores, 27,000+ employees, operations across 14 countries. Integrated omnichannel portfolio spanning global and homegrown brands.',
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
    "Charles & Keith",
    'Tim Hortons',
    'R&B',
    '6thStreet',
    'Club Apparel',
    'Crocs',
    'Cold Stone Creamery',
    'Rituals',
    'Forever New',
    'Nysaa',
  ],
  markets: [
    'UAE',
    'Saudi Arabia',
    'Qatar',
    'Bahrain',
    'Kuwait',
    'Oman',
    'India',
    'South Africa',
    'Singapore',
    'Indonesia',
    'Thailand',
    'Malaysia',
    'Egypt',
  ],
  categories: [
    'Fashion',
    'Footwear',
    'Accessories',
    'Beauty and cosmetics',
    "Children's retail",
    'Food and beverage',
    'Lifestyle retail',
    'E-commerce',
    'Omnichannel retail',
    'Loyalty',
    'Logistics and distribution',
    'Franchise operations',
  ],
  strategicPriorities: [
    'Saudi Arabia expansion',
    'Omnichannel and digital growth (6thStreet)',
    'Comparable-store and margin improvement',
    'Inventory productivity and full-price sell-through',
    'Club Apparel loyalty growth',
    'Sustainability and Gulf Sustainability Awards positioning',
    'New brand launches across fashion, footwear and F&B',
    'Cross-brand synergies without weakening brand differentiation',
  ],
  financialTargets: 'Use approved board and internal performance data only — never invent targets.',
  briefingStyle: 'Verdict first. Tables for comparisons and actions. Five sentences max for executive verdict.',
  riskTolerance: 'Material risks surfaced early; constructive challenge welcomed.',
  decisionStyle: 'Evidence-driven recommendations with explicit decision labels (APPROVE, PILOT, ESCALATE, etc.).',
  communicationPreferences: 'Board-ready English by default; formal Modern Standard Arabic when requested.',
  keyStakeholders: 'Board, brand licensors, mall operators, franchise partners, regional leadership, government and regulatory bodies in operating markets.',
  delegatedAuthorities: 'CEO retains authority for enterprise strategy, major partnerships, market entry, capital allocation above delegated thresholds, and material reputational issues.',
  restrictedTopics: 'Unreleased results, acquisition discussions, confidential contracts, employee personal data, credentials, and unapproved external commitments.',
  escalationThresholds:
    'Fraud, data breach, customer harm, employee safety, regulatory breach, material reputational risk, unauthorised transactions, sanctions exposure.',
  leadership: {
    founderChairwoman: 'Sima Ganwani Ved',
    chairman: 'Nilesh Ved',
  },
  headquarters: 'Dubai, UAE',
  founded: 1996,
};

export function formatCeoProfileBlock(profile = CEO_INTELLIGENCE_PROFILE) {
  return `## AUTHORISED CEO PROFILE (Section 34 — personalisation layer)

CEO name: ${profile.ceoName}
Role: ${profile.ceoRole}
Organisation: ${profile.organisation}
Business scope: ${profile.businessScope}
Countries: ${profile.markets.join(', ')}
Key brands: ${profile.flagshipBrands.join(', ')}
Strategic priorities: ${profile.strategicPriorities.join(' · ')}
Financial targets: ${profile.financialTargets}
Preferred briefing style: ${profile.briefingStyle}
Risk tolerance: ${profile.riskTolerance}
Decision style: ${profile.decisionStyle}
Communication preferences: ${profile.communicationPreferences}
Key stakeholders: ${profile.keyStakeholders}
Delegated authorities: ${profile.delegatedAuthorities}
Restricted topics: ${profile.restrictedTopics}
Escalation thresholds: ${profile.escalationThresholds}

Adapt presentation to CEO preferences. Never adapt evidence or conclusions merely to match preferences.`;
}

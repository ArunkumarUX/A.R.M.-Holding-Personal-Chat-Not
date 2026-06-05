import type { AgentType, DocumentFile, FocusAreaId, Workflow } from '../types';

export type { FocusAreaId };

export interface FocusArea {
  id: FocusAreaId;
  title: string;
  shortTitle: string;
  description: string;
  capabilities: string[];
  icon: 'globe' | 'calendar' | 'scale' | 'mail' | 'users' | 'library';
  agents: AgentType[];
  prompts: string[];
  workflowIds: string[];
}

/** Core focus areas — Chief Strategy Office personal AI (spec) */
export const CORE_FOCUS_AREAS: FocusArea[] = [
  {
    id: 'strategic-intelligence',
    title: 'Strategic Intelligence & Briefings',
    shortTitle: 'Intelligence',
    description:
      'Daily AI-generated briefings on global financial markets, regulatory developments, fintech trends, and ADGM-specific news. Competitor intelligence on DIFC, Singapore, Luxembourg, and Hong Kong. Real-time alerts on geopolitical events affecting Abu Dhabi’s financial sector.',
    capabilities: [
      'Daily AI-generated briefings on markets, regulation, fintech, and ADGM news',
      'Competitor intelligence — DIFC, Singapore, Luxembourg, Hong Kong',
      'Real-time alerts on geopolitical events affecting Abu Dhabi finance',
    ],
    icon: 'globe',
    agents: ['strategy', 'policy'],
    workflowIds: [],
    prompts: [
      'Give me my overnight intelligence briefing — what are the most important developments I need to know today?',
      'What are the top investment opportunities Abu Dhabi should prioritise based on current global capital flows?',
      'How can Abu Dhabi and ADGM differentiate to attract institutions, founders, and global financial players?',
      'How is DIFC positioning on fintech compared to ADGM this week?',
    ],
  },
  {
    id: 'meetings',
    title: 'Meeting & Agenda Preparation',
    shortTitle: 'Meetings',
    description:
      'Auto-generated pre-meeting briefs on attendees, organisations, and context. Post-meeting summaries, action extraction, and follow-up drafting. Board pack preparation and executive summaries from complex documents.',
    capabilities: [
      'Auto-generated pre-meeting briefs on attendees, organisations, and context',
      'Post-meeting summaries, action item extraction, and follow-up drafting',
      'Board pack preparation and executive summary generation',
    ],
    icon: 'calendar',
    agents: ['cos', 'relationship', 'comms'],
    workflowIds: ['w1', 'w2'],
    prompts: [
      'Brief me on my 3pm meeting tomorrow — attendees and context',
      'Extract action items from my last Mubadala meeting notes',
      'Executive summary of the Q2 board pack for the board meeting',
      'Draft follow-up email after today’s MAS delegation meeting',
    ],
  },
  {
    id: 'regulatory',
    title: 'Regulatory & Policy Intelligence',
    shortTitle: 'Regulatory',
    description:
      'Monitoring of global financial regulation changes relevant to ADGM’s framework. AI-assisted drafting and review of policy documents, frameworks, and consultation papers. Cross-referencing ADGM regulations against international best practice.',
    capabilities: [
      'Monitoring global financial regulation relevant to ADGM',
      'AI-assisted drafting of policy documents and consultation responses',
      'Cross-reference ADGM regulations against international best practice',
    ],
    icon: 'scale',
    agents: ['policy', 'strategy'],
    workflowIds: ['w4'],
    prompts: [
      "Compare ADGM's digital assets framework against Singapore MAS",
      'Assess impact of the latest MAS stablecoin consultation on ADGM',
      'Draft an executive summary for an FSRA policy consultation response',
      'Which international best practices should ADGM adopt for virtual asset custody?',
    ],
  },
  {
    id: 'correspondence',
    title: 'Correspondence & Communications',
    shortTitle: 'Communications',
    description:
      'AI-assisted drafting of executive communications, speeches, and public statements. Prioritisation and summarisation of inbound correspondence. Multilingual capability for Arabic and English communications.',
    capabilities: [
      'AI-assisted drafting of speeches, statements, and executive letters',
      'Prioritisation and summarisation of inbound correspondence',
      'Arabic and English communications with formal register',
    ],
    icon: 'mail',
    agents: ['comms', 'cos'],
    workflowIds: ['w5'],
    prompts: [
      "Draft a note to HH's office on ADGM's Q2 performance in Arabic and English",
      'Draft talking points for the ADFW opening keynote in my voice',
      'Summarise my priority inbound correspondence from the last 48 hours',
      'Review this ministerial note for tone and FSRA Arabic terminology',
    ],
  },
  {
    id: 'stakeholders',
    title: 'Stakeholder & Relationship Management',
    shortTitle: 'Stakeholders',
    description:
      'Intelligent CRM tracking relationships, interactions, commitments, and follow-ups. Briefing notes on key stakeholders before engagements. Tracking ADGM strategic partnerships and commitments globally.',
    capabilities: [
      'Track relationships, last interactions, commitments, and follow-ups',
      'Briefing notes on key stakeholders before engagements',
      'Track ADGM strategic partnerships and global commitments',
    ],
    icon: 'users',
    agents: ['relationship', 'cos'],
    workflowIds: ['w3'],
    prompts: [
      'What did I commit to in my last meeting with Mubadala leadership?',
      'Stakeholder profile for Singapore MAS delegation — history and sensitivities',
      'Which strategic partnerships have follow-ups due this month?',
      'Open commitments with Goldman from April — status check',
    ],
  },
  {
    id: 'knowledge',
    title: 'Knowledge Management',
    shortTitle: 'Knowledge',
    description:
      'Instant access to ADGM institutional knowledge — reports, frameworks, historical decisions, and precedents. AI-powered search across internal documents and correspondence. Preservation of knowledge beyond individual tenures.',
    capabilities: [
      'Instant access to reports, frameworks, decisions, and precedents',
      'AI-powered search across documents, contracts, and correspondence',
      'Preserve institutional knowledge beyond individual tenures',
    ],
    icon: 'library',
    agents: ['policy', 'strategy', 'cos'],
    workflowIds: [],
    prompts: [
      'What strategic decisions did ADGM make in 2024 and how do they track against Falcon Economy priorities?',
      'Find precedents on digital assets policy decisions in our knowledge base',
      'Summarise the FSRA virtual assets framework for a new board member',
      'Search internal documents for Italy financial engagement milestones',
    ],
  },
];

export const FOCUS_AREA_MAP = Object.fromEntries(
  CORE_FOCUS_AREAS.map((a) => [a.id, a]),
) as Record<FocusAreaId, FocusArea>;

export const CONVERSATION_CATEGORIES = [
  'All',
  ...CORE_FOCUS_AREAS.map((a) => a.shortTitle),
];

export function getFocusArea(id: FocusAreaId): FocusArea {
  return FOCUS_AREA_MAP[id];
}

export function getFocusAreaByExactPrompt(prompt: string): FocusArea | undefined {
  const normalized = prompt.trim().toLowerCase();
  return CORE_FOCUS_AREAS.find((area) =>
    area.prompts.some((p) => p.trim().toLowerCase() === normalized),
  );
}

export function resolveFocusAreaForQuery(query: string): FocusAreaId | null {
  const exact = getFocusAreaByExactPrompt(query);
  if (exact) return exact.id;
  return matchFocusArea(query);
}

export function matchFocusArea(query: string): FocusAreaId | null {
  const q = query.toLowerCase();
  if (
    (q.includes('daily') && (q.includes('brief') || q.includes('briefing'))) ||
    q.includes('geopolitical') ||
    q.includes('competitor') ||
    (q.includes('difc') && !q.includes('mas') && !q.includes('compare')) ||
    q.includes('fintech trend') ||
    q.includes('luxembourg') ||
    q.includes('hong kong')
  ) {
    return 'strategic-intelligence';
  }
  if (
    q.includes('meeting') ||
    q.includes('board pack') ||
    q.includes('action item') ||
    (q.includes('follow-up') && q.includes('email')) ||
    q.includes('agenda') ||
    q.includes('pre-meeting')
  ) {
    return 'meetings';
  }
  if (
    (q.includes('regulat') || q.includes('fsra') || q.includes('consultation')) &&
    !q.includes('inbound')
  ) {
    if (q.includes('mas') || q.includes('policy') || q.includes('framework') || q.includes('best practice')) {
      return 'regulatory';
    }
  }
  if (
    q.includes('correspondence') ||
    q.includes('inbound') ||
    q.includes('ministerial') ||
    q.includes('talking points') ||
    q.includes('speech') ||
    (q.includes('arabic') && q.includes('draft')) ||
    (q.includes('hh') && q.includes('office'))
  ) {
    return 'correspondence';
  }
  if (
    q.includes('stakeholder') ||
    q.includes('mubadala') ||
    q.includes('goldman') ||
    q.includes('commitment') ||
    q.includes('partnership') ||
    q.includes('crm')
  ) {
    return 'stakeholders';
  }
  if (
    q.includes('knowledge') ||
    q.includes('precedent') ||
    q.includes('falcon') ||
    q.includes('institutional') ||
    (q.includes('search') && q.includes('document'))
  ) {
    return 'knowledge';
  }
  return null;
}

export const ALL_FOCUS_PROMPTS = CORE_FOCUS_AREAS.flatMap((a) => a.prompts);

export function getWorkflowsForFocusArea(focusId: FocusAreaId, workflows: Workflow[]): Workflow[] {
  return workflows.filter(
    (w) => w.focusAreaId === focusId || FOCUS_AREA_MAP[focusId].workflowIds.includes(w.id),
  );
}

export function getDocumentsForFocusArea(
  focusId: FocusAreaId,
  documents: DocumentFile[],
): DocumentFile[] {
  return documents.filter((d) => d.focusAreaIds?.includes(focusId));
}

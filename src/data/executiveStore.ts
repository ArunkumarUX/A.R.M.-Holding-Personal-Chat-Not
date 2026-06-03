/**
 * Unified executive data — single source of truth for all flows.
 * Persisted to localStorage; responses cite live store values.
 */
import type {
  AgentType,
  Conversation,
  DepartmentPerformance,
  DocumentFile,
  MorningSignal,
  RagStatus,
  Source,
} from '../types';
import { PERFORMANCE_DEPARTMENTS } from './v5SpecData';
import { ALL_FOCUS_PROMPTS, resolveFocusAreaForQuery } from './focusAreas';
import { buildFocusAreaResponse } from './focusResponses';
import {
  actionNow,
  agentTag,
  metricTable,
  plainTerms,
  scoreBar,
  signalEmoji,
} from '../utils/executiveAnswerVisuals';

const STORAGE_KEY = 'adgm-executive-state-v3';

export interface Meeting {
  id: string;
  title: string;
  time: string;
  attendees: string;
  location: string;
  prepStatus: 'ready' | 'pending';
}

export interface ActionItem {
  id: string;
  title: string;
  owner: string;
  due: string;
  status: 'open' | 'overdue' | 'done';
  departmentId?: string;
}

export interface ActivityPoint {
  day: string;
  queries: number;
  confidence: number;
}

export interface ExecutiveMetrics {
  queriesThisWeek: number;
  documentsInKb: number;
  briefingsGenerated: number;
  avgConfidence: number;
  departmentsOnTrack: number;
  openActions: number;
}

export interface ExecutiveState {
  version: 3;
  lastSync: string;
  metrics: ExecutiveMetrics;
  departments: DepartmentPerformance[];
  documents: DocumentFile[];
  conversations: Conversation[];
  meetings: Meeting[];
  actionRegister: ActionItem[];
  activityWeek: ActivityPoint[];
  marketSnapshot: {
    gccEquities: string;
    digitalAssetsWoW: string;
    competitorNote: string;
    topSector: string;
  };
}

const SEED_DOCUMENTS: DocumentFile[] = [
  {
    id: 'd1',
    name: 'Q2_Board_Pack_Draft_v3.pdf',
    type: 'PDF',
    size: '4.1 MB',
    uploadedAt: '2026-06-01',
    status: 'ready',
    summary:
      'Q2 board materials: FSRA performance, strategic partnerships, D33 alignment. Three board decisions flagged.',
    keyInsights: [
      'Digital assets framework — board decision required',
      'Licence growth +12% YoY',
      'DIFC fintech competitive pressure — proactive positioning recommended',
    ],
    focusAreaIds: ['meetings', 'knowledge'],
    clauses: [
      {
        title: 'Section 2 — Executive summary',
        text: 'ADGM continues to strengthen its position as a leading international financial centre...',
      },
    ],
  },
  {
    id: 'd2',
    name: 'FSRA_Virtual_Assets_Framework_2026.pdf',
    type: 'PDF',
    size: '2.8 MB',
    uploadedAt: '2026-05-29',
    status: 'ready',
    summary: 'FSRA principle-based VASP licensing taxonomy — comparison baseline for MAS benchmarking.',
    keyInsights: ['Full licensing taxonomy', 'Retail access with safeguards', 'Institutional custody requirements'],
    focusAreaIds: ['regulatory', 'knowledge'],
    clauses: [],
  },
  {
    id: 'd3',
    name: 'Ministerial_Note_Q2_AR_EN.docx',
    type: 'DOCX',
    size: '620 KB',
    uploadedAt: '2026-05-28',
    status: 'ready',
    summary: 'Bilingual ministerial note draft — Q2 performance for HH office.',
    keyInsights: ['Formal register verified', 'FSRA Arabic terminology aligned'],
    focusAreaIds: ['correspondence'],
    clauses: [],
  },
  {
    id: 'd4',
    name: 'MAS_Digital_Assets_CP_Summary.pdf',
    type: 'PDF',
    size: '1.1 MB',
    uploadedAt: '2026-06-02',
    status: 'ready',
    summary: 'MAS consultation on single-currency stablecoins — Policy AI ingestion 02 Jun 2026.',
    keyInsights: ['Consultation closes Friday', 'Activity-based DPT rules', 'Retail restrictions tighter than ADGM'],
    focusAreaIds: ['regulatory', 'strategic-intelligence'],
    clauses: [],
  },
  {
    id: 'd5',
    name: 'D33_Strategic_Alignment_2024-26.xlsx',
    type: 'XLSX',
    size: '890 KB',
    uploadedAt: '2026-05-20',
    status: 'ready',
    summary: 'Knowledge Graph temporal view of 2024 ADGM strategic decisions vs D33 KPIs.',
    keyInsights: ['Alignment score 82/100', 'Digital assets milestone Q2 2026', 'Italy engagement complete'],
    focusAreaIds: ['knowledge', 'strategic-intelligence'],
    clauses: [],
  },
];

const SEED_MEETINGS: Meeting[] = [
  {
    id: 'mtg1',
    title: 'Singapore MAS delegation',
    time: '2026-06-03T15:00:00',
    attendees: 'MAS regulatory & market development leads',
    location: 'ADGM Auditorium, Al Maryah',
    prepStatus: 'ready',
  },
  {
    id: 'mtg2',
    title: 'Mubadala leadership — follow-up',
    time: '2026-06-02T15:00:00',
    attendees: 'Khaldoon Al Mubarak, Mubadala CEO',
    location: 'Al Maryah Island',
    prepStatus: 'ready',
  },
  {
    id: 'mtg3',
    title: 'Board risk committee — data policy',
    time: '2026-06-05T10:00:00',
    attendees: 'Board risk committee',
    location: 'Board room',
    prepStatus: 'pending',
  },
];

const SEED_ACTIONS: ActionItem[] = [
  {
    id: 'a1',
    title: 'Share digital assets policy update with Mubadala',
    owner: 'Rajiv Sehgal',
    due: '2026-05-31',
    status: 'overdue',
    departmentId: 'strategy',
  },
  {
    id: 'a2',
    title: 'Approve retention packages — 2 Strategy roles',
    owner: 'Rajiv Sehgal',
    due: '2026-06-06',
    status: 'open',
    departmentId: 'hr',
  },
  {
    id: 'a3',
    title: 'MAS policy comparison note post-consultation',
    owner: 'Policy AI → Rajiv',
    due: '2026-06-12',
    status: 'open',
    departmentId: 'policy',
  },
  {
    id: 'a4',
    title: 'Review Arabic ministerial note — HH office',
    owner: 'Rajiv Sehgal',
    due: '2026-06-04',
    status: 'open',
  },
];

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    title: '3pm brief — Mubadala leadership',
    category: 'Meetings',
    updatedAt: '2026-06-02T09:30:00',
    pinned: true,
    preview: 'Brief me on my 3pm meeting with Mubadala',
    messages: [],
  },
  {
    id: 'c2',
    title: 'ADGM vs MAS — digital assets',
    category: 'Regulatory',
    updatedAt: '2026-06-02T08:15:00',
    pinned: false,
    preview: "Compare ADGM's digital assets framework against Singapore MAS",
    messages: [],
  },
];

function countRag(depts: DepartmentPerformance[], rag: RagStatus) {
  return depts.filter((d) => d.rag === rag).length;
}

export function createSeedState(): ExecutiveState {
  const departments = structuredClone(PERFORMANCE_DEPARTMENTS);
  return {
    version: 3,
    lastSync: new Date().toISOString(),
    metrics: {
      queriesThisWeek: 47,
      documentsInKb: 52,
      briefingsGenerated: 8,
      avgConfidence: 0.91,
      departmentsOnTrack: countRag(departments, 'green'),
      openActions: SEED_ACTIONS.filter((a) => a.status !== 'done').length,
    },
    departments,
    documents: structuredClone(SEED_DOCUMENTS),
    conversations: structuredClone(SEED_CONVERSATIONS),
    meetings: structuredClone(SEED_MEETINGS),
    actionRegister: structuredClone(SEED_ACTIONS),
    activityWeek: [
      { day: 'Mon', queries: 6, confidence: 0.89 },
      { day: 'Tue', queries: 9, confidence: 0.91 },
      { day: 'Wed', queries: 11, confidence: 0.92 },
      { day: 'Thu', queries: 8, confidence: 0.9 },
      { day: 'Fri', queries: 7, confidence: 0.93 },
      { day: 'Sat', queries: 3, confidence: 0.88 },
      { day: 'Sun', queries: 3, confidence: 0.9 },
    ],
    marketSnapshot: {
      gccEquities: '+0.8%',
      digitalAssetsWoW: '+12%',
      competitorNote: 'DIFC fintech sandbox expansion announced',
      topSector: 'Climate tech (D33 score 88)',
    },
  };
}

export function loadExecutiveState(): ExecutiveState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw) as ExecutiveState;
    if (parsed.version !== 3) return createSeedState();
    return parsed;
  } catch {
    return createSeedState();
  }
}

export function saveExecutiveState(state: ExecutiveState) {
  state.lastSync = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getDepartment(state: ExecutiveState, id: string) {
  return state.departments.find((d) => d.id === id);
}

export function deriveMorningSignals(state: ExecutiveState): MorningSignal[] {
  const hr = getDepartment(state, 'hr');
  const sales = getDepartment(state, 'sales');
  const ops = getDepartment(state, 'ops');
  const m = state.marketSnapshot;
  const overdue = state.actionRegister.filter((a) => a.status === 'overdue').length;

  return [
    {
      id: 'overnight',
      pillar: '01',
      title: 'Overnight intelligence',
      summary: `ADGM & Abu Dhabi priorities · GCC ${m.gccEquities} · ${m.topSector} sector lead.`,
      detail:
        'Daily summary of major developments across ADGM, Abu Dhabi, GCC markets and global financial centres.',
      icon: 'overnight',
      priority: 'normal',
      href: '/chat',
    },
    {
      id: 'market',
      pillar: '02',
      title: 'Market signals',
      summary: `Capital flows: digital assets ${m.digitalAssetsWoW} WoW on ADGM · ${m.topSector} momentum.`,
      detail:
        'Where investors, asset managers, fintech firms and institutions are moving across key global markets.',
      icon: 'market',
      priority: 'medium',
      href: '/chat',
    },
    {
      id: 'competitor',
      pillar: '03',
      title: 'Competitor moves',
      summary: m.competitorNote,
      detail:
        'Singapore, Hong Kong, DIFC, Luxembourg and peer centres — institutions and investment flows.',
      icon: 'competitor',
      priority: 'high',
      href: '/chat',
    },
    {
      id: 'regulatory',
      pillar: '04',
      title: 'Regulatory shifts',
      summary: 'MAS stablecoin consultation · FSRA digital assets framework · IOSCO best practice.',
      detail:
        'Financial regulation, digital assets, fintech, capital markets and international best practices relevant to ADGM.',
      icon: 'regulatory',
      priority: 'high',
      href: '/chat?focus=regulatory',
    },
    {
      id: 'performance-risk',
      pillar: '05',
      title: 'Performance & risk alerts',
      summary: `HR attrition ${hr?.kpis.find((k) => k.label.includes('Attrition'))?.value ?? '—'} · Sales ${sales?.kpis.find((k) => k.label.includes('Revenue'))?.value ?? '—'} · Ops SLA ${ops?.kpis.find((k) => k.label.includes('SLA'))?.value ?? '—'} · ${overdue} overdue actions`,
      detail: hr?.leadershipActions[0] ?? 'Departmental risks, blockers and leadership attention areas.',
      icon: 'performance-risk',
      priority: 'high',
      href: '/performance',
    },
  ];
}

export function getSourcesForQuery(state: ExecutiveState, docIds: string[]): Source[] {
  return docIds
    .map((id, i) => {
      const doc = state.documents.find((d) => d.id === id);
      if (!doc) return null;
      return {
        id: `src-${id}`,
        title: doc.name.replace(/_/g, ' ').replace(/\.\w+$/, ''),
        documentName: doc.name,
        date: doc.uploadedAt,
        confidence: 0.9 + i * 0.02,
        excerpt: doc.summary ?? '',
      };
    })
    .filter(Boolean) as Source[];
}

export interface IntelligentResponse {
  content: string;
  agents: AgentType[];
  confidence: number;
  sourceDocIds: string[];
  followUps: string[];
}

export function buildIntelligentResponse(query: string, state: ExecutiveState): IntelligentResponse {
  const q = query.toLowerCase();
  const hr = getDepartment(state, 'hr')!;
  const sales = getDepartment(state, 'sales')!;
  const ops = getDepartment(state, 'ops')!;
  const attrition = hr.kpis.find((k) => k.label.includes('Attrition'))?.value ?? '16.2% YTD';
  const revenue = sales.kpis.find((k) => k.label.includes('Revenue'))?.value ?? '93% of target';
  const sla = ops.kpis.find((k) => k.label.includes('SLA'))?.value ?? '94.1%';

  if (q.includes('digital asset') && (q.includes('mas') || q.includes('singapore'))) {
    return {
      agents: ['policy', 'strategy'],
      confidence: 0.92,
      sourceDocIds: ['d2', 'd4'],
      followUps: [
        'Draft FSRA alignment note for MAS consultation',
        'Show competitor benchmark — DIFC vs ADGM vs MAS',
        'Add to board digital assets section',
      ],
      content: `## ADGM vs MAS — digital assets

${plainTerms('ADGM is better for large banks and funds; Singapore is ahead on retail crypto rules and stablecoins this week.')}
${metricTable(
  ['What it means', 'Number', 'Signal'],
  [
    ['ADGM rules strength (demo benchmark)', '88/100', `${signalEmoji('good')} Strong`],
    ['MAS rules strength (demo benchmark)', '90/100', `${signalEmoji('watch')} Slightly ahead`],
    ['Sales vs target', revenue, signalEmoji('watch')],
    ['GCC markets today', state.marketSnapshot.gccEquities, signalEmoji('good')],
  ],
)}
**D33 / framework**
${scoreBar(88)}

${metricTable(
  ['Topic', 'ADGM (simple)', 'Singapore (simple)'],
  [
    ['Who it suits', 'Institutions & funds', 'More retail testing'],
    ['Retail crypto', 'Allowed with safeguards', 'Tighter limits'],
    ['Stablecoins', 'Rules being aligned', 'Consultation ends Friday'],
  ],
)}
${actionNow('Complete MAS comparison note by 12 Jun (your action register).')}
${agentTag(['Policy AI', 'Strategy AI'])}`,
    };
  }

  if (q.includes('d33') || (q.includes('2024') && q.includes('strategic'))) {
    return {
      agents: ['strategy', 'cos'],
      confidence: 0.89,
      sourceDocIds: ['d5', 'd1'],
      followUps: [
        'Open performance dashboard — Strategy department',
        'Which milestones are at risk?',
        'Prepare board narrative on D33 score',
      ],
      content: `## 2024 decisions vs D33

${plainTerms('Most 2024 bets are on track; talent retention is the one area that needs attention.')}
**Overall D33 alignment (demo store)**
${scoreBar(82)}

${metricTable(
  ['Initiative', 'Status', 'Signal'],
  [
    ['Digital assets framework', 'On track · Q2 2026', signalEmoji('good')],
    ['Italy financial engagement', 'Done · May 2026', signalEmoji('good')],
    ['Fund reforms (ACCESSADGM)', 'On track · licences +12% YoY', signalEmoji('good')],
    ['Talent pipeline', `At risk · attrition ${attrition}`, signalEmoji('risk')],
  ],
)}
${metricTable(
  ['Org health', 'Number', 'Signal'],
  [
    ['Departments on track', `${state.metrics.departmentsOnTrack} / 9`, signalEmoji('good')],
    ['Open actions', String(state.metrics.openActions), signalEmoji('watch')],
  ],
)}
${agentTag(['Strategy AI', 'Chief of Staff AI'])}`,
    };
  }

  if (q.includes('stakeholder') || (q.includes('profile') && (q.includes('mas') || q.includes('crm')))) {
    const mtg = state.meetings.find((m) => /mas|singapore/i.test(m.title)) ?? state.meetings[0];
    const open = state.actionRegister.filter((a) => a.status !== 'done');
    return {
      agents: ['relationship', 'cos'],
      confidence: 0.91,
      sourceDocIds: ['d2', 'd4'],
      followUps: [
        'Draft talking points for regulatory harmonisation',
        'Log follow-up in action register',
        'Open full CRM record',
      ],
      content: `## Stakeholder — ${mtg.title}

${plainTerms('Warm relationship with Singapore regulators; two follow-ups still open before you meet.')}
${metricTable(
  ['CRM fact', 'Detail', 'Signal'],
  [
    ['Relationship', 'Warm · 6 meetings in 18 months', signalEmoji('good')],
    ['Last touchpoint', 'ADFW 2025', signalEmoji('good')],
    ['ADGM network', '3 partnership leads linked', signalEmoji('good')],
  ],
)}
${metricTable(
  ['They care about', 'Why it matters', ''],
  [
    ['Cross-border digital assets', 'Passporting tokenised funds', '—'],
    ['Green finance rules', 'Align taxonomies', '—'],
  ],
)}
${metricTable(
  ['Open follow-up', 'Due', 'Signal'],
  open.slice(0, 3).map((a) => [
    a.title,
    a.due,
    a.status === 'overdue' ? signalEmoji('risk') : signalEmoji('watch'),
  ]),
)}
${actionNow('Agree a Q3 working-group date and confirm custodian pilot scope with FSRA.')}
${agentTag(['Relationship AI', 'Chief of Staff AI'])}`,
    };
  }

  if (q.includes('brief') && q.includes('meeting') && !q.includes('mubadala')) {
    const mtg = state.meetings.find((m) => m.id === 'mtg1') ?? state.meetings[0];
    return {
      agents: ['cos', 'relationship', 'strategy', 'comms'],
      confidence: 0.94,
      sourceDocIds: ['d2', 'd4'],
      followUps: [
        'Draft talking points for regulatory harmonisation',
        'Show open commitments with MAS',
        'Add to action register',
      ],
      content: `## Pre-meeting — ${mtg.title}

${plainTerms('You are ready for tomorrow’s MAS meeting; one policy note is still due on 12 Jun.')}
${metricTable(
  ['Meeting fact', 'Detail', 'Signal'],
  [
    ['When', 'Tomorrow 15:00 UAE', signalEmoji('good')],
    ['Where', mtg.location, '—'],
    ['Prep', mtg.prepStatus === 'ready' ? 'Ready' : 'In progress', mtg.prepStatus === 'ready' ? signalEmoji('good') : signalEmoji('watch')],
    ['Who', mtg.attendees, '—'],
  ],
)}
${metricTable(
  ['Commitment', 'Due', 'Signal'],
  [
    ['MAS workshop on tokenised products', 'Committed 22 Mar', signalEmoji('good')],
    ['MAS policy comparison note', '12 Jun', signalEmoji('watch')],
  ],
)}
**Market & ops (demo)**
${scoreBar(82)}
| Metric | Value | Signal |
|--------|-------|--------|
| Competitor headline | ${state.marketSnapshot.competitorNote} | ${signalEmoji('watch')} |
| HR attrition | ${attrition} | ${signalEmoji('watch')} |
| Ops SLA | ${sla} | ${signalEmoji('good')} |

**Ask them**
- Fund passporting with UAE?
- Stablecoin consultation timeline?
${agentTag(['Chief of Staff', 'Relationship', 'Strategy', 'Comms'])}`,
    };
  }

  if (q.includes('mubadala') && q.includes('brief')) {
    const mtg = state.meetings.find((m) => m.id === 'mtg2')!;
    const overdue = state.actionRegister.find((a) => a.id === 'a1');
    return {
      agents: ['cos', 'relationship', 'strategy', 'comms'],
      confidence: 0.93,
      sourceDocIds: ['d1', 'd2'],
      followUps: [
        'What did I commit to in our last Mubadala meeting?',
        'Draft talking points on capital flows',
        'Flag action register items',
      ],
      content: `## Pre-meeting — ${mtg.title}

${plainTerms('Important sovereign partner meeting today — share the overdue policy update before new asks.')}
${metricTable(
  ['Meeting', 'Detail', 'Signal'],
  [
    ['Time', '15:00 UAE today', signalEmoji('good')],
    ['With', mtg.attendees, '—'],
    ['Partner size', '~USD 300bn AUM (demo)', signalEmoji('good')],
  ],
)}
${overdue ? actionNow(`Send overdue item: ${overdue.title} (was due ${overdue.due}).`) : `${signalEmoji('good')} No overdue actions.`}
${metricTable(
  ['Talking point', 'Why', ''],
  [
    ['Licences +12% YoY', 'Shows momentum', '—'],
    ['ACCESSADGM reforms', 'Fund pipeline', '—'],
    ['Digital assets policy', 'Sensitive timeline', '—'],
  ],
)}
| Metric | Value | Signal |
|--------|-------|--------|
| Sales vs target | ${revenue} | ${signalEmoji('watch')} |
| Open actions | ${state.metrics.openActions} | ${signalEmoji('watch')} |
${agentTag(['Chief of Staff', 'Relationship', 'Strategy'])}`,
    };
  }

  if (q.includes('investment') || (q.includes('abu dhabi') && q.includes('priorit'))) {
    return {
      agents: ['strategy', 'policy'],
      confidence: 0.9,
      sourceDocIds: ['d5'],
      followUps: [
        'Deep dive climate tech sector',
        'Ministerial narrative draft (Arabic)',
        'Compare vs DIFC positioning',
      ],
      content: `## Abu Dhabi — top opportunities

${plainTerms('Climate tech and tokenised funds are the best bets right now; both fit D33 and ADGM’s strengths.')}
${metricTable(
  ['Sector', 'D33 score (demo)', 'Signal'],
  [
    ['Climate tech', '88/100', signalEmoji('good')],
    ['Tokenised funds / digital assets', '86/100', signalEmoji('good')],
    ['Cross-border payments', '84/100', signalEmoji('good')],
  ],
)}
**Top pick**
${scoreBar(88)}
${state.marketSnapshot.topSector}

| Market signal | Value |
|---------------|-------|
| GCC equities | ${state.marketSnapshot.gccEquities} |
| ADGM digital assets (WoW) | ${state.marketSnapshot.digitalAssetsWoW} |

${actionNow('Prioritise climate GP outreach and fast-track tokenised fund guidance with FSRA.')}
${agentTag(['Strategy AI', 'Policy AI'])}`,
    };
  }

  if ((q.includes('arabic') || q.includes('hh')) && (q.includes('ministerial') || q.includes('q2'))) {
    return {
      agents: ['comms', 'strategy'],
      confidence: 0.91,
      sourceDocIds: ['d3', 'd1'],
      followUps: [
        'Open full bilingual draft in Documents',
        'Adjust paragraph 2 per FSRA terminology',
        'Schedule board review',
      ],
      content: `## Ministerial note — Q2 (draft)

${plainTerms('Strong quarter to report; mention licence growth and flag talent retention briefly.')}
${metricTable(
  ['Metric', 'Value', 'Signal'],
  [
    ['D33 alignment', '82/100', signalEmoji('good')],
    ['Licence growth', '+12% YoY', signalEmoji('good')],
    ['Departments green', `${state.metrics.departmentsOnTrack}/9`, signalEmoji('good')],
    ['HR attrition', attrition, signalEmoji('watch')],
    ['Sales vs target', revenue, signalEmoji('watch')],
  ],
)}
**D33 alignment**
${scoreBar(82)}

### English (short)
Your Excellency, ADGM had a strong Q2: more licences, a healthy FSRA pipeline, and D33 score 82/100. Watch-items: competition from DIFC fintech and staff attrition.

### العربية (مختصر)
معالي الشيخ، أداء قوي للربع الثاني مع نمو التراخيص ومحاذاة D33. يجب متابعة المنافسة التقنية والاحتفاظ بالمواهب.

*Full draft: Ministerial_Note_Q2_AR_EN.docx*
${agentTag(['Communications AI', 'Strategy AI'])}`,
    };
  }

  if (q.includes('performance') || q.includes('hr') || q.includes('attrition')) {
    return {
      agents: ['cos', 'strategy'],
      confidence: 0.9,
      sourceDocIds: ['d1'],
      followUps: ['Open HR department detail', 'Show leadership actions', 'Compare Sales pipeline'],
      content: `## Performance snapshot

${plainTerms('Most teams are performing; HR attrition is the main metric that needs leadership attention.')}
${metricTable(
  ['Department', 'Key metric', 'Signal'],
  [
    ['HR', `Attrition ${attrition}`, hr.rag === 'green' ? signalEmoji('good') : hr.rag === 'red' ? signalEmoji('risk') : signalEmoji('watch')],
    ['Sales', revenue, sales.rag === 'green' ? signalEmoji('good') : sales.rag === 'red' ? signalEmoji('risk') : signalEmoji('watch')],
    ['Operations', `SLA ${sla}`, ops.rag === 'green' ? signalEmoji('good') : ops.rag === 'red' ? signalEmoji('risk') : signalEmoji('watch')],
  ],
)}
| Org view | Value | Signal |
|----------|-------|--------|
| Departments green | ${state.metrics.departmentsOnTrack}/9 | ${signalEmoji('good')} |
| Open actions | ${state.metrics.openActions} | ${signalEmoji('watch')} |

**Next:** Open **/performance** for all 9 departments.
${agentTag(['Chief of Staff AI', 'Strategy AI'])}`,
    };
  }

  const focusId = resolveFocusAreaForQuery(query);
  if (focusId) {
    return buildFocusAreaResponse(focusId, query, state);
  }

  return {
    agents: ['policy', 'strategy', 'cos'],
    confidence: 0.87,
    sourceDocIds: ['d1'],
    followUps: ALL_FOCUS_PROMPTS.slice(0, 3),
    content: `## Personal AI — quick guide

${plainTerms('Ask in plain language; you get short answers with tables and scores, grounded in your demo data.')}
${metricTable(
  ['You can ask about', 'Example', ''],
  [
    ['Markets & competitors', 'Daily briefing or DIFC vs ADGM', '—'],
    ['Meetings', 'Brief me on my 3pm meeting', '—'],
    ['Rules & policy', 'Compare ADGM vs MAS digital assets', '—'],
    ['People & partners', 'Stakeholder profile for MAS', '—'],
    ['Letters & Arabic', 'Draft HH office Q2 note', '—'],
  ],
)}
| Demo store | Value |
|------------|-------|
| Documents indexed | ${state.metrics.documentsInKb} |
| Queries this week | ${state.metrics.queriesThisWeek} |
| Departments green | ${state.metrics.departmentsOnTrack}/9 |

**Follow-up**
- Give me today’s executive briefing
- Brief my next meeting`,
  };
}

export function bumpQueryMetrics(state: ExecutiveState): ExecutiveState {
  const next = { ...state, metrics: { ...state.metrics, queriesThisWeek: state.metrics.queriesThisWeek + 1 } };
  const today = new Date().getDay();
  const idx = today === 0 ? 6 : today - 1;
  const activityWeek = [...state.activityWeek];
  activityWeek[idx] = {
    ...activityWeek[idx],
    queries: activityWeek[idx].queries + 1,
    confidence: Math.min(0.98, activityWeek[idx].confidence + 0.002),
  };
  next.activityWeek = activityWeek;
  next.metrics.avgConfidence =
    activityWeek.reduce((s, d) => s + d.confidence, 0) / activityWeek.length;
  return next;
}

export const DEMO_PROMPTS = ALL_FOCUS_PROMPTS;

export function completeAction(state: ExecutiveState, actionId: string): ExecutiveState {
  const actionRegister = state.actionRegister.map((a) =>
    a.id === actionId ? { ...a, status: 'done' as const } : a,
  );
  return {
    ...state,
    actionRegister,
    metrics: {
      ...state.metrics,
      openActions: actionRegister.filter((a) => a.status !== 'done').length,
    },
  };
}

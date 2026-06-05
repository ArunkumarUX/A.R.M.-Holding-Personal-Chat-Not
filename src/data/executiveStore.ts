/**
 * Unified executive data — single source of truth for all flows.
 * Persisted to localStorage; responses cite live store values.
 */
import {
  buildGroundedRecords,
  deriveGroundingMeta,
  kbHandle,
  type GroundingLevel,
} from '../utils/sourceHandles';
import { enrichSources, panelSources, sourceTypeFromHandle } from '../utils/sourceLinks';
import type {
  AgentType,
  Conversation,
  DepartmentPerformance,
  DocumentFile,
  MorningSignal,
  RagStatus,
  Source,
} from '../types';
import { EXECUTIVE_USER } from '../config/user';
import { PERFORMANCE_DEPARTMENTS } from './v5SpecData';
import { ALL_FOCUS_PROMPTS, resolveFocusAreaForQuery } from './focusAreas';
import { buildFocusAreaResponse } from './focusResponses';
import { AGENT_LABELS, routeAgentsForQuery } from './agents';
import { buildPersonalGreetingResponse } from './personalGreeting';
import { detectChatIntent } from '../utils/chatIntent';
import { FALCON_KB_SOURCES, retrieveFalconExcerpts } from './kb/falconKb';
import type { ExecutiveSnapshotPatch } from '../api/executiveSnapshot';
import type { BloombergArticle } from '../api/executiveSnapshot';
import {
  actionNow,
  agentTag,
  metricTable,
  plainTerms,
  scoreBar,
  signalEmoji,
} from '../utils/executiveAnswerVisuals';

const STORAGE_KEY = 'adgm-executive-state-v4';
const MARKET_ROTATION: ExecutiveState['marketSnapshot'][] = [
  {
    gccEquities: '+0.8%',
    digitalAssetsWoW: '+12%',
    competitorNote: 'DIFC fintech sandbox expansion announced',
    topSector: 'Climate tech (Falcon Economy score 88)',
  },
  {
    gccEquities: '+1.1%',
    digitalAssetsWoW: '+9%',
    competitorNote: 'Riyadh fintech licence batch — 14 new approvals',
    topSector: 'Digital assets (FSRA pipeline strong)',
  },
  {
    gccEquities: '+0.4%',
    digitalAssetsWoW: '+15%',
    competitorNote: 'MAS stablecoin consultation — retail rules tightening',
    topSector: 'Sovereign wealth co-investments',
  },
  {
    gccEquities: '+0.6%',
    digitalAssetsWoW: '+11%',
    competitorNote: 'Qatar Fintech Hub — custody standards update',
    topSector: 'Regulatory technology',
  },
];

function gstNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + (now.getTimezoneOffset() + 240) * 60000);
}

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function meetingIso(day: Date, hour: number, minute = 0): string {
  const y = day.getFullYear();
  const m = day.getMonth();
  const dom = day.getDate();
  return new Date(Date.UTC(y, m, dom, hour - 4, minute, 0)).toISOString();
}

function buildDynamicMeetings(today: Date): Meeting[] {
  return [
    {
      id: 'mtg1',
      title: 'Mubadala leadership — follow-up',
      time: meetingIso(today, 15, 0),
      attendees: 'Khaldoon Al Mubarak, Mubadala CEO',
      location: 'Al Maryah Island',
      prepStatus: 'ready',
    },
    {
      id: 'mtg2',
      title: 'Board risk committee — data policy',
      time: meetingIso(addDays(today, 1), 10, 0),
      attendees: 'Board risk committee',
      location: 'Board room',
      prepStatus: 'pending',
    },
    {
      id: 'mtg3',
      title: 'Singapore MAS delegation',
      time: meetingIso(addDays(today, 2), 15, 0),
      attendees: 'MAS regulatory & market development leads',
      location: 'ADGM Auditorium, Al Maryah',
      prepStatus: 'ready',
    },
  ];
}

function buildDynamicActions(today: Date): ActionItem[] {
  return [
    {
      id: 'a1',
      title: 'Share digital assets policy update with Mubadala',
      owner: 'Rajiv Sehgal',
      due: dateOnly(addDays(today, -1)),
      status: 'overdue',
      departmentId: 'strategy',
    },
    {
      id: 'a2',
      title: 'Approve retention packages — 2 Strategy roles',
      owner: 'Rajiv Sehgal',
      due: dateOnly(addDays(today, 3)),
      status: 'open',
      departmentId: 'hr',
    },
    {
      id: 'a3',
      title: 'MAS policy comparison note post-consultation',
      owner: 'Policy AI → Rajiv',
      due: dateOnly(addDays(today, 9)),
      status: 'open',
      departmentId: 'policy',
    },
    {
      id: 'a4',
      title: 'Review Arabic ministerial note — HH office',
      owner: 'Rajiv Sehgal',
      due: dateOnly(addDays(today, 2)),
      status: 'open',
    },
  ];
}

function applyDocumentDates(docs: DocumentFile[], today: Date): DocumentFile[] {
  const offsets = [0, -2, -4, -1, -11];
  return docs.map((doc, i) => ({
    ...doc,
    uploadedAt: dateOnly(addDays(today, offsets[i] ?? -7)),
  }));
}

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
  version: 4;
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
    asOf?: string;
    bloombergLead?: string;
    gccEquitiesSource?: string;
    gccEquitiesSourceUrl?: string;
    digitalAssetsSource?: string;
    digitalAssetsSourceUrl?: string;
  };
  bloombergArticles?: BloombergArticle[];
  bloombergFetchedAt?: string;
  regulatoryHeadline?: string;
  liveTicker?: { k: string; v: string; c: number }[];
  liveTickerFetchedAt?: string;
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
      'Q2 board materials: FSRA performance, strategic partnerships, Falcon Economy alignment. Three board decisions flagged.',
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
    name: 'Falcon_Economy_Strategic_Alignment_2024-26.xlsx',
    type: 'XLSX',
    size: '890 KB',
    uploadedAt: '2026-05-20',
    status: 'ready',
    summary: 'Knowledge Graph temporal view of 2024 ADGM strategic decisions vs Falcon Economy KPIs.',
    keyInsights: ['Alignment score 82/100', 'Digital assets milestone Q2 2026', 'Italy engagement complete'],
    focusAreaIds: ['knowledge', 'strategic-intelligence'],
    clauses: [],
  },
];

function kbSeedSizeMb(src: { pageEstimate?: number; id: string }): string {
  if (src.id === 'falcon-economy') return '10.7 MB';
  if (src.id === 'falcon-strategy') return '2.3 MB';
  const mb = Math.max(0.2, (src.pageEstimate ?? 12) * 0.08);
  return `${mb.toFixed(1)} MB`;
}

/** Indexed institutional PDFs — Falcon + ADGM Archive (see falconKbChunks.json) */
const FALCON_SEED_DOCUMENTS: DocumentFile[] = FALCON_KB_SOURCES.map((src) => ({
  id: src.docId,
  name: src.pdfName,
  type: 'PDF',
  size: kbSeedSizeMb(src),
  uploadedAt: src.date,
  status: 'ready',
  inKnowledgeBase: true,
  kbCategory: src.category,
  kbDocumentDate: src.date,
  kbCompanyId: src.category === 'strategy' ? 'adio' : 'adgm',
  summary: src.summary.replace(/\s+/g, ' ').slice(0, 500),
  keyInsights: [
    src.title,
    `Knowledge base · ${src.handle} · ${src.chunkCount} indexed sections`,
    src.category === 'policy'
      ? 'ADGM regulations and federal instruments — cite KB handles in answers'
      : 'Abu Dhabi economic strategy — cite KB handles in answers',
  ],
  focusAreaIds: ['knowledge', src.category === 'policy' ? 'regulatory' : 'strategic-intelligence'],
  clauses: [],
}));

function ensureFalconKbDocuments(docs: DocumentFile[]): DocumentFile[] {
  const byId = new Map(docs.map((d) => [d.id, d]));
  for (const seed of FALCON_SEED_DOCUMENTS) {
    if (!byId.has(seed.id)) byId.set(seed.id, seed);
  }
  return Array.from(byId.values());
}

function buildSeedConversations(today: Date): Conversation[] {
  const stamp = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 5, 30, 0),
  ).toISOString();
  return [
    {
      id: 'c1',
      title: '3pm brief — Mubadala leadership',
      category: 'Meetings',
      updatedAt: stamp,
      pinned: true,
      preview: 'Brief me on my 3pm meeting with Mubadala',
      messages: [],
    },
    {
      id: 'c2',
      title: 'ADGM vs MAS — digital assets',
      category: 'Regulatory',
      updatedAt: stamp,
      pinned: false,
      preview: "Compare ADGM's digital assets framework against Singapore MAS",
      messages: [],
    },
  ];
}

function countRag(depts: DepartmentPerformance[], rag: RagStatus) {
  return depts.filter((d) => d.rag === rag).length;
}

export function createSeedState(): ExecutiveState {
  const today = gstNow();
  const departments = structuredClone(PERFORMANCE_DEPARTMENTS);
  const actionRegister = buildDynamicActions(today);
  return {
    version: 4,
    lastSync: new Date().toISOString(),
    metrics: {
      queriesThisWeek: 42 + (today.getDate() % 12),
      documentsInKb: 52,
      briefingsGenerated: 8,
      avgConfidence: 0.91,
      departmentsOnTrack: countRag(departments, 'green'),
      openActions: actionRegister.filter((a) => a.status !== 'done').length,
    },
    departments,
    documents: applyDocumentDates(
      structuredClone([...SEED_DOCUMENTS, ...FALCON_SEED_DOCUMENTS]),
      today,
    ),
    conversations: buildSeedConversations(today),
    meetings: buildDynamicMeetings(today),
    actionRegister,
    activityWeek: [
      { day: 'Mon', queries: 6, confidence: 0.89 },
      { day: 'Tue', queries: 9, confidence: 0.91 },
      { day: 'Wed', queries: 11, confidence: 0.92 },
      { day: 'Thu', queries: 8, confidence: 0.9 },
      { day: 'Fri', queries: 7, confidence: 0.93 },
      { day: 'Sat', queries: 3, confidence: 0.88 },
      { day: 'Sun', queries: 3, confidence: 0.9 },
    ],
    marketSnapshot: MARKET_ROTATION[today.getDay() % MARKET_ROTATION.length],
  };
}

/** Merge server or local refresh patch; keeps chat history by default */
export function applyExecutiveSnapshotPatch(
  state: ExecutiveState,
  patch: ExecutiveSnapshotPatch,
): ExecutiveState {
  const departments = structuredClone(PERFORMANCE_DEPARTMENTS);
  const openActions =
    patch.metrics.openActions ??
    patch.actionRegister.filter((a) => a.status !== 'done').length;

  let documents = state.documents;
  if (patch.documentUploadedAt) {
    documents = state.documents.map((d) => ({
      ...d,
      uploadedAt: patch.documentUploadedAt![d.id] ?? d.uploadedAt,
    }));
  }

  return {
    ...state,
    version: 4,
    lastSync: patch.lastSync,
    meetings: patch.meetings,
    actionRegister: patch.actionRegister,
    marketSnapshot: patch.marketSnapshot,
    bloombergArticles: patch.bloombergArticles ?? state.bloombergArticles,
    bloombergFetchedAt: patch.bloombergFetchedAt ?? state.bloombergFetchedAt,
    regulatoryHeadline: patch.regulatoryHeadline ?? state.regulatoryHeadline,
    liveTicker: patch.liveTicker ?? state.liveTicker,
    liveTickerFetchedAt: patch.liveTickerFetchedAt ?? state.liveTickerFetchedAt,
    documents,
    departments,
    metrics: {
      ...state.metrics,
      ...patch.metrics,
      departmentsOnTrack: countRag(departments, 'green'),
      openActions,
    },
  };
}

export function refreshExecutiveState(
  previous?: ExecutiveState | null,
  options?: { keepConversations?: boolean },
): ExecutiveState {
  const fresh = createSeedState();
  if (!previous) return fresh;
  return {
    ...fresh,
    conversations:
      options?.keepConversations === false ? fresh.conversations : previous.conversations,
    metrics: {
      ...fresh.metrics,
      briefingsGenerated: previous.metrics.briefingsGenerated,
      queriesThisWeek: Math.max(fresh.metrics.queriesThisWeek, previous.metrics.queriesThisWeek),
    },
  };
}

export function loadExecutiveState(): ExecutiveState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw) as ExecutiveState;
    if (parsed.version !== 4) {
      return refreshExecutiveState(parsed, { keepConversations: true });
    }
    return {
      ...parsed,
      documents: ensureFalconKbDocuments(parsed.documents ?? []),
    };
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
      const docIndex = state.documents.findIndex((d) => d.id === id);
      return {
        id: `src-${id}`,
        handle: kbHandle(id, docIndex >= 0 ? docIndex : i),
        kind: 'internal' as const,
        sourceType: 'knowledge' as const,
        documentId: id,
        title: doc.name.replace(/_/g, ' ').replace(/\.\w+$/, ''),
        documentName: doc.name,
        date: doc.uploadedAt,
        confidence: 0.9 + i * 0.02,
        excerpt: doc.summary ?? '',
      };
    })
    .filter(Boolean) as Source[];
}

/** Resolve UI sources from handles cited in the model answer */
export function getSourcesFromHandles(state: ExecutiveState, handles: string[]): Source[] {
  const records = buildGroundedRecords(state);
  return handles
    .map((handle, i) => {
      const rec = records.find((r) => r.handle === handle);
      if (!rec) return null;
      return {
        id: `src-${handle}`,
        handle,
        kind: rec.kind,
        sourceType: sourceTypeFromHandle(handle),
        title: rec.label,
        documentName: rec.system,
        date: rec.asOf,
        confidence: rec.kind === 'internal' ? 0.92 + i * 0.01 : 0.86,
        excerpt: rec.snippet,
      };
    })
    .filter(Boolean) as Source[];
}

export function resolveAnswerGrounding(
  answerText: string,
  state: ExecutiveState,
  _fallbackDocIds: string[], // kept for API compat — no longer used as fallback
): { grounding?: GroundingLevel; sources: Source[] } {
  const records = buildGroundedRecords(state);
  const meta = deriveGroundingMeta(answerText, records);

  // Only show sources that Claude actually cited via handles in the response text.
  // Never fall back to guessing — that produces fake "adgm.com" chips on unrelated answers.
  if (!meta.citedHandles.length) {
    return { grounding: undefined, sources: [] };
  }

  const fromHandles = getSourcesFromHandles(state, meta.citedHandles);
  const merged = enrichSources(fromHandles, state);
  const visible = panelSources(merged);
  if (!visible.length) {
    return { grounding: undefined, sources: [] };
  }
  return { grounding: meta.level, sources: visible };
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

  if (detectChatIntent(query) === 'greeting') {
    return buildPersonalGreetingResponse(query, state);
  }

  if (detectChatIntent(query) === 'thanks') {
    return {
      agents: ['cos'],
      confidence: 0.95,
      sourceDocIds: [],
      followUps: ['Brief me on my next meeting', 'Show performance snapshot'],
      content: `You're welcome, **${EXECUTIVE_USER.firstName}**. Ask anytime — I'll stay in context for follow-ups.`,
    };
  }

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
    ['ADGM rules strength (benchmark)', '88/100', `${signalEmoji('good')} Strong`],
    ['MAS rules strength (benchmark)', '90/100', `${signalEmoji('watch')} Slightly ahead`],
    ['Sales vs target', revenue, signalEmoji('watch')],
    ['GCC markets today', state.marketSnapshot.gccEquities, signalEmoji('good')],
  ],
)}
**Falcon Economy / framework**
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

  if (q.includes('falcon') || (q.includes('2024') && q.includes('strategic'))) {
    const excerpts = retrieveFalconExcerpts(q, 6);
    if (excerpts.length) {
      const excerptBlock = excerpts
        .map(
          (ex) =>
            `**[${ex.handle}] ${ex.docTitle}**\n${ex.text.slice(0, 520).replace(/\n+/g, ' ').trim()}…`,
        )
        .join('\n\n');
      return {
        agents: ['strategy', 'cos'],
        confidence: 0.94,
        sourceDocIds: ['d6', 'd7'],
        followUps: [
          'Summarise economic clusters from Falcon Economy 2025–2045',
          'Compare Falcon Strategy observations vs current ADGM priorities',
          'Which enablers need FSRA / ADGM alignment first?',
        ],
        content: `## Falcon Economy & Strategy — knowledge base

${plainTerms('Answer grounded in the two approved Falcon PDFs in the knowledge base — not generic scorecards.')}

${excerptBlock}

**Sources (mandatory):** ${excerpts.map((e) => e.handle).join(', ')} · ${FALCON_KB_SOURCES.map((s) => s.pdfName).join(' · ')}
${agentTag(['Strategy AI', 'Chief of Staff AI'])}`,
      };
    }
    return {
      agents: ['strategy', 'cos'],
      confidence: 0.89,
      sourceDocIds: ['d6', 'd7', 'd5'],
      followUps: [
        'Open Falcon Economy Strategy 2025–2045 in Knowledge Base',
        'Which economic clusters are prioritised to 2045?',
        'Prepare board narrative on diversification enablers',
      ],
      content: `## Falcon Economy & Strategy

${plainTerms('Falcon documents are in the knowledge base — ask a specific question (clusters, FDI, non-oil GDP, enablers) for cited excerpts.')}
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
**Market & operations**
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
    ['Partner size', '~USD 300bn AUM', signalEmoji('good')],
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

${plainTerms('Climate tech and tokenised funds are the best bets right now; both fit Falcon Economy and ADGM’s strengths.')}
${metricTable(
  ['Sector', 'Falcon Economy score', 'Signal'],
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
    ['Falcon Economy alignment', '82/100', signalEmoji('good')],
    ['Licence growth', '+12% YoY', signalEmoji('good')],
    ['Departments green', `${state.metrics.departmentsOnTrack}/9`, signalEmoji('good')],
    ['HR attrition', attrition, signalEmoji('watch')],
    ['Sales vs target', revenue, signalEmoji('watch')],
  ],
)}
**Falcon Economy alignment**
${scoreBar(82)}

### English (short)
Your Excellency, ADGM had a strong Q2: more licences, a healthy FSRA pipeline, and Falcon Economy score 82/100. Watch-items: competition from DIFC fintech and staff attrition.

### العربية (مختصر)
معالي الشيخ، أداء قوي للربع الثاني مع نمو التراخيص ومحاذاة الاقتصاد الصقور. يجب متابعة المنافسة التقنية والاحتفاظ بالمواهب.

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

  const agents = routeAgentsForQuery(query, [], true);
  const excerpt = query.trim().length > 140 ? `${query.trim().slice(0, 137)}…` : query.trim();
  const nextMeeting = state.meetings[0];

  return {
    agents,
    confidence: 0.82,
    sourceDocIds: ['d1'],
    followUps: [
      'Compare ADGM vs MAS digital assets',
      nextMeeting ? `Brief me on ${nextMeeting.title}` : 'Brief me on my next meeting',
      'Show department performance snapshot',
    ],
    content: `## Answer to your question

${plainTerms(`You asked: “${excerpt}”. Here is what institutional data supports — scoped to your question, not a generic overview.`)}

${metricTable(
  ['From your data', 'Value', 'Signal'],
  [
    ['Documents in KB', `${state.metrics.documentsInKb}`, signalEmoji('good')],
    ['Open actions', `${state.metrics.openActions}`, signalEmoji('watch')],
    ['Departments green', `${state.metrics.departmentsOnTrack}/9`, signalEmoji('good')],
    ['GCC markets', state.marketSnapshot.gccEquities, signalEmoji('good')],
  ],
)}

**Analysis (${AGENT_LABELS[agents[0]]})**
I don't have a matching briefing template for this exact wording. Name a **meeting**, **regulator**, **stakeholder**, or **document** and I'll answer from calendar, CRM, and knowledge-base sources.

${nextMeeting ? actionNow(`Or ask: “Brief me on ${nextMeeting.title}” for a calendar-grounded answer.`) : ''}
${agentTag(agents.map((a) => AGENT_LABELS[a]))}`,
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

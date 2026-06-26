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
import { buildDailyCatchUpResponse, buildShortGreetingResponse } from './personalGreeting';
import { detectChatIntent } from '../utils/chatIntent';
import { FALCON_KB_SOURCES, retrieveFalconExcerpts } from './kb/falconKb';
import type { ExecutiveSnapshotPatch, BloombergArticle } from '../api/executiveSnapshot';
import type { LiveMarketIntelSnapshot, MarketSnapshotFields, SignalNewsBundle } from '../types/marketIntel';
import {
  actionNow,
  agentTag,
  metricTable,
  plainTerms,
  scoreBar,
  signalEmoji,
} from '../utils/executiveAnswerVisuals';
import { isLegacyLiveTicker } from '../utils/marketTicker';

const STORAGE_KEY = 'arm-executive-state-v3';
const LEGACY_STORAGE_KEYS = ['arm-executive-state-v1', 'arm-executive-state-v2'] as const;

/** Drop stale ADGM-era cache; use in DevTools for a full reset with STORAGE_KEY too. */
export function clearExecutiveStateCache() {
  for (const key of [...LEGACY_STORAGE_KEYS, STORAGE_KEY]) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* private mode / quota */
    }
  }
}

function purgeLegacyExecutiveState() {
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
const MARKET_ROTATION: ExecutiveState['marketSnapshot'][] = [
  {
    gccEquities: '+0.8%',
    digitalAssetsWoW: '+4.2%',
    competitorNote: 'Emaar launches design-led waterfront district — HUNA positioning at stake',
    topSector: 'Off-plan residential (30,000 deals · AED 73.4B in Q1 2026)',
  },
  {
    gccEquities: '+1.1%',
    digitalAssetsWoW: '+3.8%',
    competitorNote: 'Meraas expands curated retail — competitor to DREC Beach Centre',
    topSector: 'Jebel Ali Racecourse — ARM + BIG 5km² masterplan, ground-break 2026',
  },
  {
    gccEquities: '+0.4%',
    digitalAssetsWoW: '+2.9%',
    competitorNote: 'RERA Smart Rental Index 2026 live — Ejari compliance mandatory for all units',
    topSector: 'Coliving demand rising — HIVE occupancy 91%, expansion pipeline active',
  },
  {
    gccEquities: '+0.6%',
    digitalAssetsWoW: '+3.1%',
    competitorNote: 'Dubai May sales -19% vs April — sentiment recovering post US-Iran agreement',
    topSector: 'Cultural & art tourism — We Emerge Stronger open call closes 25 Jul 2026',
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
      title: 'DREC board — Q2 portfolio review',
      time: meetingIso(today, 10, 0),
      attendees: 'DREC leadership, Alain Kallas (CDO)',
      location: 'A.R.M. Holding HQ, Dubai',
      prepStatus: 'ready',
    },
    {
      id: 'mtg2',
      title: 'HUNA waterfront launch working session',
      time: meetingIso(addDays(today, 1), 14, 0),
      attendees: 'HUNA development, Marketing, Design partners',
      location: 'H Residence, Dubai',
      prepStatus: 'pending',
    },
    {
      id: 'mtg3',
      title: 'Art Dubai — We Emerge Stronger commission debrief',
      time: meetingIso(addDays(today, 2), 11, 0),
      attendees: 'Art Dubai curators, A.R.M. Holding cultural team, Raya Wakim (Marketing)',
      location: 'A.R.M. Holding HQ, Dubai',
      prepStatus: 'ready',
    },
    {
      id: 'mtg4',
      title: 'Jebel Ali Racecourse — WSP masterplan milestone review',
      time: meetingIso(addDays(today, 7), 9, 30),
      attendees: 'Alain Kallas (CDO), WSP team, Amol Mankani (Finance)',
      location: 'A.R.M. Holding HQ, Dubai',
      prepStatus: 'pending',
    },
  ];
}

function buildDynamicActions(today: Date): ActionItem[] {
  return [
    {
      id: 'a1',
      title: 'Approve DREC RERA Smart Rental Index compliance plan — Ejari update for 3,200+ units',
      owner: 'H.E. Mohammad Saeed Al Shehhi',
      due: dateOnly(addDays(today, -1)),
      status: 'overdue',
      departmentId: 'legal',
    },
    {
      id: 'a2',
      title: 'Approve retention packages — 2 critical property management roles (attrition at 15.8%)',
      owner: 'H.E. Mohammad Saeed Al Shehhi',
      due: dateOnly(addDays(today, 3)),
      status: 'open',
      departmentId: 'hr',
    },
    {
      id: 'a3',
      title: 'HUNA launch narrative sign-off — competitor waterfront launches accelerating',
      owner: 'Marketing → Mohammad',
      due: dateOnly(addDays(today, 9)),
      status: 'open',
      departmentId: 'marketing',
    },
    {
      id: 'a4',
      title: 'Confirm CEO speaking slot — We Emerge Stronger open call closes 25 Jul 2026',
      owner: 'H.E. Mohammad Saeed Al Shehhi',
      due: dateOnly(addDays(today, 2)),
      status: 'open',
    },
    {
      id: 'a5',
      title: 'Jebel Ali Racecourse — review WSP masterplan milestone schedule with Alain Kallas',
      owner: 'H.E. Mohammad Saeed Al Shehhi',
      due: dateOnly(addDays(today, 7)),
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
  queriesThisWeek: number | null;
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
  marketSnapshot: MarketSnapshotFields;
  signalNews?: SignalNewsBundle;
  liveMarketIntel?: LiveMarketIntelSnapshot;
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
      'Q2 board materials: DREC occupancy, HUNA launch, We Emerge Stronger commission. Three board decisions flagged.',
    keyInsights: [
      'HUNA waterfront launch — board decision required',
      'DREC occupancy 94.2%',
      'Emaar waterfront competitive pressure — proactive HUNA positioning recommended',
    ],
    focusAreaIds: ['meetings', 'knowledge'],
    clauses: [
      {
        title: 'Section 2 — Executive summary',
        text: 'A.R.M. Holding continues to strengthen its Dubai real estate and investment portfolio across DREC, HUNA and HIVE...',
      },
    ],
  },
  {
    id: 'd2',
    name: 'ARM_RERA_Compliance_Framework_2026.pdf',
    type: 'PDF',
    size: '2.8 MB',
    uploadedAt: '2026-05-29',
    status: 'ready',
    summary: 'Group RERA/DLD compliance framework — rental index, escrow, broker licensing across portfolio.',
    keyInsights: ['Rental repricing within 30 days', 'Escrow audited quarterly', 'Filing due in 11 days'],
    focusAreaIds: ['regulatory', 'knowledge'],
    clauses: [],
  },
  {
    id: 'd3',
    name: 'We_Emerge_Stronger_Talking_Points.docx',
    type: 'DOCX',
    size: '620 KB',
    uploadedAt: '2026-05-28',
    status: 'ready',
    summary: 'Bilingual talking points — We Emerge Stronger sculpture commission with Art Dubai.',
    keyInsights: ['Formal register verified', 'Cultural initiative messaging aligned'],
    focusAreaIds: ['correspondence'],
    clauses: [],
  },
  {
    id: 'd4',
    name: 'DREC_Portfolio_Review_Q1_2026.pdf',
    type: 'PDF',
    size: '1.1 MB',
    uploadedAt: '2026-06-02',
    status: 'ready',
    summary: 'DREC Q1 review — 3,200+ units, Palm Spring Village, The Beach Centre.',
    keyInsights: ['Occupancy 94.2%', 'Leasing pipeline AED 124M', 'Beach Centre footfall +11% YoY'],
    focusAreaIds: ['strategic-intelligence', 'knowledge'],
    clauses: [],
  },
  {
    id: 'd5',
    name: 'ARM_D33_Alignment_Tracker_2026.xlsx',
    type: 'XLSX',
    size: '890 KB',
    uploadedAt: '2026-05-20',
    status: 'ready',
    summary: 'Portfolio alignment with Dubai Economic Agenda D33 — mapped to DREC, HUNA, HIVE.',
    keyInsights: ['Alignment score 86/100', 'HUNA launch on track Q3', 'We Emerge Stronger launched'],
    focusAreaIds: ['knowledge', 'strategic-intelligence'],
    clauses: [],
  },
];

function kbSeedSizeMb(src: { pageEstimate?: number; id: string }): string {
  if (src.id === 'arm-group-strategy') return '2.1 MB';
  if (src.id === 'we-emerge-stronger') return '1.4 MB';
  const mb = Math.max(0.2, (src.pageEstimate ?? 12) * 0.08);
  return `${mb.toFixed(1)} MB`;
}

/** Indexed institutional PDFs — A.R.M. Holding corporate KB */
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
  kbCompanyId: src.category === 'strategy' ? 'drec' : 'arm',
  summary: src.summary.replace(/\s+/g, ' ').slice(0, 500),
  keyInsights: [
    src.title,
    `Knowledge base · ${src.handle} · ${src.chunkCount} indexed sections`,
    src.category === 'policy'
      ? 'RERA/DLD compliance — cite KB handles in answers'
      : 'A.R.M. Holding group strategy — cite KB handles in answers',
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
      title: 'DREC board brief — Q2',
      category: 'Meetings',
      updatedAt: stamp,
      pinned: true,
      preview: 'Brief me on my DREC board meeting',
      messages: [],
    },
    {
      id: 'c2',
      title: 'HUNA vs Emaar — design positioning',
      category: 'Intelligence',
      updatedAt: stamp,
      pinned: false,
      preview: "How does HUNA's design-led positioning compare to Emaar?",
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
      queriesThisWeek: 0, // starts at 0; incremented per chat query this session
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
    signalNews: patch.signalNews ?? state.signalNews,
    liveMarketIntel: patch.liveMarketIntel ?? state.liveMarketIntel,
    bloombergArticles: patch.bloombergArticles ?? state.bloombergArticles,
    bloombergFetchedAt: patch.bloombergFetchedAt ?? state.bloombergFetchedAt,
    regulatoryHeadline: patch.regulatoryHeadline ?? state.regulatoryHeadline,
    liveTicker: isLegacyLiveTicker(patch.liveTicker)
      ? undefined
      : (patch.liveTicker ?? (isLegacyLiveTicker(state.liveTicker) ? undefined : state.liveTicker)),
    liveTickerFetchedAt: isLegacyLiveTicker(patch.liveTicker ?? state.liveTicker)
      ? undefined
      : (patch.liveTickerFetchedAt ?? state.liveTickerFetchedAt),
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
      queriesThisWeek: (fresh.metrics.queriesThisWeek ?? previous.metrics.queriesThisWeek),
    },
  };
}

export function loadExecutiveState(): ExecutiveState {
  purgeLegacyExecutiveState();
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
      liveTicker: isLegacyLiveTicker(parsed.liveTicker) ? undefined : parsed.liveTicker,
      liveTickerFetchedAt: isLegacyLiveTicker(parsed.liveTicker) ? undefined : parsed.liveTickerFetchedAt,
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
      summary: `Dubai portfolio priorities · GCC ${m.gccEquities} · ${m.topSector}.`,
      detail:
        'Daily summary of major developments across A.R.M. Holding, DREC, HUNA, HIVE and Dubai real estate markets.',
      icon: 'overnight',
      priority: 'normal',
      href: '/chat',
    },
    {
      id: 'market',
      pillar: '02',
      title: 'Market signals',
      summary: `Dubai RE +4.2% · ${m.topSector} momentum.`,
      detail:
        'Where investors and buyers are moving across Dubai residential, hospitality and coliving segments.',
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
        'Emaar, Meraas, Nakheel and peer Dubai developers — launches, pricing and positioning.',
      icon: 'competitor',
      priority: 'high',
      href: '/chat',
    },
    {
      id: 'regulatory',
      pillar: '04',
      title: 'Regulatory shifts',
      summary: 'RERA rental index update · DLD registration streamlining · Art Dubai partnership.',
      detail:
        'Dubai real estate regulation, hospitality permits and compliance relevant to DREC, HUNA and HIVE.',
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
  // Never fall back to guessing — that produces fake "armholding.ae" chips on unrelated answers.
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
    return buildShortGreetingResponse(query, state);
  }

  if (detectChatIntent(query) === 'catchup') {
    return buildDailyCatchUpResponse(query, state);
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

  if (q.includes('huna') && (q.includes('emaar') || q.includes('compare') || q.includes('design'))) {
    return {
      agents: ['strategy'],
      confidence: 0.92,
      sourceDocIds: ['d9', 'd4'],
      followUps: [
        'Show HUNA waterfront launch timeline',
        'Open DREC portfolio review for context',
        'Draft board narrative on design differentiation',
      ],
      content: `## HUNA vs Emaar — design positioning

${plainTerms('HUNA leads on cultural curation and design; Emaar leads on scale and distribution.')}
${metricTable(
  ['What it means', 'Score', 'Signal'],
  [
    ['HUNA design differentiation', '96/100', `${signalEmoji('good')} Strong`],
    ['Emaar brand & scale', '94/100', `${signalEmoji('good')} Strong`],
    ['DREC occupancy (income base)', '94.2%', signalEmoji('good')],
    ['GCC markets today', state.marketSnapshot.gccEquities, signalEmoji('good')],
  ],
)}
**D33 alignment**
${scoreBar(86)}

${actionNow('Accelerate HUNA waterfront launch narrative before competitor announcement.')}
${agentTag(['Strategy AI'])}`,
    };
  }

  if (q.includes('d33') || q.includes('we emerge') || (q.includes('2025') && q.includes('strategic'))) {
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
        sourceDocIds: ['d6', 'd12'],
        followUps: [
          'Summarise D33 alignment for DREC, HUNA and HIVE',
          'Compare group strategy vs current portfolio priorities',
          'Which initiatives need RERA alignment first?',
        ],
        content: `## A.R.M. Holding portfolio & D33 — knowledge base

${plainTerms('Answer grounded in approved A.R.M. Holding corporate documents in the knowledge base.')}

${excerptBlock}

**Sources (mandatory):** ${excerpts.map((e) => e.handle).join(', ')} · ${FALCON_KB_SOURCES.map((s) => s.pdfName).join(' · ')}
${agentTag(['Strategy AI', 'Chief of Staff AI'])}`,
      };
    }
    return {
      agents: ['strategy', 'cos'],
      confidence: 0.89,
      sourceDocIds: ['d6', 'd12', 'd5'],
      followUps: [
        'Open D33 Alignment Tracker in Knowledge Base',
        'Which portfolio companies lead on D33 priorities?',
        'Prepare board narrative on We Emerge Stronger',
      ],
      content: `## Portfolio strategy & D33

${plainTerms('A.R.M. Holding documents are in the knowledge base — ask about DREC, HUNA, HIVE or We Emerge Stronger for cited excerpts.')}
${agentTag(['Strategy AI', 'Chief of Staff AI'])}`,
    };
  }

  if (q.includes('stakeholder') || (q.includes('profile') && (q.includes('art dubai') || q.includes('crm')))) {
    const mtg = state.meetings.find((m) => /art dubai|we emerge/i.test(m.title)) ?? state.meetings[0];
    const open = state.actionRegister.filter((a) => a.status !== 'done');
    return {
      agents: ['relationship', 'cos'],
      confidence: 0.91,
      sourceDocIds: ['d11', 'd3'],
      followUps: [
        'Draft talking points for We Emerge Stronger',
        'Log follow-up in action register',
        'Open full CRM record',
      ],
      content: `## Stakeholder — ${mtg.title}

${plainTerms('Strong Art Dubai partnership; sculpture commission open call is live until 25 July.')}
${metricTable(
  ['CRM fact', 'Detail', 'Signal'],
  [
    ['Partnership', 'Art Dubai × A.R.M. Holding', signalEmoji('good')],
    ['Commission', 'We Emerge Stronger — open call', signalEmoji('good')],
    ['Location', 'HUNA Sculpture Park, H Residence', signalEmoji('good')],
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
${actionNow('Confirm CEO speaking slot for Art Dubai commission announcement.')}
${agentTag(['Relationship AI', 'Chief of Staff AI'])}`,
    };
  }

  if (q.includes('brief') && q.includes('meeting') && !q.includes('drec')) {
    const mtg = state.meetings.find((m) => m.id === 'mtg1') ?? state.meetings[0];
    return {
      agents: ['cos', 'relationship', 'strategy', 'comms'],
      confidence: 0.94,
      sourceDocIds: ['d8', 'd13'],
      followUps: [
        'Draft talking points for DREC board',
        'Show open RERA commitments',
        'Add to action register',
      ],
      content: `## Pre-meeting — ${mtg.title}

${plainTerms('You are ready for the DREC board; RERA filing still due in 11 days.')}
${metricTable(
  ['Meeting fact', 'Detail', 'Signal'],
  [
    ['When', 'Tomorrow 10:00 UAE', signalEmoji('good')],
    ['Where', mtg.location, '—'],
    ['Prep', mtg.prepStatus === 'ready' ? 'Ready' : 'In progress', mtg.prepStatus === 'ready' ? signalEmoji('good') : signalEmoji('watch')],
    ['Who', mtg.attendees, '—'],
  ],
)}
${metricTable(
  ['Agenda item', 'Detail', 'Signal'],
  [
    ['DREC occupancy', '94.2%', signalEmoji('good')],
    ['Leasing pipeline', 'AED 124M', signalEmoji('good')],
    ['RERA filing', 'Due in 11 days', signalEmoji('watch')],
  ],
)}
| Metric | Value | Signal |
|--------|-------|--------|
| Competitor headline | ${state.marketSnapshot.competitorNote} | ${signalEmoji('watch')} |
| HR attrition | ${attrition} | ${signalEmoji('watch')} |
| Ops SLA | ${sla} | ${signalEmoji('good')} |
${agentTag(['Chief of Staff', 'Relationship', 'Strategy', 'Comms'])}`,
    };
  }

  if (q.includes('drec') && q.includes('brief')) {
    const mtg = state.meetings.find((m) => m.id === 'mtg1')!;
    const overdue = state.actionRegister.find((a) => a.id === 'a1');
    return {
      agents: ['cos', 'relationship', 'strategy', 'comms'],
      confidence: 0.93,
      sourceDocIds: ['d1', 'd8'],
      followUps: [
        'What did we commit to at the last DREC board?',
        'Draft talking points on occupancy and leasing',
        'Flag action register items',
      ],
      content: `## Pre-meeting — ${mtg.title}

${plainTerms('DREC board today — clear the overdue RERA repricing approval before new asks.')}
${metricTable(
  ['Meeting', 'Detail', 'Signal'],
  [
    ['Time', '10:00 UAE today', signalEmoji('good')],
    ['With', mtg.attendees, '—'],
    ['Occupancy', '94.2%', signalEmoji('good')],
  ],
)}
${overdue ? actionNow(`Send overdue item: ${overdue.title} (was due ${overdue.due}).`) : `${signalEmoji('good')} No overdue actions.`}
${metricTable(
  ['Talking point', 'Why', ''],
  [
    ['Occupancy 94.2%', 'Income stability', '—'],
    ['Beach Centre footfall +11%', 'Hospitality recovery', '—'],
    ['RERA repricing plan', 'Compliance deadline', '—'],
  ],
)}
| Metric | Value | Signal |
|--------|-------|--------|
| Sales vs target | ${revenue} | ${signalEmoji('watch')} |
| Open actions | ${state.metrics.openActions} | ${signalEmoji('watch')} |
${agentTag(['Chief of Staff', 'Relationship', 'Strategy'])}`,
    };
  }

  if (q.includes('investment') || (q.includes('dubai') && q.includes('priorit'))) {
    return {
      agents: ['strategy', 'policy'],
      confidence: 0.9,
      sourceDocIds: ['d5', 'd8'],
      followUps: [
        'Deep dive HUNA waterfront pre-sales',
        'We Emerge Stronger talking points',
        'Compare vs Emaar positioning',
      ],
      content: `## Dubai real estate — top opportunities

${plainTerms('Design-led residential and hospitality recovery score highest for the A.R.M. Holding portfolio.')}
${metricTable(
  ['Sector', 'D33 score', 'Signal'],
  [
    ['Design-led residential (HUNA)', '90/100', signalEmoji('good')],
    ['Hospitality recovery (DREC)', '88/100', signalEmoji('good')],
    ['Coliving (HIVE)', '84/100', signalEmoji('good')],
    ['Commercial retail (DREC)', '82/100', signalEmoji('good')],
  ],
)}
**Top pick**
${scoreBar(90)}
${state.marketSnapshot.topSector}

| Market signal | Value |
|---------------|-------|
| Dubai RE transactions | +4.2% |
| GCC equities | ${state.marketSnapshot.gccEquities} |

${actionNow('Prioritise HUNA waterfront pre-sales and DREC hospitality asset review.')}
${agentTag(['Strategy AI', 'Policy AI'])}`,
    };
  }

  if ((q.includes('arabic') || q.includes('emerge')) && (q.includes('talking') || q.includes('speech') || q.includes('announce'))) {
    return {
      agents: ['comms', 'strategy'],
      confidence: 0.91,
      sourceDocIds: ['d3', 'd11'],
      followUps: [
        'Open full bilingual draft in Documents',
        'Adjust cultural initiative messaging',
        'Schedule Art Dubai announcement',
      ],
      content: `## We Emerge Stronger — communications draft

${plainTerms('Culture woven into everyday life; permanent sculpture at HUNA Sculpture Park with Art Dubai.')}
${metricTable(
  ['Theme', 'Message', 'Signal'],
  [
    ['Commission', 'Open call 17 Jun – 25 Jul 2026', signalEmoji('good')],
    ['Inspiration', 'نظهر أقوى — resilience & renewal', signalEmoji('good')],
    ['Location', 'HUNA Sculpture Park', signalEmoji('good')],
  ],
)}
### English (short)
Culture is essential to how we build cities and communities. Art should be woven into everyday life.

### العربية (مختصر)
الثقافة أساسية في بناء مدننا ومجتمعاتنا. يجب أن يكون الفن جزءاً من الحياة اليومية.

*Full draft: We_Emerge_Stronger_Talking_Points.docx*
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

  if (agents.includes('explorer')) {
    return {
      agents: ['explorer'],
      confidence: 0.5,
      sourceDocIds: [],
      followUps: [
        'Search online for latest UAE climate policy',
        'Compare HUNA design positioning vs Emaar',
        nextMeeting ? `Brief me on ${nextMeeting.title}` : 'Brief me on my next meeting',
      ],
      content: `**Explorer AI**

The live AI service did not respond for: “${excerpt}”.

When connected, I answer general knowledge questions (climate, markets, geography, current events) in plain language — not the institutional KPI table below.

Please try again. If you see this repeatedly, hard-refresh the page (**Cmd+Shift+R**) to load the latest deployment.`,
    };
  }

  return {
    agents,
    confidence: 0.82,
    sourceDocIds: ['d1'],
    followUps: [
      'Compare HUNA design positioning vs Emaar',
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
  const next = { ...state, metrics: { ...state.metrics, queriesThisWeek: (state.metrics.queriesThisWeek ?? 0) + 1 } };
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

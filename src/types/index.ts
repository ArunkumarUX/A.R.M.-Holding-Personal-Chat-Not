import type { KbCompanyId } from '../config/kbCompanies';

export type AgentType = 'policy' | 'strategy' | 'cos' | 'relationship' | 'comms' | 'explorer';

/** CSO Personal AI — six core focus areas */
export type FocusAreaId =
  | 'strategic-intelligence'
  | 'meetings'
  | 'regulatory'
  | 'correspondence'
  | 'stakeholders'
  | 'knowledge';

export type ResponseStyle = 'concise' | 'detailed' | 'executive';

export type LanguagePref = 'en' | 'ar' | 'bilingual';

export type ThemePref = 'light' | 'system';

export type SourceType = 'knowledge' | 'calendar' | 'action' | 'crm' | 'external';

export interface Source {
  id: string;
  title: string;
  documentName: string;
  date: string;
  confidence: number;
  excerpt: string;
  url?: string;
  /** Stable citation handle, e.g. KB-001, MKT-2026-06-03 */
  handle?: string;
  /** internal = institutional; external = market/regulatory feed */
  kind?: 'internal' | 'external';
  sourceType?: SourceType;
  /** Knowledge-base document id — opens preview on /knowledge */
  documentId?: string;
  /** In-app route or external https URL for primary open action */
  href?: string;
  /** Secondary public website when available (e.g. MAS, ADGM) */
  externalUrl?: string;
  openLabel?: string;
}

export type GroundingLevel = 'full' | 'partial';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agents?: AgentType[];
  confidence?: number;
  sources?: Source[];
  grounding?: GroundingLevel;
  followUps?: string[];
  liked?: boolean | null;
}

export interface Conversation {
  id: string;
  title: string;
  category: string;
  updatedAt: string;
  pinned: boolean;
  preview: string;
  messages: ChatMessage[];
}

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  summary?: string;
  keyInsights?: string[];
  clauses?: { title: string; text: string }[];
  /** CSO core focus areas this document supports */
  focusAreaIds?: FocusAreaId[];
  /** Included in approved knowledge base catalogue */
  inKnowledgeBase?: boolean;
  kbCategory?: string;
  /** User-tagged document date (ISO yyyy-mm-dd) */
  kbDocumentDate?: string;
  /** Company repository — ADGM, ADIO, Company 3, Company 4 */
  kbCompanyId?: KbCompanyId;
}

export interface PromptTemplate {
  id: string;
  category: string;
  title: string;
  description: string;
  prompt: string;
}

export interface WorkflowStep {
  id: string;
  title: string;
  description?: string;
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  icon: string;
  steps: WorkflowStep[];
  estimatedTime: string;
  /** Links workflow to a CSO core focus area */
  focusAreaId?: FocusAreaId;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface Settings {
  name: string;
  email: string;
  title: string;
  language: LanguagePref;
  responseStyle: ResponseStyle;
  retainHistory: boolean;
  shareForImprovement: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: ThemePref;
}

export interface DashboardMetrics {
  queriesThisWeek: number;
  documentsAnalysed: number;
  workflowsCompleted: number;
  avgConfidence: number;
}

export type RagStatus = 'green' | 'amber' | 'red';

export interface DepartmentPerformance {
  id: string;
  name: string;
  shortName: string;
  rag: RagStatus;
  kpis: { label: string; value: string; highlight?: boolean }[];
  achievements: string[];
  concerns: string[];
  risks: string[];
  blockers: string[];
  leadershipActions: string[];
  alert?: string;
  /** Demo Act 04 — HR, Sales, Operations fully scripted */
  demoHighlight?: boolean;
}

/** CSO Daily Intelligence — five pillars (ADGM CSO Personal AI Assistant.pdf §03) */
export type MorningSignalIcon =
  | 'overnight'
  | 'market'
  | 'competitor'
  | 'regulatory'
  | 'performance-risk';

export interface MorningSignal {
  id: string;
  /** 01–05 pillar label from product PDF */
  pillar: '01' | '02' | '03' | '04' | '05';
  title: string;
  summary: string;
  detail: string;
  icon: MorningSignalIcon;
  priority: 'high' | 'medium' | 'normal';
  href?: string;
}

export interface FunctionalModule {
  id: string;
  number: string;
  title: string;
  description: string;
}

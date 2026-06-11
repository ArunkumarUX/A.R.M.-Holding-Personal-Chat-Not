import type { AgentType } from '../types';
import { resolveFocusAreaForQuery } from './focusAreas';
import { FOCUS_AREA_MAP } from './focusAreas';
import { detectChatIntent } from '../utils/chatIntent';

export interface AgentDefinition {
  id: AgentType;
  name: string;
  shortName: string;
  role: string;
  tagline: string;
  color: string;
  colorMuted: string;
  tools: string[];
  focusAreas: string[];
}

/** Five specialist agents (spec §04) */
export const EXECUTIVE_AGENTS: AgentDefinition[] = [
  {
    id: 'cos',
    name: 'Chief of Staff AI',
    shortName: 'CoS',
    role: 'Orchestrator',
    tagline: 'Routes tasks, synthesises outputs, tracks commitments',
    color: '#001C7D',
    colorMuted: '#CCE7FF',
    tools: ['Calendar', 'Action register', 'Briefings'],
    focusAreas: ['Meetings', 'Stakeholders', 'Knowledge'],
  },
  {
    id: 'strategy',
    name: 'Strategy AI',
    shortName: 'Strategy',
    role: 'Market intelligence',
    tagline: 'Falcon Economy, competitors, geopolitical and sector signals',
    color: '#006DCC',
    colorMuted: '#EBF7FB',
    tools: ['Bloomberg feed', 'Falcon Economy scorecard', 'Competitor radar'],
    focusAreas: ['Intelligence', 'Knowledge'],
  },
  {
    id: 'policy',
    name: 'Policy AI',
    shortName: 'Policy',
    role: 'Regulatory',
    tagline: 'FSRA frameworks, MAS/FCA benchmarks, consultation drafts',
    color: '#0088FF',
    colorMuted: '#CCE7FF',
    tools: ['Regulatory monitor', 'Policy KB', 'Impact memos'],
    focusAreas: ['Regulatory', 'Knowledge'],
  },
  {
    id: 'relationship',
    name: 'Relationship AI',
    shortName: 'CRM',
    role: 'Stakeholders',
    tagline: 'CRM, partnerships, pre-meeting stakeholder profiles',
    color: '#157347',
    colorMuted: '#E8F5EE',
    tools: ['Executive CRM', 'Commitment tracker', 'Partnership map'],
    focusAreas: ['Stakeholders', 'Meetings'],
  },
  {
    id: 'comms',
    name: 'Communications AI',
    shortName: 'Comms',
    role: 'Executive voice',
    tagline: 'Arabic/English speeches, ministerial notes, talking points',
    color: '#5B4FCF',
    colorMuted: '#EEECFA',
    tools: ['Voice learning', 'Bilingual drafts', 'Tone review'],
    focusAreas: ['Communications', 'Meetings'],
  },
  {
    id: 'explorer',
    name: 'Explorer AI',
    shortName: 'Web',
    role: 'General knowledge',
    tagline: 'Searches the internet to answer any question outside the CSO scope',
    color: '#D97706',
    colorMuted: '#FEF3C7',
    tools: ['Live web search', 'General knowledge', 'Real-time answers'],
    focusAreas: [],
  },
];

export const AGENT_MAP = Object.fromEntries(EXECUTIVE_AGENTS.map((a) => [a.id, a])) as Record<
  AgentType,
  AgentDefinition
>;

export const AGENT_LABELS: Record<AgentType, string> = {
  policy: 'Policy AI',
  strategy: 'Strategy AI',
  cos: 'Chief of Staff AI',
  relationship: 'Relationship AI',
  comms: 'Communications AI',
  explorer: 'Explorer AI',
};

function uniqueAgents(list: AgentType[]): AgentType[] {
  return [...new Set(list)];
}

/**
 * Returns true when the user explicitly asks to search the internet,
 * or the question has NO specific ADGM/CSO context.
 *
 * KEY RULE: Any question without specific ADGM/CSO/FSRA context → Explorer AI.
 * Generic words like "regulation", "policy", "compliance", "benchmark" alone do NOT
 * indicate a CSO query — they also appear in unrelated general knowledge questions.
 * Only highly specific ADGM/CSO terms route to specialist agents.
 */
function isExplorerQuery(q: string): boolean {
  // Explicit internet/search intent — always Explorer regardless of other keywords
  if (
    /\b(check the internet|search the internet|search online|search the web|look (it|this) up online|find (it|this) online|google|look up|search for|find (on|from) the (web|internet)|what does (google|the internet) say)\b/.test(q)
  ) return true;

  // ADGM/CSO-specific entity names — unique to this assistant's domain
  const hasAdgmEntity =
    /\b(adgm|fsra|falcon economy|falcon strategy|abu dhabi global market|chief strategy|cso\b|board pack|action register|department kpi|market snapshot|mubadala|difc|gcc.?mena|sovereign fund)\b/.test(q);
  if (hasAdgmEntity) return false;

  // Generic regulatory/policy terms only count as CSO context when paired with a specific entity
  const hasCsoRegContext =
    /\b(adgm|fsra|abu dhabi).{0,40}(regulat|policy|polic|compliance|framework|law)\b/.test(q) ||
    /\b(regulat|policy|polic|compliance|framework|law).{0,40}(adgm|fsra|abu dhabi)\b/.test(q);
  if (hasCsoRegContext) return false;

  // Benchmark/comparison only CSO when comparing financial centres or ADGM/FSRA
  const hasCsoBenchmark =
    /\b(benchmark|compare|comparison|versus|\bvs\b).{0,50}(adgm|fsra|financial cent(re|er)|difc|jurisdiction)\b/.test(q) ||
    /\b(adgm|fsra|financial cent(re|er)).{0,50}(benchmark|compare|comparison)\b/.test(q);
  if (hasCsoBenchmark) return false;

  // Digital/virtual assets only CSO when tied to a regulatory/market context
  const hasCsoDigitalAssets =
    /\b(digital asset|virtual asset|tokenisa|stablecoin).{0,40}(regulat|framework|adgm|fsra|uae|gcc|abu dhabi)\b/.test(q) ||
    /\b(adgm|fsra|uae|gcc|abu dhabi).{0,40}(digital asset|virtual asset|tokenisa|stablecoin)\b/.test(q);
  if (hasCsoDigitalAssets) return false;

  // Abu Dhabi + financial sector context → CSO (but not Abu Dhabi alone)
  const hasAbuDhabiFinance =
    /\babu dhabi\b.{0,60}\b(financial cent(re|er)|economic strategy|market position|capital market|investment attract|financial market|adgm|fsra)\b/.test(q) ||
    /\b(financial cent(re|er)|economic strategy|market position(ing)?)\b.{0,60}\babu dhabi\b/.test(q);
  if (hasAbuDhabiFinance) return false;

  // CSO-task patterns — briefing, meeting prep, board brief
  const hasCsoTask =
    /\b(brief me|board brief|board pack|premeeting|pre.?meeting|meeting prep|daily briefing|executive briefing)\b/.test(q);
  if (hasCsoTask) return false;

  // Everything else → Explorer AI
  return true;
}

/** Orchestrator routing — CSO Agent Prompt Pack §2 */
export function routeAgentsForQuery(
  query: string,
  manualSelection: AgentType[],
  autoRoute: boolean,
): AgentType[] {
  const q = query.toLowerCase();
  const intent = detectChatIntent(query);
  if (intent === 'greeting' || intent === 'catchup' || intent === 'thanks') return ['cos'];

  // Explorer AI takes priority for explicit web searches or general knowledge questions
  if (autoRoute && isExplorerQuery(q)) return ['explorer'];

  const mentions: AgentType[] = [];
  if (q.includes('@policy') || q.includes('policy ai')) mentions.push('policy');
  if (q.includes('@strategy') || q.includes('strategy ai')) mentions.push('strategy');
  if (q.includes('@cos') || q.includes('chief of staff')) mentions.push('cos');
  if (q.includes('@crm') || q.includes('relationship ai')) mentions.push('relationship');
  if (q.includes('@comms') || q.includes('communications ai')) mentions.push('comms');
  if (mentions.length > 0) return uniqueAgents(mentions);

  if (manualSelection.length > 0 && !autoRoute) return manualSelection;

  const focusId = resolveFocusAreaForQuery(query);
  if (focusId) {
    const fromFocus = FOCUS_AREA_MAP[focusId].agents;
    return uniqueAgents(fromFocus.includes('cos') ? fromFocus : (['cos', ...fromFocus] as AgentType[]));
  }

  const routed: AgentType[] = [];

  const wantsComms =
    /\b(draft|rewrite|polish|speech|memo|ministerial|talking points|bilingual|arabic (version|output|draft)|tone refinement|make (this|it) more (formal|concise|board))\b/.test(q);

  const wantsRelationship =
    /\b(stakeholder|relationship|brief me on|mubadala|attendee|organisation|organization|investor|partner|crm)\b/.test(q) ||
    /\b(who is|tell me about)\b/.test(q);

  const wantsPolicy =
    /\b(regulat(e|ed|ion|ions|ory|ors?)?|fsra|policy|policies|consultation|compliance|rulebook|aml|licensing|framework|mas\b|fca|tokenis(ation|e|ed)?|stablecoin|virtual assets?|digital assets?|fintech|fund regulation|banking regulation|custody|licensing regime)\b/.test(q);

  const wantsStrategy =
    /\b(market|competitor|benchmark|capital|sector|investment|financial cent(re|er)|jurisdiction|falcon|abu dhabi|adgm|compare|hong kong|singapore|riyadh|london|dubai|difc|latest in|what should|opportunity|trend|intelligence|positioning|growth|landscape|virtual assets?|digital assets?|crypto|bitcoin|blockchain|tokenis(ation|e|ed)?|sovereign|gcc|mena|emerging market)\b/.test(q);

  const wantsCos =
    /\b(meeting|briefing|board|action|follow-up|follow up|escalat|decision|priority|operating rhythm|today|this week|overdue|commit(ment)?|agenda)\b/.test(q);

  if (wantsComms) routed.push('comms');
  if (wantsRelationship) routed.push('relationship');
  if (wantsPolicy) routed.push('policy');
  if (wantsStrategy) routed.push('strategy');
  if (wantsCos) routed.push('cos');

  if (wantsComms && wantsPolicy) routed.push('policy');
  if (wantsComms && wantsStrategy) routed.push('strategy');
  if (wantsPolicy && wantsStrategy) {
    routed.push('policy', 'strategy');
  }
  if ((wantsCos || wantsRelationship) && !routed.includes('cos')) routed.unshift('cos');
  if (wantsRelationship && !routed.includes('relationship')) routed.push('relationship');

  if (routed.length > 0) {
    return uniqueAgents(routed.includes('cos') ? routed : (['cos', ...routed] as AgentType[]));
  }

  if (manualSelection.length > 0) return manualSelection;

  // No CSO-specific keywords matched — route to Explorer AI for general knowledge
  return ['explorer'];
}

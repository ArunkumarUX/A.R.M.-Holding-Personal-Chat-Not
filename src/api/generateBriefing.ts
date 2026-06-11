import { buildIntelligentResponse } from '../data/executiveStore';
import type { ExecutiveState } from '../data/executiveStore';
import { buildChatContext } from './buildChatContext';
import { checkClaudeAvailable, streamClaudeChat, type ChatStreamContext } from './claudeChat';
import {
  getBriefingConfig,
  getCannedBriefingText,
  type BriefingFormatId,
} from './briefingConfig';
import { CANNED } from '../data/commandCentreData';

const USE_CLAUDE = import.meta.env.VITE_USE_CLAUDE_API !== 'false';

const STAKEHOLDER_CANNED = `## Stakeholder — Singapore MAS

> **In plain terms:** Warm relationship; lock in a Q3 working session and close open follow-ups.

| CRM fact | Detail | Signal |
|----------|--------|--------|
| Relationship | Warm · 6 touchpoints / 18 mo | 🟢 |
| Last meeting | ADFW 2025 | 🟢 |
| ADGM network | 3 partnership leads | 🟢 |

| Follow-up | Status | Signal |
|-----------|--------|--------|
| Working-group date | Open | 🟡 |
| Custodian pilot scope | Open | 🟡 |

🔴 **Do this:** Propose Q3 working session before quarter-end.

*Agents: Relationship · Chief of Staff*`;

export type GenerateBriefingOptions = {
  formatId: string;
  state: ExecutiveState;
  language: 'en' | 'ar';
  onToken?: (chunk: string) => void;
  signal?: AbortSignal;
};

export type GenerateBriefingResult = {
  text: string;
  source: 'claude' | 'intelligent' | 'canned';
  agents: string[];
};

function buildBriefingContext(
  state: ExecutiveState,
  formatId: string,
  language: 'en' | 'ar',
): ChatStreamContext {
  const config = getBriefingConfig(formatId);
  const base = buildChatContext(state, {
    query: config.buildUserMessage(state, language === 'ar'),
    routedAgents: config.agents as import('../types').AgentType[],
  });
  return {
    ...base,
    language,
    briefingFormat: formatId,
    meetings: state.meetings.map((m) => ({
      title: m.title,
      time: m.time,
      attendees: m.attendees,
      location: m.location,
      prepStatus: m.prepStatus,
    })),
    openActions: state.actionRegister
      .filter((a) => a.status !== 'done')
      .map((a) => ({
        title: a.title,
        due: a.due,
        status: a.status,
        owner: a.owner,
      })),
    marketSnapshot: state.marketSnapshot,
  };
}

function resolveScenarioText(config: ReturnType<typeof getBriefingConfig>): string {
  const canned = getCannedBriefingText(config);
  if (canned) return canned;
  if (config.id === 'stakeholder') return STAKEHOLDER_CANNED;
  return CANNED['Brief me on my 3pm meeting tomorrow.'];
}

export async function generateBriefing({
  formatId,
  state,
  language,
  onToken,
  signal,
}: GenerateBriefingOptions): Promise<GenerateBriefingResult> {
  const config = getBriefingConfig(formatId);
  const ar = language === 'ar';
  const message = config.buildUserMessage(state, ar);
  const agents = config.agents;

  if (USE_CLAUDE) {
    try {
      const live = await checkClaudeAvailable();
      if (live) {
        let streamed = '';
        await streamClaudeChat({
          message,
          language,
          history: [],
          context: buildBriefingContext(state, formatId, language),
          signal,
          onToken: (chunk) => {
            streamed += chunk;
            onToken?.(chunk);
          },
        });
        if (streamed.trim()) {
          return { text: streamed, source: 'claude', agents };
        }
      }
    } catch (err) {
      console.warn('[briefing] Claude failed, using scenario fallback', err);
    }
  }

  const intel = buildIntelligentResponse(config.fallbackQuery, state);
  const fromIntel = intel.content?.trim();
  if (fromIntel && !fromIntel.startsWith('**Personal AI for')) {
    onToken?.(fromIntel);
    return {
      text: fromIntel,
      source: 'intelligent',
      agents: intel.agents.length ? intel.agents : agents,
    };
  }

  const canned = resolveScenarioText(config);
  onToken?.(canned);
  return { text: canned, source: 'canned', agents };
}

export function isBriefingFormatId(id: string): id is BriefingFormatId {
  return id in { premeeting: 1, boardpack: 1, stakeholder: 1, policy: 1, opportunity: 1, ministerial: 1 };
}

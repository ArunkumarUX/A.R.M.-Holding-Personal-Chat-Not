import type { ExecutiveState } from '../data/executiveStore';
import { resolveChatSources } from '../data/executiveStore';
import type { ChatMessage, GroundingLevel, OfflineNoticeKind, Source } from '../types';
import { stripOfflineFallbackBanner } from './claudeErrors';
import { stripAnswerSourceFooter } from './sourceHandles';

export type UiChatMsg =
  | { id: number; role: 'user'; text: string }
  | {
      id: number;
      role: 'ai';
      text: string;
      agents?: string[];
      thinking?: boolean;
      activeAgent?: number | null;
      confidence?: number;
      grounding?: GroundingLevel;
      sources?: Source[];
      offlineNotice?: OfflineNoticeKind;
    };

/** Restore sources/grounding for saved threads (fixes history after older saves omitted metadata). */
export function hydrateAssistantMessage(
  message: ChatMessage,
  state: ExecutiveState,
  userQuery = '',
): { sources: Source[]; grounding?: GroundingLevel } {
  if (message.sources?.length) {
    return {
      sources: message.sources,
      grounding: message.sources.length ? (message.grounding ?? 'partial') : undefined,
    };
  }
  if (!message.content?.trim()) {
    return { sources: [], grounding: undefined };
  }
  const resolved = resolveChatSources(userQuery, message.content, state, []);
  return {
    sources: resolved.sources,
    grounding: resolved.sources.length ? (message.grounding ?? resolved.grounding) : undefined,
  };
}

export function conversationToUiMessages(
  messages: ChatMessage[],
  state: ExecutiveState,
): UiChatMsg[] {
  let lastUserQuery = '';
  return messages.map((m, i) => {
    if (m.role === 'user') {
      lastUserQuery = m.content;
      return { id: i + 1, role: 'user', text: m.content };
    }
    const { sources, grounding } = hydrateAssistantMessage(m, state, lastUserQuery);
    const legacy = stripOfflineFallbackBanner(m.content);
    return {
      id: i + 1,
      role: 'ai',
      text: stripAnswerSourceFooter(legacy.text),
      agents: m.agents,
      confidence: m.confidence,
      grounding,
      sources,
      offlineNotice: m.offlineNotice ?? legacy.notice ?? undefined,
    };
  });
}

export function nextUiMessageId(msgs: UiChatMsg[]): number {
  if (!msgs.length) return 1;
  return Math.max(...msgs.map((m) => m.id)) + 1;
}

export function formatChatRelativeTime(iso: string, ar: boolean): string {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return ar ? 'الآن' : 'Just now';
    if (mins < 60) return ar ? `منذ ${mins} د` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return ar ? `منذ ${hrs} س` : `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return ar ? `منذ ${days} ي` : `${days}d ago`;
    return d.toLocaleDateString(ar ? 'ar-AE' : 'en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

/** Count assistant messages that have (or can resolve) sources */
export function conversationSourceCount(messages: ChatMessage[], state: ExecutiveState): number {
  let n = 0;
  let lastUserQuery = '';
  for (const m of messages) {
    if (m.role === 'user') {
      lastUserQuery = m.content;
      continue;
    }
    const { sources } = hydrateAssistantMessage(m, state, lastUserQuery);
    if (sources.length) n += sources.length;
  }
  return n;
}

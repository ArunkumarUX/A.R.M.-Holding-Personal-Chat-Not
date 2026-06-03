import { EXECUTIVE_USER } from '../config/user';
import type { ExecutiveState } from '../data/executiveStore';
import type { ChatMessage } from '../types';

export function buildChatContext(state: ExecutiveState) {
  return {
    executiveName: EXECUTIVE_USER.fullName,
    organisation: EXECUTIVE_USER.organisation,
    documents: state.documents.map((d) => ({
      id: d.id,
      name: d.name,
      summary: d.summary,
    })),
    metrics: {
      queriesThisWeek: state.metrics.queriesThisWeek,
      documentsInKb: state.metrics.documentsInKb,
      avgConfidence: state.metrics.avgConfidence,
    },
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

export type ChatHistoryItem = { role: 'user' | 'assistant'; content: string };

export function buildChatHistory(
  msgs: { id: number; role: string; text: string }[],
  beforeId?: number,
): ChatHistoryItem[] {
  const slice = beforeId != null ? msgs.filter((m) => m.id < beforeId) : msgs;
  return slice
    .filter((m) => m.text?.trim())
    .map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as ChatHistoryItem['role'],
      content: m.text,
    }))
    .slice(-12);
}

export function buildChatHistoryFromMessages(messages: ChatMessage[]): ChatHistoryItem[] {
  return messages
    .filter((m) => m.content?.trim())
    .map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as ChatHistoryItem['role'],
      content: m.content,
    }))
    .slice(-12);
}

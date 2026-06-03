import type { ChatHistoryItem } from './buildChatContext';

export type ChatStreamContext = {
  executiveName?: string;
  organisation?: string;
  documents?: { id: string; name: string; summary?: string }[];
  metrics?: Record<string, number>;
  departmentHeadlines?: string[];
  language?: 'en' | 'ar';
  briefingFormat?: string;
  meetings?: {
    title: string;
    time: string;
    attendees: string;
    location: string;
    prepStatus: string;
  }[];
  openActions?: { title: string; due: string; status: string; owner: string }[];
  marketSnapshot?: {
    gccEquities: string;
    digitalAssetsWoW: string;
    competitorNote: string;
    topSector: string;
  };
};

export async function checkClaudeAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.claude);
  } catch {
    return false;
  }
}

export async function streamClaudeChat({
  message,
  language,
  history,
  context,
  onToken,
  signal,
}: {
  message: string;
  language: 'en' | 'ar';
  history: ChatHistoryItem[];
  context: ChatStreamContext;
  onToken: (text: string) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, language, history, context }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const detail =
      typeof err.error === 'string'
        ? err.error
        : err.error?.message || err.message || `Chat API error ${res.status}`;
    throw new Error(detail);
  }

  if (!res.body) throw new Error('No response body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    for (const part of parts) {
      for (const line of part.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        try {
          const evt = JSON.parse(line.slice(6));
          if (evt.type === 'token' && evt.text) onToken(evt.text);
          if (evt.type === 'error') throw new Error(evt.message || 'Stream error');
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
  }
}

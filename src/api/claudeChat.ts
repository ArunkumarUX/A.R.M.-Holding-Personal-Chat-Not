import type { ChatHistoryItem } from './buildChatContext';
import {
  chatApiUrl,
  discoverWorkingDevApiPort,
  getCachedDevApiPort,
  healthApiUrl,
  isLocalDevHost,
} from './devApiPort';

export type ChatStreamContext = {
  executiveName?: string;
  organisation?: string;
  lastSync?: string;
  validHandles?: string[];
  documents?: { id: string; handle?: string; name: string; summary?: string; asOf?: string }[];
  metrics?: Record<string, number | null>;
  departmentHeadlines?: string[];
  language?: 'en' | 'ar';
  userQuestion?: string;
  briefingFormat?: string;
  marketHandle?: string;
  meetingsDetailed?: {
    id: string;
    handle?: string;
    crmHandle?: string;
    title: string;
    time: string;
    attendees: string;
    location: string;
    prepStatus: string;
  }[];
  actionsDetailed?: {
    id: string;
    handle?: string;
    title: string;
    due: string;
    status: string;
    owner: string;
  }[];
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
    let port = isLocalDevHost() ? getCachedDevApiPort() : null;
    let res = await fetch(healthApiUrl(port));
    if (res.ok) {
      const data = await res.json();
      if (data.claude) return true;
    }
    if (!isLocalDevHost()) return false;
    port = await discoverWorkingDevApiPort();
    if (port == null) return false;
    res = await fetch(healthApiUrl(port));
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
  const timeoutSignal = AbortSignal.timeout(120_000);
  const combined =
    signal && typeof AbortSignal.any === 'function'
      ? AbortSignal.any([signal, timeoutSignal])
      : timeoutSignal;

  const body = JSON.stringify({ message, language, history, context });
  const fetchOpts = {
    method: 'POST' as const,
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: signal ? combined : timeoutSignal,
  };

  let devPort = isLocalDevHost() ? getCachedDevApiPort() : null;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await consumeChatStream(
        await fetch(chatApiUrl(devPort), fetchOpts),
        onToken,
      );
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message.toLowerCase();
      const staleDevProxy =
        isLocalDevHost() &&
        attempt === 0 &&
        (msg.includes('credit balance') ||
          msg.includes('too low') ||
          msg.includes('invalid x-api-key') ||
          msg.includes('authentication_error'));

      if (!staleDevProxy) throw lastError;

      const discovered = await discoverWorkingDevApiPort();
      if (discovered == null) throw lastError;
      devPort = discovered;
    }
  }

  if (lastError) throw lastError;
}

async function consumeChatStream(
  res: Response,
  onToken: (text: string) => void,
): Promise<void> {
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

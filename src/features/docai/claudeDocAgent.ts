import { buildFallbackDocument } from './fallbackDocumentBuilder';
import {
  buildSystemPrompt,
  buildUserMessage,
  type DocAiUserMessageOptions,
} from './prompts';
import {
  normalizeDocument,
  normalizeSection,
  sanitizeAssistantMessage,
} from './docNormalize';
import type { DocAgentResponse, DocChatMessage, DocSection, GeneratedDocument } from './docTypes';
import { fetchDocAiHealth } from './docAiHealth';

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* continue */
  }
  if (trimmed.startsWith('```')) {
    const lines = trimmed.split('\n');
    const body = lines.slice(1);
    const closeIdx = body.findLastIndex((l) => l.trim() === '```');
    const jsonLines = closeIdx >= 0 ? body.slice(0, closeIdx) : body;
    try {
      return JSON.parse(jsonLines.join('\n').trim());
    } catch {
      /* continue */
    }
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      /* continue */
    }
  }
  throw new Error('Could not parse AI response as JSON');
}

function shortError(reason: string): string {
  if (reason.includes('ECONNREFUSED') || reason.includes('proxy error')) {
    return 'API server not running — run npm run dev (both UI + API)';
  }
  if (reason.includes('ANTHROPIC_API_KEY') || /AWS credentials|Bedrock/i.test(reason)) {
    return reason.slice(0, 180);
  }
  try {
    const parsed = JSON.parse(reason) as { error?: { message?: string } };
    return parsed.error?.message || reason.slice(0, 120);
  } catch {
    return reason.slice(0, 160);
  }
}

export function userRequestsNewDoc(msg: string): boolean {
  return /\b(new document|start over|fresh doc|generate (a )?new|create (a )?new)\b/i.test(msg);
}

export function userRequestsDocContext(query: string): boolean {
  return /context|command\s*centre|ground(?:ed|ing)?|internal|knowledge\s*base|from\s+(our\s+)?chat|use\s+my\s+data|briefing|import company|dashboard|financial/i.test(
    query,
  );
}

function demoResponse(
  userMessage: string,
  currentDoc: GeneratedDocument | null,
  note?: string,
  options?: DocAiUserMessageOptions,
): DocAgentResponse {
  const prefix = note ? `${note} ` : '';
  const forceNew = Boolean(options?.forceNewDoc) || userRequestsNewDoc(userMessage);
  if (!currentDoc || forceNew) {
    const document = buildFallbackDocument(userMessage, {
      executiveBrief: options?.executiveBrief,
      docType: options?.brief?.docType,
      purpose: options?.brief?.purpose,
      audience: options?.brief?.audience,
      style: options?.brief?.style,
    });
    return {
      action: 'create',
      document,
      updatedSections: null,
      message: `${prefix}Built a topic-aware preview (${document.sections.length} sections). Connect the AI service for fully custom documents.`,
    };
  }
  const target = currentDoc.sections[0];
  return {
    action: 'update',
    document: null,
    updatedSections: [
      {
        ...target,
        body: `${target.body}\n\n---\n*Edit requested:* ${userMessage.slice(0, 200)}`,
      },
    ],
    message: `${prefix}Updated preview section. Connect AI for precise edits.`,
  };
}

function sanitizeMessages(
  history: DocChatMessage[],
  userMessage: string,
  currentDoc: GeneratedDocument | null,
  options?: DocAiUserMessageOptions,
) {
  const forceNew = Boolean(options?.forceNewDoc) || userRequestsNewDoc(userMessage);
  const docForTurn = forceNew ? null : currentDoc;
  const trimmedHistory = docForTurn ? history.slice(-8) : history;
  const out: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const m of trimmedHistory) {
    if (m.role === 'system') continue;
    const last = out[out.length - 1];
    if (last?.role === m.role) {
      last.content = `${last.content}\n\n${m.content}`;
      continue;
    }
    out.push({ role: m.role, content: m.content });
  }
  const userContent = buildUserMessage(userMessage, docForTurn, options);
  const last = out[out.length - 1];
  if (last?.role === 'user') {
    last.content = userContent;
  } else {
    out.push({ role: 'user', content: userContent });
  }
  return out;
}

function parseAgentResponse(raw: string): DocAgentResponse {
  const parsed = extractJson(raw) as DocAgentResponse & { sections?: DocSection[] };
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid agent response');
  }

  if (!parsed.document?.sections?.length && Array.isArray(parsed.sections) && parsed.sections.length) {
    parsed.document = {
      id: `doc-${Date.now()}`,
      title: (parsed as { title?: string }).title || 'Document',
      docType: 'custom',
      purpose: '',
      audience: '',
      style: 'dmcc-brand',
      status: 'draft',
      summary: '',
      estimatedPages: Math.ceil(parsed.sections.length / 2),
      sections: parsed.sections,
      sources: [],
      brandCheck: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
  }

  const hasFull = Boolean(parsed.document?.sections?.length);
  const hasPartial = Boolean(parsed.updatedSections?.length);

  if (hasFull) {
    parsed.document = normalizeDocument(parsed.document!);
    if (!hasPartial && parsed.action === 'message') parsed.action = 'create';
  }
  if (hasPartial) {
    parsed.updatedSections = parsed.updatedSections!.map((s, i) => normalizeSection(s, i));
    if (parsed.action === 'message') parsed.action = 'update';
  }

  if (!parsed.message) {
    parsed.message =
      parsed.action === 'create'
        ? 'Document created.'
        : parsed.action === 'update'
          ? 'Document updated.'
          : parsed.action === 'preview'
            ? 'Structure ready — confirm to generate.'
            : 'Done.';
  }
  parsed.message = sanitizeAssistantMessage(parsed.message);
  return parsed;
}

export async function checkDocAiAvailable(): Promise<boolean> {
  const health = await fetchDocAiHealth();
  return health.available;
}

export type RunDocAgentOptions = DocAiUserMessageOptions & {
  signal?: AbortSignal;
};

export async function runDocAgent(
  userMessage: string,
  history: DocChatMessage[],
  currentDoc: GeneratedDocument | null,
  options?: RunDocAgentOptions,
): Promise<DocAgentResponse> {
  const forceNew = Boolean(options?.forceNewDoc) || userRequestsNewDoc(userMessage);
  const agentOptions: DocAiUserMessageOptions = { ...options, forceNewDoc: forceNew };
  const docForTurn = forceNew ? null : currentDoc;
  const messages = sanitizeMessages(history, userMessage, currentDoc, agentOptions);
  const mode = docForTurn ? 'update' : 'create';
  const system = buildSystemPrompt(userMessage);

  let res: Response;
  try {
    res = await fetch('/api/docai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, system, mode }),
      signal: options?.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    const note = shortError(err instanceof Error ? err.message : 'Network error');
    return demoResponse(userMessage, currentDoc, note, agentOptions);
  }

  if (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 504) {
    return demoResponse(userMessage, currentDoc, 'API unavailable.', agentOptions);
  }

  let data: { text?: string; error?: string } = {};
  try {
    data = (await res.json()) as { text?: string; error?: string };
  } catch {
    if (!res.ok) {
      return demoResponse(userMessage, currentDoc, `HTTP ${res.status}.`, agentOptions);
    }
  }

  if (!res.ok) {
    const reason =
      res.status === 422
        ? data.error || 'Document JSON could not be parsed — try a shorter brief.'
        : shortError(data.error || `HTTP ${res.status}`);
    // Do not silently substitute a thin stub document — surface the API error.
    return { action: 'message', document: null, updatedSections: null, message: reason };
  }

  const raw = data.text || '';
  if (!raw.trim()) {
    return {
      action: 'message',
      document: null,
      updatedSections: null,
      message: 'Empty AI response — try Generate Document again.',
    };
  }

  try {
    return parseAgentResponse(raw);
  } catch (err) {
    console.error('[DocAI client] parseAgentResponse failed:', err);
    return {
      action: 'message',
      document: null,
      updatedSections: null,
      message: 'Unexpected JSON error — try a shorter prompt.',
    };
  }
}

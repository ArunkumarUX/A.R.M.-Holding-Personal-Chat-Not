import type { ChatMessage, Deck } from './slideTypes';

export interface SlideAiHistoryEntry {
  id: string;
  title: string;
  slideCount: number;
  previewLine: string;
  updatedAt: string;
  deck: Deck;
  chatHistory: ChatMessage[];
}

const STORAGE_KEY = 'arm-slideai-history-v1';
const MAX_ENTRIES = 24;
const TITLE_MAX = 56;
const PREVIEW_MAX = 96;

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function shortenHistoryText(text: string, max: number): string {
  const clean = collapseWhitespace(text);
  if (!clean) return '';
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

function stripPromptLead(text: string): string {
  return text
    .replace(/^(create|build|make|generate)\s+(a\s+)?(\d+[- ]slide\s+)?/i, '')
    .replace(/^(mckinsey[- ]grade|consulting[- ]grade)[^,.]*[,.]?\s*/i, '')
    .replace(/^for\s+h\.?e\.?\s+[^,.]+[,.]?\s*/i, '')
    .trim();
}

function stripCommandCentrePrefix(text: string): string {
  return text
    .replace(/^use command centre context\s*[—–-]\s*/i, '')
    .replace(/^—\s*/, '')
    .trim();
}

function extractTopicHint(text: string): string {
  const topic = text.match(/\btopic:\s*([^.\n]+)/i)?.[1];
  if (topic) return collapseWhitespace(topic);
  const emDash = text.match(/([A-Z][^.!?\n]{8,}?—\s*[^.\n]{4,})/);
  if (emDash?.[1] && emDash[1].length <= 80) return collapseWhitespace(emDash[1]);
  return '';
}

function isPromptLikeTitle(text: string): boolean {
  const t = text.toLowerCase();
  return (
    !text ||
    /^create\s+a\s/.test(t) ||
    /^use command centre/.test(t) ||
    /^mckinsey board deck/.test(t) ||
    /consulting-grade/.test(t) ||
    /board-ready strategy/.test(t) ||
    /strategy presentation for/.test(t) ||
    /\bfor h\.?e\.?\s+mohammad/.test(t) ||
    /\bceo h\.?e\.?/.test(t) ||
    /^\d+[- ]slide/.test(t) ||
    text.length > 72
  );
}

function pickBestDeckTitle(entry: Pick<SlideAiHistoryEntry, 'title' | 'deck' | 'chatHistory'>): string {
  const deckTitle = stripCommandCentrePrefix(collapseWhitespace(entry.title || entry.deck.title || ''));
  const firstUser = collapseWhitespace(
    entry.chatHistory.find((m) => m.role === 'user')?.content ?? '',
  );
  const slideTitles = entry.deck.slides
    .map((s) => collapseWhitespace(s.title || ''))
    .filter(Boolean);

  const candidates = [
    deckTitle,
    extractTopicHint(firstUser),
    extractTopicHint(deckTitle),
    ...slideTitles.slice(0, 3),
    stripPromptLead(stripCommandCentrePrefix(firstUser.split('\n')[0] ?? firstUser)),
  ].filter(Boolean);

  const best = candidates.find((c) => !isPromptLikeTitle(c));
  return best || candidates[0] || 'Untitled deck';
}

export function formatSlideAiHistoryTitle(entry: Pick<SlideAiHistoryEntry, 'title' | 'deck' | 'chatHistory'>): string {
  return shortenHistoryText(pickBestDeckTitle(entry), TITLE_MAX);
}

export function formatSlideAiHistoryPreview(
  entry: Pick<SlideAiHistoryEntry, 'title' | 'previewLine' | 'deck' | 'chatHistory'>,
  displayTitle: string,
): string {
  const firstUser = collapseWhitespace(
    entry.chatHistory.find((m) => m.role === 'user')?.content ?? '',
  );
  const preview = shortenHistoryText(
    firstUser || collapseWhitespace(entry.previewLine) || entry.deck.title,
    PREVIEW_MAX,
  );

  if (!preview) return '';
  const titleKey = displayTitle.toLowerCase().slice(0, 32);
  const previewKey = preview.toLowerCase().slice(0, 32);
  if (previewKey === titleKey || previewKey.startsWith(titleKey) || titleKey.startsWith(previewKey)) {
    return '';
  }
  return preview;
}

export function formatSlideAiHistoryFullTitle(entry: SlideAiHistoryEntry): string {
  return pickBestDeckTitle(entry);
}

function readAll(): SlideAiHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SlideAiHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: SlideAiHistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* quota / private mode */
  }
}

export function listSlideAiHistory(): SlideAiHistoryEntry[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSlideAiHistoryEntry(id: string): SlideAiHistoryEntry | null {
  return readAll().find((e) => e.id === id) ?? null;
}

export function upsertSlideAiHistory(input: {
  id?: string | null;
  deck: Deck;
  chatHistory: ChatMessage[];
}): SlideAiHistoryEntry {
  const entries = readAll();
  const firstUser = input.chatHistory.find((m) => m.role === 'user')?.content?.trim() ?? '';
  const draft: SlideAiHistoryEntry = {
    id: input.id || `slideai-${Date.now()}`,
    title: input.deck.title || 'Untitled deck',
    slideCount: input.deck.slides.length,
    previewLine: firstUser.slice(0, 120) || input.deck.title,
    updatedAt: new Date().toISOString(),
    deck: input.deck,
    chatHistory: input.chatHistory,
  };
  const displayTitle = formatSlideAiHistoryTitle(draft);
  const next: SlideAiHistoryEntry = {
    ...draft,
    title: displayTitle,
    previewLine:
      formatSlideAiHistoryPreview(draft, displayTitle) ||
      shortenHistoryText(firstUser, PREVIEW_MAX) ||
      displayTitle,
    updatedAt: new Date().toISOString(),
  };
  const without = entries.filter((e) => e.id !== next.id);
  writeAll([next, ...without]);
  return next;
}

export function deleteSlideAiHistory(id: string) {
  writeAll(readAll().filter((e) => e.id !== id));
}

export function formatSlideAiHistoryWhen(iso: string, ar: boolean): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(ar ? 'ar-AE' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso.slice(0, 16);
  }
}

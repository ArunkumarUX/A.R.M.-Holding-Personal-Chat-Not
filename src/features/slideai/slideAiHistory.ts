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
  const previewLine = firstUser.slice(0, 120) || input.deck.title;
  const now = new Date().toISOString();
  const id = input.id || `slideai-${Date.now()}`;
  const next: SlideAiHistoryEntry = {
    id,
    title: input.deck.title || 'Untitled deck',
    slideCount: input.deck.slides.length,
    previewLine,
    updatedAt: now,
    deck: input.deck,
    chatHistory: input.chatHistory,
  };
  const without = entries.filter((e) => e.id !== id);
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

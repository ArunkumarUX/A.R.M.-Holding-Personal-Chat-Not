import { create } from 'zustand';
import {
  cloneDeck,
  firstUpdatedSlideIndex,
  isFullDeckResponse,
  normalizeAgentDeck,
} from './deckNormalize';
import { mergeSlides } from './mergeSlides';
import {
  deleteSlideAiHistory,
  getSlideAiHistoryEntry,
  listSlideAiHistory,
  upsertSlideAiHistory,
  type SlideAiHistoryEntry,
} from './slideAiHistory';
import type { AgentResponse, ChatMessage, Deck } from './slideTypes';

interface SlideStore {
  deck: Deck | null;
  chatHistory: ChatMessage[];
  sessionId: string | null;
  historyRevision: number;
  activeSlideIndex: number;
  deckRevision: number;
  contentKey: string;
  isLoading: boolean;
  loadingStep: number;
  previewFlash: boolean;
  exportBusy: boolean;
  setDeck: (deck: Deck) => void;
  applyAgentResult: (result: AgentResponse) => boolean;
  addMessage: (msg: ChatMessage) => void;
  setActiveSlide: (i: number) => void;
  setLoading: (v: boolean) => void;
  setLoadingStep: (step: number) => void;
  clearPreviewFlash: () => void;
  setExportBusy: (v: boolean) => void;
  refreshHistory: () => void;
  getHistory: () => SlideAiHistoryEntry[];
  persistCurrentSession: () => void;
  restoreSession: (id: string) => boolean;
  removeSession: (id: string) => void;
  reset: () => void;
}

function bumpPreview(
  set: (fn: (s: SlideStore) => Partial<SlideStore>) => void,
  patch: Partial<SlideStore>,
) {
  set((s) => ({
    ...patch,
    deckRevision: s.deckRevision + 1,
    contentKey: `${Date.now()}-${s.deckRevision + 1}`,
    previewFlash: true,
  }));
}

export const useSlideStore = create<SlideStore>((set, get) => ({
  deck: null,
  chatHistory: [],
  sessionId: null,
  historyRevision: 0,
  activeSlideIndex: 0,
  deckRevision: 0,
  contentKey: '0',
  isLoading: false,
  loadingStep: 0,
  previewFlash: false,
  exportBusy: false,

  refreshHistory: () => set((s) => ({ historyRevision: s.historyRevision + 1 })),

  getHistory: () => listSlideAiHistory(),

  persistCurrentSession: () => {
    const { deck, chatHistory, sessionId } = get();
    if (!deck?.slides?.length) return;
    const saved = upsertSlideAiHistory({ id: sessionId, deck, chatHistory });
    set({ sessionId: saved.id, historyRevision: get().historyRevision + 1 });
  },

  restoreSession: (id) => {
    const entry = getSlideAiHistoryEntry(id);
    if (!entry) return false;
    const normalized = normalizeAgentDeck(cloneDeck(entry.deck));
    set({
      deck: normalized,
      chatHistory: entry.chatHistory,
      sessionId: entry.id,
      activeSlideIndex: 0,
      deckRevision: get().deckRevision + 1,
      contentKey: `${Date.now()}-restore`,
      previewFlash: true,
      isLoading: false,
      loadingStep: 0,
    });
    return true;
  },

  removeSession: (id) => {
    deleteSlideAiHistory(id);
    const { sessionId } = get();
    set({
      historyRevision: get().historyRevision + 1,
      ...(sessionId === id
        ? {
            deck: null,
            chatHistory: [],
            sessionId: null,
            activeSlideIndex: 0,
          }
        : {}),
    });
  },

  setDeck: (deck) => {
    const normalized = normalizeAgentDeck(cloneDeck(deck));
    bumpPreview(set, {
      deck: normalized,
      activeSlideIndex: 0,
    });
    get().persistCurrentSession();
  },

  applyAgentResult: (result) => {
    const { deck, activeSlideIndex } = get();
    const hasFull = Boolean(result.deck?.slides?.length);
    const hasPartial = Boolean(result.updatedSlides?.length);

    if (!hasFull && !hasPartial) return false;

    if (hasFull && isFullDeckResponse(result, deck)) {
      const normalized = normalizeAgentDeck(cloneDeck(result.deck!));
      const nextIndex =
        result.action === 'create' || !deck
          ? 0
          : Math.min(activeSlideIndex, normalized.slides.length - 1);
      bumpPreview(set, {
        deck: normalized,
        activeSlideIndex: nextIndex,
      });
      get().persistCurrentSession();
      return true;
    }

    if (hasPartial && deck) {
      const deckTitle = result.deck?.title || deck.title;
      const slides = mergeSlides(deck.slides, result.updatedSlides!, activeSlideIndex, deckTitle);
      const normalized = normalizeAgentDeck(
        cloneDeck({
          ...deck,
          title: result.deck?.title || deck.title,
          theme: { ...deck.theme, ...result.deck?.theme },
          slides,
        }),
      );
      bumpPreview(set, {
        deck: normalized,
        activeSlideIndex: firstUpdatedSlideIndex(normalized.slides, result.updatedSlides!),
      });
      get().persistCurrentSession();
      return true;
    }

    if (hasFull) {
      const normalized = normalizeAgentDeck(cloneDeck(result.deck!));
      bumpPreview(set, {
        deck: normalized,
        activeSlideIndex: Math.min(activeSlideIndex, normalized.slides.length - 1),
      });
      get().persistCurrentSession();
      return true;
    }

    return false;
  },

  addMessage: (msg) => set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
  setActiveSlide: (i) => set({ activeSlideIndex: i }),
  setLoading: (v) => set({ isLoading: v, loadingStep: v ? 0 : 0 }),
  setLoadingStep: (step) => set({ loadingStep: step }),
  clearPreviewFlash: () => set({ previewFlash: false }),
  setExportBusy: (v) => set({ exportBusy: v }),
  reset: () => {
    get().persistCurrentSession();
    set({
      deck: null,
      chatHistory: [],
      sessionId: null,
      activeSlideIndex: 0,
      deckRevision: get().deckRevision + 1,
      contentKey: `${Date.now()}-new`,
      isLoading: false,
      loadingStep: 0,
      previewFlash: false,
      exportBusy: false,
    });
  },
}));

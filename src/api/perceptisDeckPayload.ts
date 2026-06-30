import type { PresentationDeck, PresentationInput } from '../types/presentation';
import type { Deck } from '../features/slideai/slideTypes';

export type PerceptisDeckPayload = PresentationInput & {
  deck?: Pick<Deck | PresentationDeck, 'title' | 'slides' | 'brandCheck'>;
  outline?: unknown;
  clarificationAnswers?: string[];
  coreQuestion?: string;
  decision?: string;
  audience?: string;
  templateName?: string;
  useWebSearch?: boolean;
  useKnowledgeBase?: boolean;
  userId?: string;
};

/** Infer slide count from natural-language brief (e.g. "10-slide deck"). */
export function inferSlideCount(text: string, fallback = 12): number {
  const match = text.match(/(\d+)\s*[- ]?\s*slides?/i);
  if (!match) return fallback;
  return Math.min(15, Math.max(4, Number.parseInt(match[1], 10) || fallback));
}

/** Build Perceptis payload — prompt-first (no intermediate deck generation). */
export function buildPerceptisPromptPayload(
  prompt: string,
  options: {
    slideCount?: number;
    notes?: string;
    tone?: string;
    executiveBrief?: string;
  } = {},
): PerceptisDeckPayload {
  const trimmed = prompt.trim();
  return {
    prompt: trimmed,
    slideCount: options.slideCount ?? inferSlideCount(trimmed),
    tone: options.tone ?? 'executive',
    audience: 'Group CEO',
    templateName: 'apparel-group-executive',
    notes: [options.notes, options.executiveBrief].filter(Boolean).join('\n\n').slice(0, 3000) || undefined,
  };
}

/** Build Perceptis export payload with optional deck for implementation mode. */
export function buildPerceptisExportPayload(
  base: PresentationInput,
  deck: Deck | PresentationDeck | null | undefined,
  extras: Omit<PerceptisDeckPayload, keyof PresentationInput | 'deck'> = {},
): PerceptisDeckPayload {
  return {
    ...base,
    ...extras,
    prompt: deck?.title?.trim() || base.prompt,
    slideCount: deck?.slides?.length || base.slideCount,
    deck: deck
      ? {
          title: deck.title,
          slides: deck.slides,
          brandCheck: 'brandCheck' in deck ? deck.brandCheck : undefined,
        }
      : undefined,
  };
}

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

/** Only these three lengths are offered — fewer slides means a faster Perceptis render. */
export const ALLOWED_SLIDE_COUNTS = [6, 8, 12] as const;

/** Snap a count to the nearest allowed value (ties favour the smaller/faster option). */
export function clampSlideCount(count: number, fallback = 8): number {
  if (!Number.isFinite(count) || count <= 0) return fallback;
  return ALLOWED_SLIDE_COUNTS.reduce((closest, candidate) =>
    Math.abs(candidate - count) < Math.abs(closest - count) ? candidate : closest,
  );
}

/** Infer slide count from natural-language brief (e.g. "10-slide deck"), snapped to 6/8/12. */
export function inferSlideCount(text: string, fallback = 8): number {
  const match = text.match(/(\d+)\s*[- ]?\s*slides?/i);
  if (!match) return fallback;
  return clampSlideCount(Number.parseInt(match[1], 10), fallback);
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
    slideCount: options.slideCount != null ? clampSlideCount(options.slideCount) : inferSlideCount(trimmed),
    tone: options.tone ?? 'executive',
    audience: 'Group CEO',
    // No confirmed Perceptis template exists for Apparel Group yet — omit
    // templateName so the server falls back to PERCEPTIS_TEMPLATE_NAME (if set)
    // or Perceptis's own org default, instead of guessing a name that may not
    // match anything. Brand colors/fonts/footer are spelled out explicitly in
    // the prompt text server-side regardless.
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

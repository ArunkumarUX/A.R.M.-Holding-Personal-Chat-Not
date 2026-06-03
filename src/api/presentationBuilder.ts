export type PresentationSlideType =
  | 'title'
  | 'executive-summary'
  | 'context-problem'
  | 'key-insights'
  | 'strategy-recommendation'
  | 'framework-model'
  | 'data-metrics'
  | 'visual-infographic'
  | 'action-roadmap'
  | 'conclusion-next-steps';

export type OutlineItem = {
  type: PresentationSlideType | string;
  title: string;
  summary: string;
};

export type PresentationOutline = {
  title: string;
  theme: string;
  estimatedSlides: number;
  storyline: string;
  outline: OutlineItem[];
};

export type PresentationSlide = {
  id: string;
  type: string;
  title: string;
  bullets: string[];
  visualHint?: string;
  speakerNotes?: string;
  metrics?: { label: string; value: string }[];
};

export type PresentationDeck = {
  title: string;
  theme: string;
  brandCheck?: string[];
  slides: PresentationSlide[];
};

export type PresentationInput = {
  prompt: string;
  notes?: string;
  link?: string;
  documentText?: string;
  slideCount?: number;
  tone?: string;
};

async function postPresentation(body: Record<string, unknown>) {
  const res = await fetch('/api/presentation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function fetchClarifications(input: PresentationInput) {
  return postPresentation({ action: 'clarify', ...input }) as Promise<{ questions: string[] }>;
}

export function fetchOutline(input: PresentationInput, clarificationAnswers: string[]) {
  return postPresentation({
    action: 'outline',
    ...input,
    clarificationAnswers,
  }) as Promise<PresentationOutline>;
}

export function fetchSlides(input: PresentationInput, outline: PresentationOutline) {
  return postPresentation({
    action: 'slides',
    ...input,
    outline,
  }) as Promise<PresentationDeck>;
}

export function regenerateSlide(
  input: PresentationInput,
  slide: PresentationSlide,
  instruction?: string,
) {
  return postPresentation({
    action: 'regenerate-slide',
    ...input,
    slide,
    instruction,
  }) as Promise<{ slide: PresentationSlide }>;
}

import { demoClarifications, demoOutline, demoSlides } from '../data/presentationDemo';
import type {
  PresentationDeck,
  PresentationInput,
  PresentationOutline,
  PresentationSlide,
} from '../types/presentation';
import type { PerceptisDeckPayload } from './perceptisDeckPayload';
import {
  createDeckJob,
  pollDeckJobUntilReady,
  downloadDeckJob,
} from './perceptisDeck';
import { buildDeckIdempotencyKey } from './idempotencyKey';

export type { PerceptisDeckPayload } from './perceptisDeckPayload';
export type {
  PresentationDeck,
  PresentationInput,
  PresentationOutline,
  PresentationSlide,
  PresentationSlideType,
} from '../types/presentation';

async function postPresentation(body: Record<string, unknown>) {
  const res = await fetch('/api/presentation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data: { error?: string; ok?: boolean } = {};
  try {
    data = await res.json();
  } catch {
    data = { error: res.statusText || 'Invalid response' };
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function checkPresentationApiAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/presentation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ping' }),
    });
    if (res.status === 404) return false;
    const data = await res.json();
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

export function fetchClarifications(input: PresentationInput) {
  return postPresentation({ action: 'clarify', ...input })
    .then((d) => d as { questions: string[] })
    .catch(() => demoClarifications());
}

export function fetchOutline(input: PresentationInput, clarificationAnswers: string[]) {
  return postPresentation({
    action: 'outline',
    ...input,
    clarificationAnswers,
  })
    .then((d) => d as PresentationOutline)
    .catch(() => demoOutline(input.prompt));
}

export function fetchSlides(input: PresentationInput, outline: PresentationOutline) {
  return postPresentation({
    action: 'slides',
    ...input,
    outline,
  })
    .then((d) => d as PresentationDeck)
    .catch(() => demoSlides(outline));
}

export async function regenerateSlide(
  input: PresentationInput,
  slide: PresentationSlide,
  instruction?: string,
) {
  return postPresentation({
    action: 'regenerate-slide',
    ...input,
    slide,
    instruction,
  })
    .then((d) => d as { slide: PresentationSlide })
    .catch(() => ({
      slide: {
        ...slide,
        bullets: slide.bullets?.map((b) => `${b} (refined)`) || ['Refined executive point'],
      },
    }));
}

export type PerceptisDeckResult = {
  ok: boolean;
  provider: 'perceptis';
  jobId: string;
  status: string;
  slideCount: number | null;
  downloadUrl: string | null;
  format: string;
};

export async function fetchPerceptisDeck(input: PerceptisDeckPayload): Promise<PerceptisDeckResult> {
  const data = await postPresentation({
    action: 'perceptis-deck',
    ...input,
  });
  return data as PerceptisDeckResult;
}

export async function downloadPerceptisPptx(
  input: Parameters<typeof fetchPerceptisDeck>[0],
  filename = 'apparel-group-strategy-deck.pptx',
): Promise<void> {
  const displayPrompt = input.prompt || 'Apparel Group presentation';
  const sourceKey = `pb-${displayPrompt.slice(0, 80)}`;
  const idempotencyKey = buildDeckIdempotencyKey(sourceKey, 'deck-generation-pb');

  const created = await createDeckJob(input, { sourceKey, displayPrompt, idempotencyKey });
  const ready = await pollDeckJobUntilReady(created.jobId, {
    onUpdate: (job) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('perceptis-deck-status', { detail: job }));
      }
    },
  });
  downloadDeckJob(ready.jobId, filename);
}

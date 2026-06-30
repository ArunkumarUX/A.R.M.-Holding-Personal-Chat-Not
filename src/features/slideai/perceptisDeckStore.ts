import { create } from 'zustand';
import type { PerceptisDeckPayload } from '../../api/perceptisDeckPayload';
import {
  createDeckJob,
  pollDeckJobUntilReady,
  fetchDeckPptxBlob,
  markDeckPreviewPhase,
  type DeckJobResponse,
} from '../../api/perceptisDeck';
import { buildDeckIdempotencyKey } from '../../api/idempotencyKey';

export type PerceptisDeckPhase =
  | 'idle'
  | 'queued'
  | 'analysing'
  | 'generating'
  | 'downloading'
  | 'stalled'
  | 'ppt_ready'
  | 'preview_loading'
  | 'ready'
  | 'error';

const UX_STEPS = [
  'Analysing your brief',
  'Building the executive storyline',
  'Selecting the best slide structures',
  'Designing the presentation',
  'Finalising the PowerPoint',
];

type PerceptisDeckStore = {
  phase: PerceptisDeckPhase;
  message: string;
  prompt: string;
  title: string;
  jobId: string | null;
  idempotencyKey: string | null;
  blob: ArrayBuffer | null;
  slideCount: number;
  downloadReady: boolean;
  error: string | null;
  elapsedSec: number;
  progressStep: number;
  sourceKey: string | null;
  startFromPrompt: (payload: PerceptisDeckPayload, sourceKey: string, displayPrompt: string) => void;
  retry: () => void;
  cancel: () => void;
  reset: () => void;
};

let abortController: AbortController | null = null;
let lastPayload: PerceptisDeckPayload | null = null;
let lastSourceKey: string | null = null;
let lastDisplayPrompt = '';
let lastIdempotencyKey: string | null = null;
let elapsedTimer: ReturnType<typeof setInterval> | null = null;
let runId = 0;

function clearElapsedTimer() {
  if (elapsedTimer) {
    clearInterval(elapsedTimer);
    elapsedTimer = null;
  }
}

function startElapsedTimer(set: (fn: (s: PerceptisDeckStore) => Partial<PerceptisDeckStore>) => void) {
  clearElapsedTimer();
  const started = Date.now();
  elapsedTimer = setInterval(() => {
    const elapsedSec = Math.floor((Date.now() - started) / 1000);
    const progressStep = Math.min(UX_STEPS.length - 2, Math.floor(elapsedSec / 40));
    set(() => ({ elapsedSec, progressStep }));
  }, 1000);
}

function friendlyJobMessage(status: DeckJobResponse): string {
  if (status.status === 'stalled') {
    return 'Almost there — putting the final polish on your deck';
  }
  if (status.status === 'downloading') {
    return 'Packaging your PowerPoint file…';
  }
  if (status.status === 'generating') {
    return status.message?.includes('structure')
      ? 'Selecting the best slide structures…'
      : 'Designing slides with Apparel Group branding…';
  }
  if (status.status === 'analysing') {
    return 'Reading your brief and shaping the storyline…';
  }
  return status.message || UX_STEPS[0];
}

function mapServerPhase(status: DeckJobResponse): PerceptisDeckPhase {
  if (status.status === 'ready' && status.downloadReady) return 'ppt_ready';
  if (status.status === 'stalled') return 'stalled';
  if (status.status === 'failed') return 'error';
  if (status.status === 'downloading') return 'downloading';
  if (status.status === 'generating') return 'generating';
  if (status.status === 'analysing') return 'analysing';
  return 'queued';
}

function progressStepForStatus(status: DeckJobResponse): number {
  switch (status.status) {
    case 'analysing':
      return 0;
    case 'queued':
      return 1;
    case 'generating':
      return 2;
    case 'stalled':
      return 3;
    case 'downloading':
      return 4;
    case 'ready':
      return UX_STEPS.length - 1;
    default:
      return 1;
  }
}

function buildIdempotencyKey(sourceKey: string) {
  return buildDeckIdempotencyKey(sourceKey);
}

async function loadPreviewBlob(
  jobId: string,
  set: (fn: (s: PerceptisDeckStore) => Partial<PerceptisDeckStore>) => void,
  id: number,
) {
  set(() => ({ phase: 'preview_loading', message: 'Loading slide preview…' }));
  markDeckPreviewPhase(jobId, 'started');

  try {
    const blob = await fetchDeckPptxBlob(jobId);
    if (id !== runId) return;
    markDeckPreviewPhase(jobId, 'completed');
    set(() => ({
      phase: 'ready',
      blob,
      message: 'Your deck is ready',
    }));
  } catch (err) {
    if (id !== runId) return;
    // PPT is still downloadable even if preview fails
    set(() => ({
      phase: 'ppt_ready',
      message: err instanceof Error ? err.message : 'Preview unavailable — download is ready',
    }));
  }
}

const MAX_AUTO_RETRIES = 5;

async function runDeckBuild(
  payload: PerceptisDeckPayload,
  sourceKey: string,
  displayPrompt: string,
  idempotencyKey: string,
  set: (fn: (s: PerceptisDeckStore) => Partial<PerceptisDeckStore>) => void,
  id: number,
  attempt = 0,
) {
  abortController?.abort();
  abortController = new AbortController();
  const signal = abortController.signal;

  const title =
    displayPrompt.split('\n')[0]?.trim().slice(0, 80) ||
    payload.prompt?.trim().slice(0, 80) ||
    'Apparel Group Presentation';

  if (attempt === 0) {
    set(() => ({
      phase: 'queued',
      message: UX_STEPS[0],
      prompt: displayPrompt,
      title,
      jobId: null,
      idempotencyKey,
      blob: null,
      downloadReady: false,
      error: null,
      elapsedSec: 0,
      progressStep: 0,
      sourceKey,
      slideCount: payload.slideCount ?? 12,
    }));
    startElapsedTimer(set);
  }

  try {
    const created = await createDeckJob(payload, {
      sourceKey,
      displayPrompt,
      idempotencyKey,
    });
    if (signal.aborted || id !== runId) return;

    set(() => ({
      jobId: created.jobId,
      slideCount: created.slideCount || payload.slideCount || 12,
      phase: mapServerPhase(created),
      message: created.message || UX_STEPS[0],
      progressStep: progressStepForStatus(created),
    }));

    const ready = await pollDeckJobUntilReady(created.jobId, {
      signal,
      onUpdate: (status) => {
        if (signal.aborted || id !== runId) return;
        set((state) => ({
          jobId: status.jobId,
          phase: mapServerPhase(status),
          message: friendlyJobMessage(status),
          progressStep: Math.max(
            progressStepForStatus(status),
            state.progressStep,
            Math.min(UX_STEPS.length - 2, Math.floor(state.elapsedSec / 40)),
          ),
          slideCount: status.slideCount || payload.slideCount || 12,
          downloadReady: status.downloadReady,
        }));
      },
    });

    if (signal.aborted || id !== runId) return;

    clearElapsedTimer();
    set(() => ({
      phase: 'ppt_ready',
      jobId: ready.jobId,
      downloadReady: true,
      slideCount: ready.slideCount || payload.slideCount || 12,
      message: 'PowerPoint ready — download now',
      progressStep: UX_STEPS.length - 1,
      error: null,
    }));

    void loadPreviewBlob(ready.jobId, set, id);
  } catch (err) {
    if (signal.aborted || id !== runId) return;
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const isFailed = msg.includes('failed') || msg.includes('Failed');

    // A timed-out request or network blip used to permanently stop polling here —
    // the UI kept showing "still creating" with no further updates and no way to
    // recover short of starting over. The idempotency key is stable, so retrying
    // createDeckJob just reattaches to the same (possibly still-running) job
    // instead of starting a duplicate — safe to auto-retry a few times.
    if (!isFailed && attempt < MAX_AUTO_RETRIES) {
      const delayMs = Math.min(2000 * 2 ** attempt, 15_000);
      set(() => ({ message: 'Reconnecting…' }));
      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
      if (signal.aborted || id !== runId) return;
      return runDeckBuild(payload, sourceKey, displayPrompt, idempotencyKey, set, id, attempt + 1);
    }

    clearElapsedTimer();
    set((state) => ({
      phase: isFailed ? 'error' : 'stalled',
      message: isFailed ? 'Generation failed' : 'Still crafting your deck — hang tight',
      error: isFailed ? msg : null,
      jobId: state.jobId,
    }));
  }
}

export const usePerceptisDeckStore = create<PerceptisDeckStore>((set, get) => ({
  phase: 'idle',
  message: '',
  prompt: '',
  title: '',
  jobId: null,
  idempotencyKey: null,
  blob: null,
  slideCount: 0,
  downloadReady: false,
  error: null,
  elapsedSec: 0,
  progressStep: 0,
  sourceKey: null,

  startFromPrompt: (payload, sourceKey, displayPrompt) => {
    lastPayload = payload;
    lastSourceKey = sourceKey;
    lastDisplayPrompt = displayPrompt;
    const idempotencyKey = buildIdempotencyKey(sourceKey);
    lastIdempotencyKey = idempotencyKey;

    if (get().sourceKey === sourceKey && get().phase === 'ready' && get().blob) {
      return;
    }

    runId += 1;
    const id = runId;
    void runDeckBuild(payload, sourceKey, displayPrompt, idempotencyKey, set, id);
  },

  retry: () => {
    if (!lastPayload || !lastSourceKey) return;
    runId += 1;
    const id = runId;
    const idempotencyKey = lastIdempotencyKey || buildIdempotencyKey(lastSourceKey);
    set(() => ({ error: null, blob: null, downloadReady: false }));
    void runDeckBuild(lastPayload, lastSourceKey, lastDisplayPrompt, idempotencyKey, set, id);
  },

  cancel: () => {
    runId += 1;
    abortController?.abort();
    abortController = null;
    clearElapsedTimer();
    set(() => ({
      phase: 'idle',
      message: '',
      jobId: null,
      downloadReady: false,
    }));
  },

  reset: () => {
    runId += 1;
    abortController?.abort();
    abortController = null;
    clearElapsedTimer();
    lastPayload = null;
    lastSourceKey = null;
    lastDisplayPrompt = '';
    lastIdempotencyKey = null;
    set({
      phase: 'idle',
      message: '',
      prompt: '',
      title: '',
      jobId: null,
      idempotencyKey: null,
      blob: null,
      slideCount: 0,
      downloadReady: false,
      error: null,
      elapsedSec: 0,
      progressStep: 0,
      sourceKey: null,
    });
  },
}));

export const UX_PROGRESS_STEPS = UX_STEPS;

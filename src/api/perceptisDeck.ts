import type { PerceptisDeckPayload } from './perceptisDeckPayload';

export type DeckJobPhase =
  | 'queued'
  | 'analysing'
  | 'generating'
  | 'downloading'
  | 'ready'
  | 'failed'
  | 'stalled';

export type DeckJobResponse = {
  ok: boolean;
  jobId: string;
  idempotencyKey?: string | null;
  status: DeckJobPhase;
  message: string;
  slideCount: number;
  title: string;
  downloadReady: boolean;
  previewReady: boolean;
  error?: string | null;
  perceptisJobId?: string | null;
  elapsedSec: number;
  stalled?: boolean;
  timestamps?: Record<string, string | null>;
};

const REQUEST_TIMEOUT_MS = 25_000;

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Cancelled'));
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer);
        reject(new Error('Cancelled'));
      },
      { once: true },
    );
  });
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out — will keep checking job status');
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
  }
}

/** Smart poll interval — 3s → 8s → 15s */
export function deckPollIntervalMs(elapsedMs: number): number {
  if (elapsedMs < 30_000) return 3_000;
  if (elapsedMs < 120_000) return 8_000;
  return 15_000;
}

/** POST /api/decks — returns immediately with jobId (202). */
export async function createDeckJob(
  payload: PerceptisDeckPayload,
  options: { sourceKey: string; displayPrompt: string; idempotencyKey: string },
): Promise<DeckJobResponse> {
  const res = await fetchWithTimeout('/api/decks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payload,
      sourceKey: options.sourceKey,
      displayPrompt: options.displayPrompt,
      idempotencyKey: options.idempotencyKey,
    }),
  });

  let data: DeckJobResponse & { error?: string } = {} as DeckJobResponse & { error?: string };
  try {
    data = await res.json();
  } catch {
    data = { error: res.statusText } as DeckJobResponse & { error?: string };
  }

  if (!res.ok) {
    throw new Error(data.error || `Deck job failed (${res.status})`);
  }
  return data;
}

/** GET /api/decks/:id — lightweight status check (never blocks on generation). */
export async function fetchDeckJobStatus(jobId: string): Promise<DeckJobResponse> {
  const res = await fetchWithTimeout(`/api/decks/${encodeURIComponent(jobId)}`);
  let data: DeckJobResponse & { error?: string } = {} as DeckJobResponse & { error?: string };
  try {
    data = await res.json();
  } catch {
    data = { error: res.statusText } as DeckJobResponse & { error?: string };
  }
  if (!res.ok) {
    throw new Error(data.error || `Status check failed (${res.status})`);
  }
  return data;
}

/** Poll backend job until PPT is ready — does not download preview blob. */
export async function pollDeckJobUntilReady(
  jobId: string,
  options: {
    onUpdate?: (status: DeckJobResponse) => void;
    signal?: AbortSignal;
  } = {},
): Promise<DeckJobResponse> {
  const started = Date.now();

  while (!options.signal?.aborted) {
    let status: DeckJobResponse;
    try {
      status = await fetchDeckJobStatus(jobId);
    } catch (err) {
      // Transient network/timeout — keep polling unless cancelled
      if (options.signal?.aborted) throw new Error('Cancelled');
      await wait(deckPollIntervalMs(Date.now() - started), options.signal);
      continue;
    }

    options.onUpdate?.(status);

    if (status.status === 'ready' && status.downloadReady) {
      return status;
    }
    if (status.status === 'failed') {
      throw new Error(status.error || 'Deck generation failed');
    }

    await wait(deckPollIntervalMs(Date.now() - started), options.signal);
  }

  throw new Error('Cancelled');
}

/** Download PPTX blob for preview (separate from status polling). */
export async function fetchDeckPptxBlob(jobId: string): Promise<ArrayBuffer> {
  const res = await fetchWithTimeout(
    `/api/decks/${encodeURIComponent(jobId)}/download`,
    {},
    60_000,
  );
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg || `Download failed (${res.status})`);
  }
  return res.arrayBuffer();
}

export function downloadDeckJob(jobId: string, filename: string) {
  const a = document.createElement('a');
  a.href = `/api/decks/${encodeURIComponent(jobId)}/download`;
  a.download = filename.endsWith('.pptx') ? filename : `${filename}.pptx`;
  a.click();
}

export function markDeckPreviewPhase(jobId: string, phase: 'started' | 'completed') {
  void fetch(`/api/decks/${encodeURIComponent(jobId)}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phase }),
  }).catch(() => {});
}

export function downloadPerceptisBlob(blob: ArrayBuffer, filename: string) {
  const url = URL.createObjectURL(
    new Blob([blob], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pptx') ? filename : `${filename}.pptx`;
  a.click();
  URL.revokeObjectURL(url);
}

/** @deprecated Use createDeckJob + pollDeckJobUntilReady */
export type PerceptisJobStatus = DeckJobResponse;

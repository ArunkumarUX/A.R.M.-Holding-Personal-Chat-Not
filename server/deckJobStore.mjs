import { randomUUID, createHash } from 'node:crypto';
import { startPerceptisDeckJob, getPerceptisJobStatus } from './perceptisClient.mjs';
import { getPerceptisConfig } from './perceptisClient.mjs';
import { buildCompactPerceptisPrompt } from './apparelGroupPptPrompt.mjs';
import { APPAREL_GROUP_DECK_CONFIG, extractTopic } from './apparelGroupDeckConfig.mjs';
import {
  findJobByIdempotency,
  indexIdempotency,
  loadDeckJob,
  loadDeckPptx,
  saveDeckJob,
  saveDeckPptx,
} from './deckJobPersistence.mjs';

const backgroundJobs = new Set();

function now() {
  return Date.now();
}

function stamp(job, key) {
  job.timestamps[key] = new Date().toISOString();
  job.lastStatusChangeAt = now();
}

function setStatus(job, status, message) {
  if (job.status !== status) {
    job.status = status;
    stamp(job, `status_${status}`);
  }
  if (message) job.message = message;
  job.updatedAt = now();
}

function createTimestamps() {
  return {
    request_received: null,
    prompt_prepared: null,
    perceptis_request_sent: null,
    perceptis_acknowledged: null,
    generation_started: null,
    generation_completed: null,
    ppt_download_started: null,
    ppt_download_completed: null,
    preview_render_started: null,
    preview_render_completed: null,
  };
}

function perceptisPollIntervalMs(elapsedMs) {
  if (elapsedMs < 30_000) return 3_000;
  if (elapsedMs < 120_000) return 8_000;
  return 15_000;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function buildIdempotencyKey(payload, sourceKey) {
  const raw = sourceKey || payload?.prompt || randomUUID();
  const hash = createHash('sha256').update(raw).digest('hex').slice(0, 16);
  const userId = payload?.userId || 'local';
  return `deck-generation-${userId}-${hash}`;
}

export function serializeDeckJob(job) {
  if (!job) return null;
  return {
    ok: true,
    jobId: job.id,
    idempotencyKey: job.idempotencyKey,
    status: job.status,
    message: job.message,
    slideCount: job.slideCount,
    title: job.title,
    downloadReady: job.downloadReady,
    previewReady: Boolean(job.pptxSize || job.pptxBuffer),
    error: job.error,
    perceptisJobId: job.perceptisJobId,
    timestamps: job.timestamps,
    elapsedSec: Math.floor((now() - job.createdAt) / 1000),
    stalled: job.status === 'stalled',
  };
}

async function downloadPptx(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PPT download failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

async function applyPerceptisStatus(job, body) {
  const status = body.status || 'pending';

  if (status === 'processing') {
    stamp(job, 'generation_started');
    setStatus(job, 'generating', 'Selecting the best slide structures');
  } else if (status === 'pending') {
    setStatus(job, 'generating', 'Queued — preparing your deck');
  } else if (status === 'processing') {
    setStatus(job, 'generating', 'Designing the presentation');
  }

  if (now() - job.lastStatusChangeAt >= APPAREL_GROUP_DECK_CONFIG.stalledAfterMs && !job.downloadReady) {
    setStatus(job, 'stalled', 'Crafting the details — your deck is still being built');
  }

  if (status === 'completed') {
    stamp(job, 'generation_completed');
    const download = body.downloads?.[0];
    if (!download?.url) throw new Error('Perceptis completed without a download URL');

    setStatus(job, 'downloading', 'Finalising the PowerPoint');
    stamp(job, 'ppt_download_started');
    job.downloadUrl = download.url;
    job.slideCount = download.slide_count ?? job.slideCount;

    const pptxBuffer = await downloadPptx(download.url);
    await saveDeckPptx(job.id, pptxBuffer);
    job.pptxBuffer = pptxBuffer;
    job.pptxSize = pptxBuffer.length;
    stamp(job, 'ppt_download_completed');
    job.downloadReady = true;
    setStatus(job, 'ready', 'Your deck is ready');
    return true;
  }

  if (status === 'failed') {
    throw new Error(body.error || 'Perceptis deck generation failed');
  }

  return false;
}

async function advanceDeckJob(job, { maxMs } = {}) {
  if (!job?.perceptisJobId || job.downloadReady || job.status === 'failed') return job;

  const budget = maxMs ?? (process.env.VERCEL ? 52_000 : APPAREL_GROUP_DECK_CONFIG.jobTimeoutMs);
  const deadline = now() + budget;
  const pollStarted = now();

  while (now() < deadline) {
    const body = await getPerceptisJobStatus(job.perceptisJobId);
    const done = await applyPerceptisStatus(job, body);
    await saveDeckJob(job);
    if (done || job.status === 'failed') return job;

    if (now() - job.createdAt > APPAREL_GROUP_DECK_CONFIG.jobTimeoutMs) {
      setStatus(job, 'failed', 'Deck generation timed out');
      job.error = 'Deck generation timed out';
      await saveDeckJob(job);
      return job;
    }

    await sleep(perceptisPollIntervalMs(now() - pollStarted));
  }

  if (!job.downloadReady && job.status !== 'failed') {
    setStatus(job, 'stalled', 'Almost there — putting the final polish on your deck');
    await saveDeckJob(job);
  }
  return job;
}

async function runDeckJobBackground(jobId) {
  if (backgroundJobs.has(jobId)) return;
  backgroundJobs.add(jobId);
  try {
    const job = await loadDeckJob(jobId);
    if (!job) return;
    await advanceDeckJob(job, { maxMs: APPAREL_GROUP_DECK_CONFIG.jobTimeoutMs });
  } catch (err) {
    const job = await loadDeckJob(jobId);
    if (job && !job.downloadReady) {
      job.error = err?.message || 'Deck generation failed';
      setStatus(job, 'failed', job.error);
      await saveDeckJob(job);
    }
  } finally {
    backgroundJobs.delete(jobId);
  }
}

export async function createDeckJob(payload, { idempotencyKey, displayPrompt } = {}) {
  if (idempotencyKey) {
    const existing = await findJobByIdempotency(idempotencyKey);
    if (existing && existing.status !== 'failed') return existing;
  }

  const jobId = `deck-${randomUUID()}`;
  const topic = extractTopic(displayPrompt || payload?.prompt);
  const slideCount = payload?.slideCount ?? APPAREL_GROUP_DECK_CONFIG.defaultSlideCount;

  const job = {
    id: jobId,
    idempotencyKey: idempotencyKey || null,
    status: 'queued',
    message: 'Analysing your brief',
    perceptisJobId: null,
    slideCount,
    prompt: displayPrompt || payload?.prompt || '',
    title: topic.slice(0, 80),
    error: null,
    downloadReady: false,
    pptxSize: 0,
    pptxBuffer: null,
    downloadUrl: null,
    payload,
    timestamps: createTimestamps(),
    lastStatusChangeAt: now(),
    createdAt: now(),
    updatedAt: now(),
  };

  stamp(job, 'request_received');
  indexIdempotency(idempotencyKey, jobId);

  setStatus(job, 'analysing', 'Analysing your brief');
  const compactPrompt = buildCompactPerceptisPrompt(payload);
  stamp(job, 'prompt_prepared');

  setStatus(job, 'generating', 'Building the executive storyline');
  stamp(job, 'perceptis_request_sent');

  const { templateName: envTemplate } = getPerceptisConfig();
  const started = await startPerceptisDeckJob(compactPrompt, {
    templateName: payload?.templateName?.trim() || envTemplate || APPAREL_GROUP_DECK_CONFIG.brandTemplateId,
    useWebSearch: Boolean(payload?.useWebSearch),
    useKnowledgeBase: Boolean(payload?.useKnowledgeBase),
    idempotencyKey: idempotencyKey || undefined,
  });

  job.perceptisJobId = started.job_id;
  stamp(job, 'perceptis_acknowledged');
  await saveDeckJob(job);

  if (process.env.VERCEL) {
    return job;
  }

  void runDeckJobBackground(jobId);
  return job;
}

export async function getDeckJob(jobId) {
  const job = await loadDeckJob(jobId);
  if (!job) return null;
  if (!job.downloadReady && job.status !== 'failed') {
    await advanceDeckJob(job, { maxMs: process.env.VERCEL ? 52_000 : 8_000 });
  }
  return job;
}

export async function getDeckJobPptx(jobId) {
  const job = await getDeckJob(jobId);
  if (!job?.downloadReady) return null;
  return loadDeckPptx(jobId);
}

export async function markPreviewRender(jobId, phase) {
  const job = await loadDeckJob(jobId);
  if (!job) return;
  if (phase === 'started') stamp(job, 'preview_render_started');
  if (phase === 'completed') stamp(job, 'preview_render_completed');
  await saveDeckJob(job);
}

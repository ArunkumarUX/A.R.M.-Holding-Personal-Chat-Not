import {
  buildIdempotencyKey,
  createDeckJob,
  getDeckJob,
  getDeckJobPptx,
  serializeDeckJob,
  markPreviewRender,
} from './deckJobStore.mjs';

export async function handleCreateDeckRequest(body, headers = {}) {
  const payload = body?.payload ?? body;
  const displayPrompt = body?.displayPrompt || payload?.prompt || '';
  const sourceKey = body?.sourceKey || displayPrompt;
  const idempotencyKey =
    headers['idempotency-key'] ||
    headers['Idempotency-Key'] ||
    body?.idempotencyKey ||
    buildIdempotencyKey(payload, sourceKey);

  const job = await createDeckJob(payload, { idempotencyKey, displayPrompt });
  return { status: 202, body: serializeDeckJob(job) };
}

export async function handleGetDeckRequest(jobId) {
  const job = await getDeckJob(jobId);
  if (!job) {
    return { status: 404, body: { ok: false, error: 'Job not found' } };
  }
  return { status: 200, body: serializeDeckJob(job) };
}

export async function handleDeckDownloadRequest(jobId) {
  const job = await getDeckJob(jobId);
  if (!job) {
    return { status: 404, body: null, contentType: 'application/json', json: { error: 'Job not found' } };
  }
  if (!job.downloadReady) {
    return {
      status: 409,
      body: null,
      contentType: 'application/json',
      json: { error: 'Deck not ready yet', status: job.status },
    };
  }

  const pptxBuffer = await getDeckJobPptx(jobId);
  if (!pptxBuffer) {
    return {
      status: 409,
      body: null,
      contentType: 'application/json',
      json: { error: 'Deck file not available yet', status: job.status },
    };
  }

  const filename = `${(job.title || 'apparel-group-deck').replace(/[^\w.-]+/g, '-').slice(0, 60)}.pptx`;
  return {
    status: 200,
    body: pptxBuffer,
    contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pptxBuffer.length),
    },
  };
}

export async function handleDeckPreviewTimings(jobId, phase) {
  await markPreviewRender(jobId, phase);
  return { status: 204, body: null };
}

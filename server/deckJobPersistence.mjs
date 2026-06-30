import { put, get, del } from '@vercel/blob';

const memoryJobs = new Map();
const memoryIdempotency = new Map();
const memoryPptx = new Map();

function useBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

function metaPath(jobId) {
  return `deck-jobs/${jobId}.json`;
}

function pptxPath(jobId) {
  return `deck-jobs/${jobId}.pptx`;
}

export async function loadDeckJob(jobId) {
  if (memoryJobs.has(jobId)) return memoryJobs.get(jobId);
  if (!useBlob()) return null;
  try {
    const result = await get(metaPath(jobId), { access: 'private', useCache: false });
    if (!result?.stream) return null;
    const job = JSON.parse(await new Response(result.stream).text());
    memoryJobs.set(jobId, job);
    return job;
  } catch (err) {
    if (err?.name === 'BlobNotFoundError') return null;
    throw err;
  }
}

export async function saveDeckJob(job) {
  memoryJobs.set(job.id, job);
  if (job.idempotencyKey) memoryIdempotency.set(job.idempotencyKey, job.id);
  if (!useBlob()) return;

  const { pptxBuffer, ...meta } = job;
  await put(metaPath(job.id), JSON.stringify(meta), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function saveDeckPptx(jobId, pptxBuffer) {
  memoryPptx.set(jobId, pptxBuffer);
  const job = memoryJobs.get(jobId);
  if (job) {
    job.pptxBuffer = pptxBuffer;
    job.pptxSize = pptxBuffer.length;
  }
  if (!useBlob()) return;
  await put(pptxPath(jobId), pptxBuffer, {
    access: 'private',
    contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function loadDeckPptx(jobId) {
  if (memoryPptx.has(jobId)) return memoryPptx.get(jobId);
  const job = memoryJobs.get(jobId);
  if (job?.pptxBuffer) return job.pptxBuffer;
  if (!useBlob()) return null;
  try {
    const result = await get(pptxPath(jobId), { access: 'private', useCache: false });
    if (!result?.stream) return null;
    const buf = Buffer.from(await new Response(result.stream).arrayBuffer());
    memoryPptx.set(jobId, buf);
    return buf;
  } catch (err) {
    if (err?.name === 'BlobNotFoundError') return null;
    throw err;
  }
}

export async function findJobByIdempotency(key) {
  if (!key) return null;
  const id = memoryIdempotency.get(key);
  if (id) return loadDeckJob(id);
  return null;
}

export function indexIdempotency(key, jobId) {
  if (key) memoryIdempotency.set(key, jobId);
}

/**
 * Perceptis API v1 — server-side deck generation.
 * @see https://docs.perceptis.ai/perceptis-api-v1/quickstart-deck.md
 */

import { randomUUID } from 'node:crypto';

export function getPerceptisConfig() {
  const apiKey = process.env.PERCEPTIS_API_KEY?.trim();
  const baseUrl = (process.env.PERCEPTIS_API_BASE_URL || 'https://app.perceptis.ai').replace(/\/$/, '');
  const templateName = process.env.PERCEPTIS_TEMPLATE_NAME?.trim() || '';
  return { apiKey, baseUrl, templateName };
}

export function assertPerceptisConfigured() {
  const { apiKey } = getPerceptisConfig();
  if (!apiKey) {
    throw new Error('PERCEPTIS_API_KEY not configured — add to .env.local');
  }
}

async function perceptisFetch(path, { method = 'GET', body, idempotencyKey } = {}) {
  const { apiKey, baseUrl } = getPerceptisConfig();
  assertPerceptisConfigured();

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
  };
  if (body) headers['Content-Type'] = 'application/json';
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || text || res.statusText;
    throw new Error(`Perceptis API ${res.status}: ${msg}`);
  }

  return data;
}

export async function startPerceptisDeckJob(prompt, options = {}) {
  const payload = {
    prompt: String(prompt).trim(),
    output_type: 'deck',
    ...(options.templateName ? { template_name: options.templateName } : {}),
    ...(options.useWebSearch ? { use_web_search: true } : {}),
    ...(options.useKnowledgeBase ? { use_knowledge_base: true } : {}),
  };

  return perceptisFetch('/api/v1/generate', {
    method: 'POST',
    body: payload,
    idempotencyKey: options.idempotencyKey || randomUUID(),
  });
}

export async function getPerceptisJobStatus(jobId) {
  return perceptisFetch(`/api/v1/status/${encodeURIComponent(jobId)}`);
}

export async function pollPerceptisJob(jobId, { timeoutSec = 300, intervalSec = 3 } = {}) {
  const deadline = Date.now() + timeoutSec * 1000;

  while (Date.now() < deadline) {
    const body = await getPerceptisJobStatus(jobId);
    if (body.status === 'completed' || body.status === 'failed') {
      return body;
    }
    await new Promise((r) => setTimeout(r, intervalSec * 1000));
  }

  throw new Error(`Perceptis job ${jobId} did not complete within ${timeoutSec}s`);
}

export async function generatePerceptisDeck(prompt, options = {}) {
  const started = await startPerceptisDeckJob(prompt, options);
  const jobId = started.job_id;
  if (!jobId) throw new Error('Perceptis did not return job_id');

  const final = await pollPerceptisJob(jobId, {
    timeoutSec: options.timeoutSec ?? 300,
    intervalSec: options.intervalSec ?? 3,
  });

  if (final.status === 'failed') {
    throw new Error(final.error || 'Perceptis deck generation failed');
  }

  return final;
}

/**
 * Server-side Falcon KB retrieval (mirrors src/data/kb/falconKb.ts).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(__dirname, '../../src/data/kb/falconKbChunks.json');

let cached = null;

function load() {
  if (cached) return cached;
  cached = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  return cached;
}

const STOP = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'what', 'when', 'your', 'about', 'have',
  'does', 'how', 'are', 'was', 'were', 'will', 'should', 'could', 'into', 'against', 'their',
]);

const INSTITUTIONAL_KB_QUERY =
  /\b(falcon\s*economy|falcon\s*strategy|falcon\b|added\b|abu\s*dhabi\s*(economy|vision|gdp|diversification|strategy|global\s*market|law)|adgm\s*(law|1547|regulations?|legal|fsra|financial|digital|virtual)|adgm\b|fsra\b|1547|economic\s*clusters?|non[- ]oil|2045|2025\s*[–-]\s*2045|department\s*of\s*economic\s*development|diversification\s*drive|special\s*economic\s*programs?|quality\s*of\s*life|export\s*driven|english\s*law|cabinet\s*resolution|application\s*of\s*english|financial\s*services\s*and\s*markets|virtual\s*assets?|digital\s*assets?|tokenis|stablecoin|fund\s*passport|financial\s*free\s*zone|free\s*zone)\b/i;

export function isFalconKbQuery(query) {
  return INSTITUTIONAL_KB_QUERY.test(String(query || '').trim());
}

function tokenize(query) {
  return String(query)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
}

function scoreChunk(query, chunk) {
  const tokens = tokenize(query);
  if (!tokens.length) return 0;
  const hay = chunk.text.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (hay.includes(t)) score += 1;
  }
  if (/\bfalcon\b/i.test(query) && /falcon/i.test(chunk.text)) score += 2;
  if (/strategy/i.test(query) && chunk.sourceId === 'falcon-strategy') score += 2;
  if (/economy|cluster|2045|enabler/i.test(query) && chunk.sourceId === 'falcon-economy') score += 2;
  if (/1547|adgm\s*law|regulation/i.test(query) && chunk.sourceId.startsWith('adgm-1547')) score += 3;
  if (/english\s*law/i.test(query) && chunk.sourceId === 'english-law-amendment-2022') score += 3;
  if (/cabinet\s*resolution/i.test(query) && chunk.sourceId === 'cabinet-resolution-2013') score += 3;
  return score;
}

export function retrieveFalconExcerpts(query, maxChunks = 8) {
  const { chunks: CHUNKS, sources: SOURCES } = load();
  if (!query?.trim() || !CHUNKS?.length) return [];

  const scored = CHUNKS.map((chunk) => ({ chunk, score: scoreChunk(query, chunk) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked = [];
  const seen = new Set();
  const push = (chunk) => {
    if (seen.has(chunk.handle)) return;
    seen.add(chunk.handle);
    picked.push(chunk);
  };

  const bySource = new Map();
  for (const { chunk, score } of scored) {
    const prev = bySource.get(chunk.sourceId) ?? 0;
    if (score > prev) bySource.set(chunk.sourceId, score);
  }
  const topSources = [...bySource.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);
  for (const srcId of topSources) {
    const lead = CHUNKS.find((c) => c.sourceId === srcId && c.chunkIndex === 0);
    if (lead) push(lead);
  }

  for (const { chunk } of scored) {
    if (picked.length >= maxChunks) break;
    push(chunk);
  }

  const finalChunks = picked.slice(0, maxChunks);

  // Attach source URL metadata to each chunk so callers can surface real links
  const sourceMap = new Map((SOURCES ?? []).map((s) => [s.id, s]));
  return finalChunks.map((chunk) => {
    const src = sourceMap.get(chunk.sourceId);
    return {
      ...chunk,
      externalUrl: src?.externalUrl ?? null,
      publicUrl: src?.publicUrl ?? null,
      citation: src?.citation ?? chunk.docTitle,
    };
  });
}

export function falconExcerptsToGroundedRecords(excerpts) {
  const { sources: SOURCES } = load();
  return excerpts.map((ex) => {
    const src = SOURCES?.find((s) => s.id === ex.sourceId);
    return {
      handle: ex.handle,
      kind: 'internal',
      system: 'Knowledge base',
      label: `${ex.docTitle} · §${ex.chunkIndex + 1}`,
      snippet: ex.text.slice(0, 1400),
      asOf: ex.docDate,
      externalUrl: src?.externalUrl ?? null,
      publicUrl: src?.publicUrl ?? null,
      citation: src?.citation ?? ex.docTitle,
    };
  });
}

export function formatFalconExcerptBlock(excerpts) {
  if (!excerpts?.length) return '';
  const { sources: SOURCES } = load();
  const blocks = excerpts.map((ex) => {
    const src = SOURCES?.find((s) => s.id === ex.sourceId);
    const urlLine = src?.externalUrl
      ? `Source URL: ${src.externalUrl} | PDF: ${src.publicUrl ?? 'available in KB'}`
      : '';
    const citationLine = src?.citation ? `Citation: ${src.citation}` : '';
    return `[${ex.handle}] ${ex.docTitle} (${ex.docDate})\n${urlLine}${urlLine && citationLine ? '\n' : ''}${citationLine}\n${ex.text.slice(0, 2000)}`;
  });
  return `\n═══════════════════════════════\nAUTHORITATIVE KB EXCERPTS (cite handles WITH source URLs — stakeholders will verify)\n═══════════════════════════════\n\n${blocks.join('\n\n---\n\n')}\n`;
}

/** Exported source URL map for use by sourceLinks.ts */
export function getKbSourceUrls() {
  const { sources: SOURCES } = load();
  const map = {};
  for (const s of (SOURCES ?? [])) {
    if (s.id) map[s.id] = { externalUrl: s.externalUrl, publicUrl: s.publicUrl, citation: s.citation, title: s.title };
  }
  return map;
}

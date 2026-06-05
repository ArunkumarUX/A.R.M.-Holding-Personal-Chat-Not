import chunksPayload from './falconKbChunks.json';

export type FalconKbChunk = {
  sourceId: string;
  docId: string;
  docHandle: string;
  docTitle: string;
  docDate: string;
  chunkIndex: number;
  handle: string;
  text: string;
};

export type FalconKbSource = {
  id: string;
  docId: string;
  handle: string;
  title: string;
  pdfName: string;
  date: string;
  category: string;
  pageEstimate: number;
  summary: string;
  chunkCount: number;
};

const CHUNKS = chunksPayload.chunks as FalconKbChunk[];
const SOURCES = chunksPayload.sources as FalconKbSource[];

const STOP = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'what', 'when', 'your', 'about', 'have',
  'does', 'how', 'are', 'was', 'were', 'will', 'should', 'could', 'into', 'against', 'their',
]);

const INSTITUTIONAL_KB_QUERY =
  /\b(falcon\s*economy|falcon\s*strategy|falcon\b|added\b|abu\s*dhabi\s*(economy|vision|gdp|diversification|strategy|global\s*market|law)|adgm\s*(law|1547|regulations?|legal)|economic\s*clusters?|non[- ]oil|2045|2025\s*[–-]\s*2045|department\s*of\s*economic\s*development|diversification\s*drive|special\s*economic\s*programs?|quality\s*of\s*life|export\s*driven|english\s*law|cabinet\s*resolution|application\s*of\s*english|financial\s*services\s*and\s*markets)\b/i;

export const FALCON_KB_SOURCES = SOURCES;

export function isFalconKbQuery(query: string): boolean {
  return INSTITUTIONAL_KB_QUERY.test(query.trim());
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
}

function scoreChunk(query: string, chunk: FalconKbChunk): number {
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

/** Ranked excerpts from official Falcon PDFs for grounding chat / demo responses */
export function retrieveFalconExcerpts(query: string, maxChunks = 8): FalconKbChunk[] {
  if (!query.trim() || !CHUNKS.length) return [];

  const scored = CHUNKS.map((chunk) => ({ chunk, score: scoreChunk(query, chunk) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked: FalconKbChunk[] = [];
  const seen = new Set<string>();

  const push = (chunk: FalconKbChunk) => {
    if (seen.has(chunk.handle)) return;
    seen.add(chunk.handle);
    picked.push(chunk);
  };

  const bySource = new Map<string, number>();
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

  return picked.slice(0, maxChunks);
}

export function falconExcerptsToGroundedRecords(excerpts: FalconKbChunk[]) {
  return excerpts.map((ex) => ({
    handle: ex.handle,
    kind: 'internal' as const,
    system: 'Knowledge base',
    label: `${ex.docTitle} · §${ex.chunkIndex + 1}`,
    snippet: ex.text.slice(0, 1400),
    asOf: ex.docDate,
  }));
}

export function formatFalconExcerptBlock(excerpts: FalconKbChunk[]): string {
  if (!excerpts.length) return '';
  const blocks = excerpts.map(
    (ex) => `[${ex.handle}] ${ex.docTitle} (${ex.docDate})\n${ex.text.slice(0, 2000)}`,
  );
  return `\n═══════════════════════════════\nAUTHORITATIVE KB EXCERPTS (cite handles — do not invent)\n═══════════════════════════════\n\n${blocks.join('\n\n---\n\n')}\n`;
}

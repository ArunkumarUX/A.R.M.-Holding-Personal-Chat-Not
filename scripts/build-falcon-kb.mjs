/**
 * Build Falcon Economy / Falcon Strategy KB chunks from extracted PDF text.
 * Run: node scripts/build-falcon-kb.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data', 'kb-pdfs');
const outPath = path.join(root, 'src', 'data', 'kb', 'falconKbChunks.json');

const SOURCES = [
  {
    id: 'falcon-economy',
    docId: 'd6',
    handle: 'KB-006',
    file: 'falcon-economy-eng.txt',
    title: 'Falcon Economy Strategy 2025–2045 (English)',
    pdfName: '20240923_FalconEconomy-Eng.pdf',
    date: '2024-09-23',
    category: 'strategy',
  },
  {
    id: 'falcon-strategy',
    docId: 'd7',
    handle: 'KB-007',
    file: 'falcon-strategy.txt',
    title: 'Falcon Strategy (Executive Summary)',
    pdfName: '20240501_Falcon Strategy.pdf',
    date: '2024-05-01',
    category: 'strategy',
  },
];

const MAX_CHUNK = 2200;

function normalize(text) {
  return text
    .replace(/\f/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function chunkText(text) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter((b) => b.length > 40);
  const chunks = [];
  let buf = '';
  for (const block of blocks) {
    if (buf.length + block.length + 2 > MAX_CHUNK && buf.length > 200) {
      chunks.push(buf.trim());
      buf = block;
    } else {
      buf = buf ? `${buf}\n\n${block}` : block;
    }
  }
  if (buf.trim().length > 80) chunks.push(buf.trim());
  return chunks;
}

const payload = { version: 1, builtAt: new Date().toISOString(), sources: [], chunks: [] };

for (const src of SOURCES) {
  const txtPath = path.join(dataDir, src.file);
  if (!fs.existsSync(txtPath)) {
    console.error(`Missing ${txtPath} — run pdftotext on PDFs first.`);
    process.exit(1);
  }
  const raw = normalize(fs.readFileSync(txtPath, 'utf8'));
  const parts = chunkText(raw);
  const summary = parts[0]?.slice(0, 600) ?? '';
  payload.sources.push({
    ...src,
    pageEstimate: Math.max(1, Math.round(raw.length / 2800)),
    summary,
    chunkCount: parts.length,
  });
  parts.forEach((text, i) => {
    payload.chunks.push({
      sourceId: src.id,
      docId: src.docId,
      docHandle: src.handle,
      docTitle: src.title,
      docDate: src.date,
      chunkIndex: i,
      handle: `${src.handle}-${String(i + 1).padStart(2, '0')}`,
      text,
    });
  });
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload));
console.log(`Wrote ${payload.chunks.length} chunks → ${outPath}`);

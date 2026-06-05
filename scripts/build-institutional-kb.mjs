/**
 * Build institutional KB chunks (Falcon + ADGM Archive PDFs).
 * Run: npm run kb:build
 */
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARCHIVE_INPUT_DIR, KB_SOURCES } from './kb-sources.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data', 'kb-pdfs');
const publicKb = path.join(root, 'public', 'kb');
const outPath = path.join(root, 'src', 'data', 'kb', 'falconKbChunks.json');

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

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function extractPdf(pdfPath, txtPath) {
  execSync(`pdftotext -layout "${pdfPath}" "${txtPath}"`, { stdio: 'inherit' });
}

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(publicKb, { recursive: true });

const payload = { version: 2, builtAt: new Date().toISOString(), sources: [], chunks: [] };

for (const src of KB_SOURCES) {
  const pdfPath = path.join(dataDir, src.pdfFile);
  const txtPath = path.join(dataDir, src.txtFile);

  if (src.copyFromArchive) {
    const archivePath = path.join(ARCHIVE_INPUT_DIR, src.archiveName);
    if (!fs.existsSync(archivePath)) {
      console.error(`Missing archive PDF: ${archivePath}`);
      process.exit(1);
    }
    copyFile(archivePath, pdfPath);
    console.log(`Copied ${src.archiveName} → ${src.pdfFile}`);
  } else if (!fs.existsSync(pdfPath)) {
    console.error(`Missing ${pdfPath}`);
    process.exit(1);
  }

  copyFile(pdfPath, path.join(publicKb, src.pdfFile));

  if (!fs.existsSync(txtPath)) {
    console.log(`Extracting text: ${src.pdfFile}`);
    extractPdf(pdfPath, txtPath);
  }

  const raw = normalize(fs.readFileSync(txtPath, 'utf8'));
  if (raw.length < 100) {
    console.warn(`Warning: very little text in ${src.pdfFile} — OCR may be needed.`);
  }

  const parts = chunkText(raw);
  const summary = parts[0]?.slice(0, 600) ?? '';
  payload.sources.push({
    id: src.id,
    docId: src.docId,
    handle: src.handle,
    title: src.title,
    pdfName: src.pdfFile,
    date: src.date,
    category: src.category,
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

  console.log(`  ${src.handle} ${src.title}: ${parts.length} chunks`);
}

fs.writeFileSync(outPath, JSON.stringify(payload));
const hash = crypto.createHash('sha256').update(JSON.stringify(payload.chunks.length)).digest('hex').slice(0, 8);
console.log(`\nWrote ${payload.chunks.length} chunks from ${payload.sources.length} sources → ${outPath} (${hash})`);

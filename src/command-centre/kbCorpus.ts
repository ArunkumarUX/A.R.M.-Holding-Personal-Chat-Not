import type { KbCompanyId } from '../config/kbCompanies';
import { KB_DOCS } from '../data/commandCentreData';
import type { DocumentFile } from '../types';

export type KbDocStatus = 'uploading' | 'processing' | 'ready' | 'error';

export interface KbListDoc {
  id: string;
  t: string;
  cat: string;
  companyId: KbCompanyId;
  date: string;
  pages: number;
  by: string;
  status: KbDocStatus;
  /** Set for user uploads — links to executive store document */
  fileId?: string;
  summary?: string;
  isUpload?: boolean;
}

export function guessKbCategory(filename: string): string {
  const n = filename.toLowerCase();
  if (/board|pack/.test(n)) return 'board';
  if (/strategy|falcon|five.?year|abu.?dhabi.?vision/.test(n)) return 'strategy';
  if (/fsra|policy|regulat|aml|compliance/.test(n)) return 'policy';
  if (/performance|hr|sales|pipeline|mandate/.test(n)) return 'performance';
  if (/market|benchmark|bloomberg|finance|sustainable/.test(n)) return 'market';
  return 'general';
}

export function humanizeFileName(name: string): string {
  return name
    .replace(/\.(pdf|docx?|xlsx|xls)$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

function formatKbDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function estimatePages(size: string): number {
  const mb = parseFloat(size);
  if (!Number.isNaN(mb)) return Math.max(8, Math.round(mb * 18));
  return 12;
}

function mapUploadStatus(status: DocumentFile['status']): KbDocStatus {
  if (status === 'uploading') return 'uploading';
  if (status === 'ready') return 'ready';
  if (status === 'error') return 'error';
  return 'processing';
}

const SEED_COMPANY_IDS: KbCompanyId[] = ['adgm', 'adio', 'company-3', 'company-4'];

function documentToKbEntry(doc: DocumentFile, ar = false): KbListDoc {
  const taggedDate = doc.kbDocumentDate ?? doc.uploadedAt;
  return {
    id: doc.id,
    fileId: doc.id,
    t: humanizeFileName(doc.name),
    cat: doc.kbCategory ?? guessKbCategory(doc.name),
    companyId: doc.kbCompanyId ?? 'adgm',
    date: formatKbDate(taggedDate),
    pages: estimatePages(doc.size),
    by: ar ? 'رفعك' : 'Your upload',
    status: mapUploadStatus(doc.status),
    summary: doc.summary,
    isUpload: true,
  };
}

const SEED_DOCS: KbListDoc[] = KB_DOCS.map((d, i) => ({
  id: `seed-${i}-${d.t.slice(0, 24)}`,
  t: d.t,
  cat: d.cat,
  companyId: SEED_COMPANY_IDS[i % SEED_COMPANY_IDS.length],
  date: d.date,
  pages: d.pages,
  by: d.by,
  status: 'ready' as const,
  isUpload: false,
}));

/** Merged corpus: user uploads (newest first) + seeded approved catalogue */
export function buildKbCorpus(documents: DocumentFile[], ar = false): KbListDoc[] {
  const uploads = documents
    .filter((d) => d.inKnowledgeBase || d.focusAreaIds?.includes('knowledge'))
    .map((d) => documentToKbEntry(d, ar));
  return [...uploads, ...SEED_DOCS];
}

export function countKbByCategory(corpus: KbListDoc[], catId: string): number {
  return corpus.filter((d) => d.cat === catId).length;
}

export function countKbByCompany(corpus: KbListDoc[], companyId: KbCompanyId): number {
  return corpus.filter((d) => d.companyId === companyId).length;
}

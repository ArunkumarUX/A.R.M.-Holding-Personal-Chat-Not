import type { Source, SourceType } from '../types';
import type { ExecutiveState } from '../data/executiveStore';
import { kbHandle } from './sourceHandles';

/** Known external URLs for demo documents and feeds */
const DOC_EXTERNAL_URL: Record<string, string> = {
  d2: 'https://www.adgm.com/rules-and-regulations',
  d4: 'https://www.mas.gov.sg/regulation',
  d1: 'https://www.adgm.com/about',
  d5: 'https://www.adgm.com/about',
};

const CRM_EXTERNAL_URL: Record<string, string> = {
  'CRM-mas': 'https://www.mas.gov.sg',
  'CRM-mubadala': 'https://www.mubadala.com',
};

const MARKET_FEED_URL = 'https://www.lseg.com/en/data-analytics';

/**
 * Real external URLs for every KB source document.
 * Keyed by KB source ID (from falconKbChunks.json sources[].id).
 * Shown in the source panel so stakeholders can verify facts directly.
 */
export const KB_SOURCE_URLS: Record<string, { url: string; label: string; pdfPath: string }> = {
  'falcon-economy': {
    url: 'https://www.added.gov.ae',
    label: 'Abu Dhabi Dept. of Economic Development (ADDED)',
    pdfPath: '/kb/20240923_FalconEconomy-Eng.pdf',
  },
  'falcon-strategy': {
    url: 'https://www.adgm.com',
    label: 'ADGM — Abu Dhabi Global Market',
    pdfPath: '/kb/20240501_Falcon Strategy.pdf',
  },
  'adgm-1547-v314': {
    url: 'https://www.adgm.com/rules-and-regulations',
    label: 'ADGM Rules & Regulations',
    pdfPath: '/kb/adgm-1547-3267-v3-14.pdf',
  },
  'adgm-1547-01110319': {
    url: 'https://www.adgm.com/rules-and-regulations',
    label: 'ADGM Rules & Regulations',
    pdfPath: '/kb/adgm-1547-v01110319.pdf',
  },
  'adgm-1547-v1': {
    url: 'https://www.adgm.com/rules-and-regulations',
    label: 'ADGM Rules & Regulations',
    pdfPath: '/kb/adgm-1547-v1.pdf',
  },
  'adgm-1547-2025': {
    url: 'https://www.adgm.com/rules-and-regulations',
    label: 'ADGM Rules & Regulations',
    pdfPath: '/kb/adgm-1547-v2025.pdf',
  },
  'adgm-1547-apr2020': {
    url: 'https://www.adgm.com/rules-and-regulations',
    label: 'ADGM Rules & Regulations',
    pdfPath: '/kb/adgm-1547-apr-2020.pdf',
  },
  'adgm-1547-apr2026': {
    url: 'https://www.adgm.com/rules-and-regulations',
    label: 'ADGM Rules & Regulations',
    pdfPath: '/kb/adgm-1547-apr-2026.pdf',
  },
  'english-law-amendment-2022': {
    url: 'https://www.adgm.com/rules-and-regulations',
    label: 'ADGM Rules & Regulations',
    pdfPath: '/kb/english-law-amendment-2022.pdf',
  },
  'cabinet-resolution-2013': {
    url: 'https://www.adgm.com/rules-and-regulations',
    label: 'ADGM Rules & Regulations',
    pdfPath: '/kb/cabinet-resolution-4-2013.pdf',
  },
};

/**
 * Map a KB handle (e.g. KB-006-01) to its source ID.
 * KB-006 = falcon-economy, KB-007 = falcon-strategy, KB-008–KB-015 = adgm law variants etc.
 * The mapping is based on the chunk index order in falconKbChunks.json sources array.
 */
const KB_HANDLE_TO_SOURCE_ID: Record<string, string> = {
  'KB-006': 'falcon-economy',
  'KB-007': 'falcon-strategy',
  'KB-008': 'adgm-1547-v314',
  'KB-009': 'adgm-1547-01110319',
  'KB-010': 'adgm-1547-v1',
  'KB-011': 'adgm-1547-2025',
  'KB-012': 'adgm-1547-apr2020',
  'KB-013': 'adgm-1547-apr2026',
  'KB-014': 'english-law-amendment-2022',
  'KB-015': 'cabinet-resolution-2013',
};

function getKbSourceId(handle?: string): string | undefined {
  if (!handle) return undefined;
  // handle is like KB-006-01 → prefix is KB-006
  const prefix = handle.match(/^(KB-\d+)/)?.[1];
  return prefix ? KB_HANDLE_TO_SOURCE_ID[prefix] : undefined;
}

function handlePrefix(handle?: string): string {
  return handle?.split('-')[0]?.toUpperCase() ?? '';
}

export function sourceTypeFromHandle(handle?: string): SourceType {
  const p = handlePrefix(handle);
  if (p === 'KB') return 'knowledge';
  if (p === 'MKT') return 'external';
  if (p === 'CAL') return 'calendar';
  if (p === 'ACT') return 'action';
  if (p === 'CRM') return 'crm';
  return 'knowledge';
}

export function docIdFromKbHandle(state: ExecutiveState, handle: string): string | undefined {
  const idx = state.documents.findIndex((d, i) => kbHandle(d.id, i) === handle);
  return idx >= 0 ? state.documents[idx].id : undefined;
}

/** Enrich a source with open actions (KB route or external URL) */
export function enrichSource(source: Source, state: ExecutiveState): Source {
  const sourceType = source.sourceType ?? sourceTypeFromHandle(source.handle);
  const out: Source = { ...source, sourceType };

  if (sourceType === 'knowledge') {
    const docId =
      source.documentId ??
      (source.handle ? docIdFromKbHandle(state, source.handle) : undefined) ??
      source.id.replace(/^src-/, '');

    if (docId && state.documents.some((d) => d.id === docId)) {
      out.documentId = docId;
      out.href = `/knowledge?doc=${docId}`;
      out.openLabel = 'Open in Knowledge Base';
    }

    // Check DOC_EXTERNAL_URL first (legacy document IDs)
    const legacyExt = docId ? DOC_EXTERNAL_URL[docId] : undefined;
    if (legacyExt) {
      out.externalUrl = legacyExt;
    }

    // Check KB_SOURCE_URLS by handle prefix (KB-006, KB-007 etc.)
    const kbSourceId = getKbSourceId(source.handle);
    const kbMeta = kbSourceId ? KB_SOURCE_URLS[kbSourceId] : undefined;
    if (kbMeta) {
      out.externalUrl = kbMeta.url;
      out.href = kbMeta.pdfPath; // link directly to PDF for download
      out.openLabel = `View PDF — ${kbMeta.label}`;
    }

    return out;
  }

  if (sourceType === 'external') {
    out.href = source.externalUrl ?? MARKET_FEED_URL;
    out.externalUrl = out.href;
    out.openLabel = 'Open source';
    return out;
  }

  if (sourceType === 'crm' && source.handle && CRM_EXTERNAL_URL[source.handle]) {
    out.externalUrl = CRM_EXTERNAL_URL[source.handle];
    out.openLabel = 'Open website';
    return out;
  }

  if (sourceType === 'calendar') {
    out.href = '/briefings';
    out.openLabel = 'View briefings';
    return out;
  }

  if (sourceType === 'action') {
    out.href = '/performance';
    out.openLabel = 'View actions';
    return out;
  }

  return out;
}

export function enrichSources(sources: Source[], state: ExecutiveState): Source[] {
  return sources.map((s) => enrichSource(s, state));
}

/** Sources shown in the panel: knowledge-base docs + items with an external website */
export function panelSources(sources: Source[]): Source[] {
  return sources.filter(
    (s) =>
      s.sourceType === 'knowledge' ||
      s.sourceType === 'external' ||
      Boolean(s.externalUrl),
  );
}

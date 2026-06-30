/** Known external URLs for live documents and feeds */
import type { Source, SourceType } from '../types';
import type { ExecutiveState } from '../data/executiveStore';
import { kbHandle } from './sourceHandles';

const DOC_EXTERNAL_URL: Record<string, string> = {
  d2: 'https://www.apparelgroup.com/',
  d4: 'https://www.rera.gov.ae',
  d1: 'https://www.apparelgroup.com/',
  d5: 'https://www.apparelgroup.com/',
};

const CRM_EXTERNAL_URL: Record<string, string> = {
  'CRM-artdubai': 'https://www.artdubai.ae',
  'CRM-drec': 'https://www.apparelgroup.com/',
};

const MARKET_FEED_URL = 'https://www.cbre.ae/insights';

/**
 * Real external URLs for every KB source document.
 * Keyed by KB source ID (from armKbChunks.json sources[].id).
 */
export const KB_SOURCE_URLS: Record<string, { url: string; label: string; pdfPath: string }> = {
  'ag-group-strategy': {
    url: 'https://www.apparelgroup.com/',
    label: 'Apparel Group — Group Strategy',
    pdfPath: '/kb/Apparel_Group_Strategy_2026.pdf',
  },
  'arm-values': {
    url: 'https://www.apparelgroup.com/',
    label: 'Apparel Group — Values & Leadership',
    pdfPath: '/kb/ARM_Values_Leadership_2026.pdf',
  },
  'drec-portfolio': {
    url: 'https://www.apparelgroup.com/',
    label: 'R&B — Portfolio Review',
    pdfPath: '/kb/R&B_Portfolio_Review_Q1_2026.pdf',
  },
  'huna-developments': {
    url: 'https://www.apparelgroup.com/',
    label: '6thStreet — Development Strategy',
    pdfPath: '/kb/6thStreet_Development_Strategy_2026.pdf',
  },
  'hive-loyalty programme': {
    url: 'https://www.apparelgroup.com/',
    label: 'Club Apparel — Loyalty programme Operations',
    pdfPath: '/kb/Club Apparel_Operations_2026.pdf',
  },
  'retailme-awards': {
    url: 'https://www.apparelgroup.com/',
    label: 'Images RetailME Awards — Commission Brief',
    pdfPath: '/kb/RetailME_Awards_Commission_Brief.pdf',
  },
  'dubai-d33-alignment': {
    url: 'https://www.apparelgroup.com/',
    label: 'GCC retail growth Portfolio Alignment Tracker',
    pdfPath: '/kb/AG_GCC_Expansion_Alignment_Tracker_2026.pdf',
  },
  'rera-compliance': {
    url: 'https://www.rera.gov.ae',
    label: 'UAE retail compliance & DED Compliance Framework',
    pdfPath: '/kb/AG_Retail_Compliance_Compliance_Framework_2026.pdf',
  },
};

/**
 * Map a KB handle (e.g. KB-001-01) to its source ID.
 */
const KB_HANDLE_TO_SOURCE_ID: Record<string, string> = {
  'KB-001': 'ag-group-strategy',
  'KB-002': 'arm-values',
  'KB-003': 'drec-portfolio',
  'KB-004': 'huna-developments',
  'KB-005': 'hive-loyalty programme',
  'KB-006': 'retailme-awards',
  'KB-007': 'dubai-d33-alignment',
  'KB-008': 'rera-compliance',
};

function getKbSourceId(handle?: string): string | undefined {
  if (!handle) return undefined;
  const prefix = handle.match(/^(KB-\d+)/)?.[1];
  return prefix ? KB_HANDLE_TO_SOURCE_ID[prefix] : undefined;
}

function handlePrefix(handle?: string): string {
  return handle?.split('-')[0]?.toUpperCase() ?? '';
}

export function sourceTypeFromHandle(handle?: string): SourceType {
  const p = handlePrefix(handle);
  if (p === 'KB') return 'knowledge';
  if (p === 'MKT' || p === 'BBG') return 'external';
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

    const legacyExt = docId ? DOC_EXTERNAL_URL[docId] : undefined;
    if (legacyExt) {
      out.externalUrl = legacyExt;
    }

    const kbSourceId = getKbSourceId(source.handle);
    const kbMeta = kbSourceId ? KB_SOURCE_URLS[kbSourceId] : undefined;
    if (kbMeta) {
      out.externalUrl = kbMeta.url;
      out.href = kbMeta.pdfPath;
      out.openLabel = `View PDF — ${kbMeta.label}`;
    }

    return out;
  }

  if (sourceType === 'external') {
    const excerptUrl = source.excerpt?.match(/https?:\/\/[^\s·]+/)?.[0];
    out.href = source.externalUrl ?? excerptUrl ?? MARKET_FEED_URL;
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

/** Sources shown in citation chips and the side panel */
export function panelSources(sources: Source[]): Source[] {
  return sources.filter(
    (s) =>
      s.sourceType === 'knowledge' ||
      s.sourceType === 'external' ||
      s.sourceType === 'calendar' ||
      s.sourceType === 'action' ||
      s.sourceType === 'crm' ||
      Boolean(s.externalUrl) ||
      Boolean(s.href),
  );
}

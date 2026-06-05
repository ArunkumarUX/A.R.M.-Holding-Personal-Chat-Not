import type { DataRefreshSlotId } from '../config/dataRefreshSchedule';
import type { ExecutiveState } from '../data/executiveStore';

export type BloombergArticle = {
  headline?: string;
  publishedAt?: string;
  url?: string;
  category?: string;
};

export type ExecutiveSnapshotPatch = {
  version: number;
  lastSync: string;
  refreshedAt?: string;
  timezone?: string;
  dataCycle?: DataRefreshSlotId;
  scheduleLabel?: string;
  meetings: ExecutiveState['meetings'];
  actionRegister: ExecutiveState['actionRegister'];
  marketSnapshot: ExecutiveState['marketSnapshot'];
  metrics: Partial<ExecutiveState['metrics']> & { openActions?: number };
  documentUploadedAt?: Record<string, string>;
  regulatoryHeadline?: string;
  bloombergArticles?: BloombergArticle[];
  bloombergFetchedAt?: string;
  liveTicker?: { k: string; v: string; c: number }[];
  liveTickerFetchedAt?: string;
};

export async function fetchExecutiveSnapshotPatch(
  cycle?: DataRefreshSlotId,
): Promise<ExecutiveSnapshotPatch | null> {
  try {
    const qs = cycle ? `?cycle=${encodeURIComponent(cycle)}` : '';
    let res = await fetch(`/api/snapshot${qs}`, { cache: 'no-store' });
    if (!res.ok) {
      res = await fetch(`/api/executive/snapshot${qs}`, { cache: 'no-store' });
    }
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; patch?: ExecutiveSnapshotPatch };
    return data.patch ?? null;
  } catch {
    return null;
  }
}

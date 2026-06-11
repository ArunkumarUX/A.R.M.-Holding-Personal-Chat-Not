/** Server-side data trust metadata (mirrors src/config/dataProvenance.ts) */

export const KB_CHUNK_COUNT = 183;

export function buildSnapshotProvenance(patch, env = process.env) {
  const bloombergLive = Boolean(patch?.bloombergFetchedAt && patch?.bloombergArticles?.length);
  const claudeEnabled = Boolean(env.ANTHROPIC_API_KEY?.trim());

  return {
    lastSync: patch?.lastSync ?? new Date().toISOString(),
    refreshedAt: patch?.refreshedAt ?? patch?.lastSync,
    scheduleLabel: patch?.scheduleLabel ?? '08:00 & 22:00 GST refresh',
    bloombergLive,
    bloombergFetchedAt: patch?.bloombergFetchedAt,
    bloombergHeadline: patch?.marketSnapshot?.bloombergLead ?? patch?.regulatoryHeadline,
    claudeEnabled,
    kbChunkCount: KB_CHUNK_COUNT,
    apifyConfigured: Boolean(env.APIFY_TOKEN?.trim()),
    sources: [
      {
        id: 'claude',
        mode: 'ai',
        live: claudeEnabled,
        label: 'Claude Sonnet 4.6',
      },
      {
        id: 'bloomberg',
        mode: bloombergLive ? 'live' : 'prototype',
        live: bloombergLive,
        label: bloombergLive ? 'Bloomberg (Apify)' : 'Market snapshot (Yahoo Finance / CoinGecko)',
      },
      {
        id: 'kb',
        mode: 'institutional',
        live: true,
        label: `Knowledge base (${KB_CHUNK_COUNT} chunks)`,
      },
      {
        id: 'calendar',
        mode: 'prototype',
        live: false,
        label: 'Calendar & actions (integration pending)',
      },
    ],
  };
}

export function buildHealthDataTrust(env = process.env) {
  return {
    claude: Boolean(env.ANTHROPIC_API_KEY?.trim()),
    bloombergApify: Boolean(env.APIFY_TOKEN?.trim()),
    webSearch: Boolean(env.BRAVE_SEARCH_API_KEY?.trim()),
    kbChunks: KB_CHUNK_COUNT,
    calendarIntegration: 'pending',
    marketTicker: 'live',
    departmentMetrics: 'pending-erp',
  };
}

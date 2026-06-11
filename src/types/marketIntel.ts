/** Live news item from RSS feeds (server/liveNewsFeeds.mjs) */
export type LiveNewsItem = {
  title: string;
  url: string;
  date: string;
  source: string;
  sourceUrl: string;
  excerpt: string;
  feedId?: string;
  tags?: string[];
};

export type SignalNewsBundle = {
  market: LiveNewsItem[];
  competitor: LiveNewsItem[];
  investment: LiveNewsItem[];
  regulatory: LiveNewsItem[];
  followup: LiveNewsItem[];
  gccTop: LiveNewsItem[];
};

export type LiveMarketIntelSnapshot = {
  asOf?: string;
  isLive?: boolean;
  gccEquitiesSummary?: string | null;
  digitalAssetsSummary?: string | null;
  oilSummary?: string | null;
  goldSummary?: string | null;
  equities?: { sourceLabel?: string; sourceUrl?: string; summary?: string | null };
  digital?: { sourceLabel?: string; sourceUrl?: string; summary?: string | null };
};

export type MarketSnapshotFields = {
  gccEquities: string;
  digitalAssetsWoW: string;
  competitorNote: string;
  topSector: string;
  asOf?: string;
  bloombergLead?: string;
  gccEquitiesSource?: string;
  gccEquitiesSourceUrl?: string | null;
  digitalAssetsSource?: string;
  digitalAssetsSourceUrl?: string | null;
  oilSummary?: string | null;
  goldSummary?: string | null;
  /** True when gccEquities came from Yahoo Finance indices */
  gccEquitiesLive?: boolean;
  /** True when digitalAssetsWoW came from CoinGecko */
  digitalAssetsLive?: boolean;
  /** True when topSector came from live RSS / Bloomberg, not scenario rotation */
  topSectorLive?: boolean;
  /** True when competitorNote came from live RSS / Bloomberg */
  competitorNoteLive?: boolean;
  oilSourceUrl?: string | null;
  goldSourceUrl?: string | null;
  isLive?: boolean;
  /** Live regional capital-flow proxy — derived from equity index daily % changes */
  capitalFlows?: { k: string; kAr: string; flow: number; v: string; live: boolean }[] | null;
  /** True when at least one region's flow came from a live index */
  capitalFlowsLive?: boolean;
};

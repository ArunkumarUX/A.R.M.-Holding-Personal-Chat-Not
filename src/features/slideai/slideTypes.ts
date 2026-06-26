export type SlideLayout =
  | 'title'
  | 'content'
  | 'two-col'
  | 'stat'
  | 'image-left'
  | 'quote'
  | 'timeline'
  | 'comparison'
  | 'icon-grid'
  | 'blank';

export interface SlideTheme {
  bg: string;
  text: string;
  accent: string;
}

export interface SlideStat {
  value: string;
  label: string;
  context?: string;
}

export interface TimelineItem {
  marker: string;
  title: string;
  body: string;
}

export interface IconGridItem {
  emoji: string;
  title: string;
  body: string;
}

export interface TableRow {
  cells: string[];
  bold?: boolean;
  /** Highlight row in accent colour (e.g. recommended / priority row) */
  highlight?: boolean;
}

export interface SlideTable {
  caption?: string;
  subcaption?: string;
  headers: string[];
  rows: TableRow[];
}

export interface InsightPanel {
  /** Heading in the dark right panel — e.g. "Key Findings" */
  title: string;
  bullets: string[];
}

export interface ChartSeries {
  name: string;
  color?: string; // hex without #
  values: number[];
}

export interface SlideChart {
  type: 'bar' | 'line' | 'waterfall' | 'grouped-bar' | 'bar-horizontal' | 'donut';
  title?: string;
  labels: string[];
  series: ChartSeries[];
  yUnit?: string;
  yAxisLabel?: string;
  baseline?: number;
  annotation?: string;
  annotationIndex?: number;
}

export interface Slide {
  id: string;
  layout: SlideLayout;
  title: string;
  useDarkBg?: boolean;
  subtitle?: string;
  eyebrow?: string;
  body?: string;
  bullets?: string[];
  stats?: SlideStat[];
  leftContent?: string;
  rightContent?: string;
  leftTitle?: string;
  rightTitle?: string;
  quote?: string;
  quoteAuthor?: string;
  timelineItems?: TimelineItem[];
  icons?: IconGridItem[];
  imagePrompt?: string;
  accentBar?: 'top' | 'left' | 'bottom';
  callout?: string;
  /** Optional override for title/headline colour (hex without #) */
  titleColor?: string;
  speakerNotes?: string;
  theme?: SlideTheme;
  /** Perceptis-quality: data table with styled header row */
  table?: SlideTable;
  /** Perceptis-quality: dark right insight panel (replaces rightContent when present) */
  insightPanel?: InsightPanel;
  /** Perceptis-quality: "So what" callout box below main content */
  soWhat?: string;
  /** Perceptis-quality: source citation line at slide bottom */
  sourceNote?: string;
  /** Native PowerPoint chart + SVG preview — mutually exclusive with table */
  chart?: SlideChart;
}

export interface DeckTheme {
  bg: string;
  darkBg?: string;
  text: string;
  accent: string;
  secondaryAccent?: string;
  font: string;
  fontBody: string;
  tagline: string;
}

export interface Deck {
  title: string;
  slides: Slide[];
  theme: DeckTheme;
  brandCheck?: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  action: 'create' | 'update' | 'message';
  deck: Deck | null;
  updatedSlides: Slide[] | null;
  message: string;
}

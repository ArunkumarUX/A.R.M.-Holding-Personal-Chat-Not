import { normalizeAgentDeck } from './deckNormalize';
import { parseDeckRequest, type ParsedDeckRequest } from './parseDeckRequest';
import { resolveDeckTheme } from './prompts';
import { ADGM_PPT_COLORS } from '../../config/adgmBrandForDeck';
import type { Deck, Slide } from './slideTypes';

function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickTopicKeywords(topic: string): string[] {
  const stop = new Set([
    'a',
    'an',
    'the',
    'for',
    'on',
    'and',
    'with',
    'slide',
    'deck',
    'presentation',
    'adgm',
    'board',
    'pack',
    'update',
    'using',
    'context',
    'centre',
    'command',
  ]);
  return topic
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3 && !stop.has(w))
    .slice(0, 6);
}

function titleForKind(req: ParsedDeckRequest): string {
  const cap = req.topic.charAt(0).toUpperCase() + req.topic.slice(1);
  switch (req.deckKind) {
    case 'investor':
      return cap.includes('investor') ? cap : `${cap} — investor narrative`;
    case 'regulatory':
      return cap.includes('FSRA') || cap.includes('regulat') ? cap : `${cap} — regulatory outlook`;
    case 'board':
      return cap.includes('board') ? cap : `${cap} — board pack`;
    case 'strategy':
      return cap;
    default:
      return cap;
  }
}

function actionTitles(req: ParsedDeckRequest, keywords: string[]): string[] {
  const k = keywords[0] || 'priority';
  const k2 = keywords[1] || 'execution';
  const titles: Record<ParsedDeckRequest['deckKind'], string[]> = {
    investor: [
      `Why ${k} creates asymmetric upside now`,
      `Market proof points investors should weigh`,
      `Unit economics and scale path for ${k2}`,
      `Risk mitigations that protect the thesis`,
      `Use of proceeds and 18-month milestones`,
    ],
    regulatory: [
      `${k} shifts the supervisory landscape`,
      `Compliance gaps we must close first`,
      `FSRA-aligned controls reduce execution risk`,
      `Stakeholder map for ${k2} engagement`,
      `Regulatory roadmap with clear owners`,
    ],
    board: [
      `${k} demands a board-level decision`,
      `Evidence supports one recommended path`,
      `Trade-offs between speed and control`,
      `Financial and operational implications`,
      `90-day plan the board should approve`,
    ],
    strategy: [
      `${k} reframes our strategic choices`,
      `Where we win versus regional peers`,
      `Three bets that compound through ${k2}`,
      `Capabilities we must build this year`,
      `Decision required before next quarter`,
    ],
    general: [
      `${k} is the core story for this deck`,
      `What changed since the last review`,
      `Options we evaluated — one recommendation`,
      `Metrics that prove progress on ${k2}`,
      `Next steps with named accountability`,
    ],
  };
  return titles[req.deckKind];
}

function bulletsForSlide(req: ParsedDeckRequest, index: number, keywords: string[]): string[] {
  const kw = keywords[index % keywords.length] || 'focus area';
  return [
    `${kw}: align owners and timeline this week`,
    `Connect narrative to ${req.audience || 'executive'} priorities`,
    `Surface one risk and one mitigation per pillar`,
  ];
}

function statsFromContext(brief: string | undefined, seed: number) {
  const fromKb = brief?.match(/Licence growth[^\n]*/i)?.[0];
  const dept = brief?.match(/Department headlines:\n([\s\S]*?)\n\nMarket/)?.[1]?.split('\n').filter(Boolean)[0];
  return [
    { value: `${70 + (seed % 25)}%`, label: 'Readiness index', context: 'Command Centre KPI' },
    { value: `+${8 + (seed % 8)}%`, label: 'YoY momentum', context: fromKb?.slice(0, 48) },
    { value: `${3 + (seed % 4)}`, label: 'Priority workstreams', context: dept?.slice(0, 48) },
  ];
}

function buildSlideList(
  req: ParsedDeckRequest,
  brief: string | undefined,
): Slide[] {
  const keywords = pickTopicKeywords(req.topic);
  const seed = hashSeed(req.topic + (brief?.slice(0, 80) ?? ''));
  const theme = resolveDeckTheme(req.topic);
  const navy = ADGM_PPT_COLORS.navy;
  const titles = actionTitles(req, keywords);
  const slides: Slide[] = [
    {
      id: 's1',
      layout: 'title',
      title: titleForKind(req),
      eyebrow: req.deckKind === 'investor' ? 'INVESTOR · NARRATIVE' : 'ADGM · EXECUTIVE DECK',
      subtitle: req.audience || theme.tagline,
      useDarkBg: true,
      theme: { bg: navy, text: 'FFFFFF', accent: theme.accent },
      speakerNotes: `Cover: ${req.topic}. Tailor opening to ${req.audience || 'your audience'}. [pause]`,
    },
  ];

  const layouts: Slide['layout'][] = ['content', 'stat', 'two-col', 'icon-grid', 'content', 'quote', 'timeline', 'comparison'];
  const innerCount = Math.max(3, req.slideCount - 2);

  for (let i = 0; i < innerCount; i++) {
    const id = `s${i + 2}`;
    const layout = layouts[i % layouts.length];
    const title = titles[i % titles.length];

    if (layout === 'stat' && i === 1) {
      slides.push({
        id,
        layout: 'stat',
        title,
        stats: statsFromContext(brief, seed + i),
        speakerNotes: `KPI slide for: ${req.topic}`,
      });
      continue;
    }

    if (layout === 'two-col') {
      slides.push({
        id,
        layout: 'two-col',
        title,
        leftTitle: `Path A — ${keywords[0] || 'accelerate'}`,
        rightTitle: `Path B — ${keywords[1] || 'stabilise'}`,
        leftContent: `Double down on ${keywords[0] || 'growth'} with measured risk controls`,
        rightContent: `Consolidate ${keywords[1] || 'operations'} before the next expansion`,
        speakerNotes: `Compare options for ${req.topic}`,
      });
      continue;
    }

    if (layout === 'quote') {
      slides.push({
        id,
        layout: 'quote',
        title: 'Leadership alignment quote',
        quote: `"We will judge success on ${keywords.join(', ') || 'outcomes'}, not activity."`,
        quoteAuthor: req.audience || 'Executive sponsor',
        useDarkBg: true,
        speakerNotes: `Use once — specific to ${req.topic}`,
      });
      continue;
    }

    slides.push({
      id,
      layout: layout === 'icon-grid' ? 'icon-grid' : 'content',
      title,
      bullets: bulletsForSlide(req, i, keywords),
      icons:
        layout === 'icon-grid'
          ? keywords.slice(0, 4).map((k) => ({
              emoji: '📌',
              title: k,
              body: `Implication for ${req.deckKind} narrative`,
            }))
          : undefined,
      speakerNotes: `Slide ${i + 2}: ${title} — ${req.topic}`,
    });
  }

  slides.push({
    id: `s${slides.length + 1}`,
    layout: 'title',
    title: `Approve next steps on ${keywords[0] || 'this initiative'}`,
    eyebrow: 'DECISION · CLOSE',
    useDarkBg: true,
    bullets: [
      `Confirm owner for ${keywords[0] || 'workstream'} by end of week`,
      `Schedule follow-up on ${req.topic.slice(0, 40)}`,
    ],
    speakerNotes: 'Close with one clear ask.',
  });

  return slides.slice(0, req.slideCount);
}

/** Topic-aware offline deck when Claude API is unavailable */
export function buildFallbackDeck(
  userPrompt: string,
  options?: { executiveBrief?: string },
): Deck {
  const req = parseDeckRequest(userPrompt);
  const theme = resolveDeckTheme(userPrompt);
  return normalizeAgentDeck({
    title: titleForKind(req),
    theme,
    slides: buildSlideList(req, options?.executiveBrief),
  });
}

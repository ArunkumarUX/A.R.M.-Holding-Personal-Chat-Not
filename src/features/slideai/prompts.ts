import { ADGM_BRAND } from '../../config/brand';
import { ADGM_PPT_BRAND_PROMPT, ADGM_PPT_FOOTER } from '../../config/adgmBrandForDeck';
import {
  BCC_PORTFOLIO_DECK_THEME,
  BCC_PORTFOLIO_TEMPLATE_PROMPT,
  userRequestsAdgmBrand,
} from './bccPortfolioTemplate';
import {
  ADGM_PPT_MASTER_CRAFT_PROMPT,
  CLAUDE_DESIGN_CRAFT_PROMPT,
} from './claudeDesignCraft';
import type { Deck } from './slideTypes';

export type SlideAiUserMessageOptions = {
  executiveBrief?: string;
  /** Treat as new deck even if a deck exists in the store */
  forceNewDeck?: boolean;
};

/** ADGM Brand Book 2025 — default Create PPT theme (Claude Design craft) */
export const ADGM_DECK_THEME = {
  bg: ADGM_BRAND.surface.white.replace('#', ''),
  darkBg: ADGM_BRAND.navy.DEFAULT.replace('#', ''),
  text: ADGM_BRAND.navy.DEFAULT.replace('#', ''),
  accent: ADGM_BRAND.primary.clearsky.replace('#', ''),
  secondaryAccent: ADGM_BRAND.secondary.royal.replace('#', ''),
  font: 'Gilroy',
  fontBody: 'Aptos',
  tagline: ADGM_BRAND.tagline,
} as const;

/** Default SlideAI theme — ADGM + Claude Design (Command Centre Create PPT) */
export const DEFAULT_DECK_THEME = ADGM_DECK_THEME;

/** ADGM-compliant theme presets — users can say "use the executive theme" */
export const THEME_PRESETS = {
  executive: {
    name: 'ADGM Midnight Executive',
    bg: ADGM_BRAND.surface.white.replace('#', ''),
    darkBg: ADGM_BRAND.navy.DEFAULT.replace('#', ''),
    text: ADGM_BRAND.navy.DEFAULT.replace('#', ''),
    accent: ADGM_BRAND.primary.clearsky.replace('#', ''),
    secondaryAccent: ADGM_BRAND.secondary.royal.replace('#', ''),
    font: 'Gilroy',
    mood: 'Premium, authoritative, board and investor-ready',
  },
  bold: {
    name: 'ADGM Bold Forward',
    bg: ADGM_BRAND.secondary.sand.replace('#', ''),
    darkBg: ADGM_BRAND.navy.deep.replace('#', ''),
    text: ADGM_BRAND.navy.DEFAULT.replace('#', ''),
    accent: ADGM_BRAND.primary.clearsky.replace('#', ''),
    secondaryAccent: ADGM_BRAND.primary.cyan.replace('#', ''),
    font: 'Gilroy',
    mood: 'Energetic, confident, high-impact strategy narrative',
  },
  minimal: {
    name: 'ADGM Clean Minimal',
    bg: ADGM_BRAND.neutral[50].replace('#', ''),
    darkBg: ADGM_BRAND.navy.DEFAULT.replace('#', ''),
    text: ADGM_BRAND.navy.DEFAULT.replace('#', ''),
    accent: ADGM_BRAND.primary.clearsky.replace('#', ''),
    secondaryAccent: ADGM_BRAND.primary.slate.replace('#', ''),
    font: 'Gilroy',
    mood: 'Clean, Apple-like clarity — one idea per slide, lots of white space',
  },
  nature: {
    name: 'ADGM Impact & ESG',
    bg: ADGM_BRAND.secondary.mint.replace('#', ''),
    darkBg: ADGM_BRAND.navy.mid.replace('#', ''),
    text: ADGM_BRAND.navy.DEFAULT.replace('#', ''),
    accent: ADGM_BRAND.primary.clearsky.replace('#', ''),
    secondaryAccent: ADGM_BRAND.secondary.sand.replace('#', ''),
    font: 'Gilroy',
    mood: 'Sustainability, health, ESG, and impact storytelling',
  },
  finance: {
    name: 'ADGM Navy Trust',
    bg: ADGM_BRAND.neutral[50].replace('#', ''),
    darkBg: ADGM_BRAND.navy.DEFAULT.replace('#', ''),
    text: ADGM_BRAND.navy.DEFAULT.replace('#', ''),
    accent: ADGM_BRAND.secondary.sand.replace('#', ''),
    secondaryAccent: ADGM_BRAND.primary.clearsky.replace('#', ''),
    font: 'Gilroy',
    mood: 'Finance, legal, regulatory, enterprise consulting',
  },
  creative: {
    name: 'ADGM Innovation',
    bg: ADGM_BRAND.blue[50].replace('#', ''),
    darkBg: ADGM_BRAND.navy.deep.replace('#', ''),
    text: ADGM_BRAND.navy.DEFAULT.replace('#', ''),
    accent: ADGM_BRAND.primary.cyan.replace('#', ''),
    secondaryAccent: ADGM_BRAND.primary.clearsky.replace('#', ''),
    font: 'Gilroy',
    mood: 'Digital assets, fintech, innovation, and culture',
  },
} as const;

export type ThemePresetKey = keyof typeof THEME_PRESETS;

export function getThemeContext(presetKey: ThemePresetKey): string {
  const t = THEME_PRESETS[presetKey];
  return `Use the "${t.name}" theme: bg #${t.bg}, dark bg #${t.darkBg}, text #${t.text}, accent #${t.accent}, secondary #${t.secondaryAccent}. Font: ${t.font}. Mood: ${t.mood}. Stay within ADGM Brand Book 2025 colours only.`;
}

function detectThemeContext(userText: string): string | null {
  const lower = userText.toLowerCase();
  for (const key of Object.keys(THEME_PRESETS) as ThemePresetKey[]) {
    if (lower.includes(`${key} theme`) || lower.includes(`use ${key}`) || lower.includes(`${key} preset`)) {
      return getThemeContext(key);
    }
  }
  const named = Object.entries(THEME_PRESETS).find(([, t]) => lower.includes(t.name.toLowerCase()));
  return named ? getThemeContext(named[0] as ThemePresetKey) : null;
}

export const DESIGN_BOOST_PROMPT = `Review all slides and improve design using Claude Design + ADGM PPT Master craft (do not change core facts):
1. Vary layouts — no two consecutive slides share a layout
2. Action titles on every slide (complete insight, max 8 words)
3. Convert 5+ bullet slides to icon-grid or two-col with exhibit/callout
4. Stat slide for top 3 metrics with KPI tower styling (accent-soft context)
5. Add quote slide if missing and a compelling line exists
6. Dark/light sandwich: title=dark navy hero, content=paper, closing=dark
7. Speaker notes: 60–90s executive talk track with [pause]; imagePrompt on ≥50% slides
8. ADGM Brand Book 2025: Clearsky accent, Gilroy/Aptos, footer "${ADGM_PPT_FOOTER}"
Return action "update" with updatedSlides. Message: one short sentence — no template or branding mentions.`;

function userRequestsBccTemplate(userText: string): boolean {
  return /bcc\s*portfolio|service\s*designer\s*portfolio|portfolio\s*template|bcc\s*look/i.test(
    userText.toLowerCase(),
  );
}

export function resolveDeckTheme(userText: string): typeof ADGM_DECK_THEME | typeof BCC_PORTFOLIO_DECK_THEME {
  if (userRequestsBccTemplate(userText) && !userRequestsAdgmBrand(userText)) {
    return BCC_PORTFOLIO_DECK_THEME;
  }
  return ADGM_DECK_THEME;
}

/** System prompt — Claude Design + ADGM master; BCC only when user asks for portfolio template */
export function buildSystemPrompt(userText = ''): string {
  const theme = resolveDeckTheme(userText);
  const useBcc = theme === BCC_PORTFOLIO_DECK_THEME;

  const visualBlock = useBcc
    ? `${BCC_PORTFOLIO_TEMPLATE_PROMPT}\n\nBCC portfolio is active because the user requested it.`
    : `${ADGM_PPT_BRAND_PROMPT}\n\n${CLAUDE_DESIGN_CRAFT_PROMPT}\n\n${ADGM_PPT_MASTER_CRAFT_PROMPT}`;

  return `You are SlideAI — McKinsey clarity, Claude Design craft, ADGM Brand Book 2025.
Integrated into the ADGM Command Centre for ${ADGM_BRAND.logoAlt} executive decks.

${visualBlock}

You generate beautiful, opinionated slide decks. Never produce generic off-brand slides.
${useBcc ? '' : 'Default: ADGM navy/Clearsky, Gilroy/Aptos, Claude Design exhibit + KPI patterns.'}

═══════════════════════════════
UNIQUE CONTENT PER USER REQUEST (critical)
═══════════════════════════════
- Every deck MUST reflect the user's exact topic, audience, slide count, and constraints in the latest message.
- NEVER reuse a fixed template storyline (e.g. generic "three decisions", "digital-asset licensing", "Falcon Economy" bullets) unless the user explicitly asked for that subject.
- Pull titles, bullets, stats, and speaker notes from the user's words and any Command Centre context — select only facts relevant to their topic.
- Vary slide layouts and narrative arc by deck type (investor vs board vs regulatory vs strategy).
- If the user asks for a new deck, return action "create" with a completely new deck object (new titles and body on every slide).

═══════════════════════════════
DESIGN RULES (always follow)
═══════════════════════════════

COLOR — active theme (apply first):
- Theme: bg ${theme.bg}, darkBg ${theme.darkBg}, text ${theme.text}, accent ${theme.accent}
- Dark navy hero for title/close; white/mint paper for content ("sandwich" pattern)
- Primary accent: Clearsky ${theme.accent}; mint/cyan-soft for KPI cards on ADGM decks
${useBcc ? '- BCC chapter accents: hands teal, luna blue, mlink terracotta for multi-case decks' : '- Footer every slide: ' + ADGM_PPT_FOOTER}

LAYOUT VARIETY:
- Every slide must use a different layout from the previous one. Never repeat consecutive layouts.
- Layouts: title, content, two-col, stat, image-left, quote, timeline, comparison, icon-grid, blank
- Use "stat" for 2+ key numbers (with context per stat)
- Use "two-col" for comparisons, before/after, pros/cons — always set leftTitle and rightTitle
- Use "quote" for testimonials or bold one-liners (max 25 words)
- Use "timeline" for roadmaps, history, process (max 5 items)
- Use "icon-grid" for 3–6 concepts with emoji + title + body
- Use "comparison" with ✓/✗ symbols — highlight winner column with accent

CONTENT RULES:
- Slide titles: max 8 words, action-oriented ("Market" → "We Lead a $15B Digital Assets Market")
- Bullets: max 4 per slide, max 10 words each — lead with insight, not category
- Every content slide needs: a key stat, bold callout, or imagePrompt suggestion
- No filler slides — every slide earns its place

TYPOGRAPHY:
- Default: Gilroy display, Aptos body — Madani Arabic if Arabic content
${useBcc ? '- BCC override active: Calibri Light (titles), Calibri (body)' : ''}
- Dramatic size contrast: large titles, smaller body
- Italic for quotes and emphasis; bold for titles only

TEXT & TITLE COLOUR (preview applies these immediately):
- Per-slide title/headline colour: set "titleColor" (hex without #, e.g. "E0C074" for gold, "CF57D6" for accent purple)
- Slide-wide text colour: set theme.text on that slide (hex without #)
- Background: theme.bg; accent bars/eyebrows: theme.accent
- When the user asks to change title or text colour, ALWAYS return updatedSlides with titleColor and/or theme.text on the affected slide(s)
- Do not rely on deck.theme alone for per-slide title colour — the preview reads slide.titleColor first, then slide.theme.text

SPEAKER NOTES:
- Claude Design / executive style: "SLIDE N · LABEL (~60–90s)" header, conversational rhythm, [pause] markers
- 2–4 short paragraphs; cite KB/CAL/ACT/MKT handles when using Command Centre facts
- Help the presenter sound confident — do not repeat slide text verbatim

LAYOUT DESIGN DETAILS:

"title": huge title, eyebrow in accent (e.g. "BOARD PACK · Q3 2026"), useDarkBg true, optional callout tagline
"stat": numbers 60–80pt visual weight, labels small, context below each stat, accent on numbers
"two-col": leftTitle + rightTitle, subtle column contrast
"quote": large italic quote, quoteAuthor with title, darkBg preferred, accent quotation marks
"icon-grid": 3–6 items with emoji, bold 3-word title, one-line body each
"timeline": marker + title + body, max 5 items, dot-and-line rhythm
"comparison": labelled columns, ✓/✗ symbols, winner column in accent

BEFORE RETURNING, CHECK:
□ No two consecutive slides share a layout
□ Every title ≤8 words and action-oriented
□ At least 1 stat slide if deck contains numbers
□ First slide: layout "title", useDarkBg true
□ Last slide: title layout or clear CTA
□ No slide has more than 4 bullets
□ At least 1 quote or callout in decks ≥8 slides
□ speakerNotes on every slide
□ imagePrompt on at least half the slides
□ Accent appears on every slide (eyebrow, stats, accentBar, or callout)

MESSAGE FIELD RULES:
- "message" is a short, friendly reply to the user (1–2 sentences max)
- NEVER mention templates, brandCheck, BCC, or internal styling in "message"
- Say what changed ("Updated slide 3 title and stats") not how you styled it
- Omit brandCheck from JSON entirely (do not include the field)

═══════════════════════════════
JSON RESPONSE FORMAT
═══════════════════════════════

Always respond with valid JSON only — no markdown fences, no prose outside JSON:
{
  "action": "create" | "update" | "message",
  "deck": { ...Deck } | null,
  "updatedSlides": [ ...Slide[] ] | null,
  "message": "brief explanation of what you did"
}

Deck object:
{
  "title": string,
  "theme": {
    "bg": string,
    "darkBg": string,
    "text": string,
    "accent": string,
    "secondaryAccent": string,
    "font": "${theme.font}",
    "fontBody": "${theme.fontBody}",
    "tagline": "${theme.tagline}"
  },
  "slides": Slide[]
}

Each Slide:
{
  "id": string,
  "layout": "title" | "content" | "two-col" | "stat" | "image-left" | "quote" | "timeline" | "comparison" | "icon-grid" | "blank",
  "useDarkBg": boolean,
  "title": string,
  "subtitle": string | null,
  "eyebrow": string | null,
  "body": string | null,
  "bullets": string[] | null,
  "stats": [{ "value": string, "label": string, "context": string | null }] | null,
  "leftContent": string | null,
  "rightContent": string | null,
  "leftTitle": string | null,
  "rightTitle": string | null,
  "quote": string | null,
  "quoteAuthor": string | null,
  "timelineItems": [{ "marker": string, "title": string, "body": string }] | null,
  "icons": [{ "emoji": string, "title": string, "body": string }] | null,
  "imagePrompt": string | null,
  "accentBar": "top" | "left" | "bottom" | null,
  "callout": string | null,
  "titleColor": string | null,
  "speakerNotes": string,
  "theme": { "bg": string, "text": string, "accent": string } | null
}

When modifying existing slides, use action "update" and return ONLY changed slides in updatedSlides (matching ids like s1, s2, or the ids listed below).
When no deck change is needed, use action "message" with deck and updatedSlides null.
When creating a new deck, use action "create" with full deck object.
For updates: preserve unchanged slide ids — never regenerate the full deck unless the user asks to rebuild from scratch.
Default length: 8–12 slides unless user specifies.
Footer: ${useBcc ? 'portfolio tagline from deck.theme' : `"${ADGM_PPT_FOOTER}" on every slide`}.`;
}

/** Legacy export — ADGM + Claude Design default */
export const SYSTEM_PROMPT = buildSystemPrompt();

function compactSlideLine(slide: Deck['slides'][0], index: number, active: boolean): string {
  const parts = [`${index + 1}. id=${slide.id}`, `layout=${slide.layout}`, `title="${slide.title}"`];
  if (slide.titleColor) parts.push(`titleColor=${slide.titleColor}`);
  if (slide.theme?.text) parts.push(`theme.text=${slide.theme.text}`);
  if (slide.theme?.bg) parts.push(`theme.bg=${slide.theme.bg}`);
  if (active) {
    if (slide.bullets?.length) parts.push(`bullets=${slide.bullets.length}`);
    if (slide.stats?.length) parts.push(`stats=${slide.stats.length}`);
  }
  return parts.join(' · ');
}

function detectColorRequest(userText: string): string | null {
  if (!/(color|colour|gold|silver|white|black|purple|navy|mint|hex|#[0-9a-f]{3,8})/i.test(userText)) {
    return null;
  }
  return (
    'Colour change requested: include titleColor (hex without #) on affected slides in updatedSlides. ' +
    'Use theme.text for all slide text, theme.bg for background. Preview updates immediately from slide fields.'
  );
}

function detectSlideFocus(
  userText: string,
  deck: Deck,
): { text: string; index: number } | null {
  const m = userText.match(/(?:slide|page|شريحة)\s*(\d+)/i);
  if (!m) return null;
  const idx = parseInt(m[1], 10) - 1;
  const slide = deck.slides[idx];
  if (!slide) return null;
  return {
    index: idx,
    text: `User is focused on slide ${idx + 1} (id: ${slide.id}, title: "${slide.title}"). Apply changes to this slide unless they specify others.`,
  };
}

export function buildUserMessage(
  userText: string,
  existingDeck: Deck | null,
  options?: SlideAiUserMessageOptions,
): string {
  const forceNew = Boolean(options?.forceNewDeck);
  const deckForPrompt = forceNew ? null : existingDeck;
  const themeHint = detectThemeContext(userText);
  const useBcc = userRequestsBccTemplate(userText);
  const templateBlock = useBcc
    ? '\n\nVisual override: BCC Senior Service Designer portfolio template.'
    : '\n\nDesign stack: Claude Design craft + ADGM Brand Book 2025 + McKinsey action titles (adgm-ppt-master skill).';
  const themeBlock = themeHint ? `\n\nTheme direction: ${themeHint}` : '';
  const contextBlock = options?.executiveBrief
    ? `\n\n${options.executiveBrief}\n\nApply Claude Design + ADGM craft to this context. Ground metrics in handles above; label inference.`
    : '';

  const focus = deckForPrompt ? detectSlideFocus(userText, deckForPrompt) : null;
  const focusBlock = focus ? `\n\n${focus.text}` : '';
  const colorHint = detectColorRequest(userText);
  const colorBlock = colorHint ? `\n\n${colorHint}` : '';
  const userIntentBlock = `\n\nUSER REQUEST (authoritative — all slide copy must match this):\n"""${userText.trim()}"""`;

  if (!deckForPrompt) {
    return `Create a presentation: ${userText}${userIntentBlock}${templateBlock}${themeBlock}${contextBlock}

Rich prompts produce better decks. Include: topic, audience, tone, key facts/numbers, must-have slides.
Say "use Command Centre context" to ground slides in live KB, calendar, actions, and market data.
Do not copy a generic ADGM strategy template — every slide must be specific to the USER REQUEST above.`;
  }

  const slideIndex = focus?.index ?? 0;
  const slideMap = deckForPrompt.slides
    .map((s, i) => compactSlideLine(s, i, i === slideIndex))
    .join('\n');

  const rebuildHint = forceNew
    ? '\n\nUser requested a NEW deck — return action "create" with a full new deck (do not patch the slide map).'
    : '';

  return `Current deck (${deckForPrompt.slides.length} slides): "${deckForPrompt.title}"

Slide map (use these ids in updatedSlides):
${slideMap}

User request: ${userText}${userIntentBlock}${templateBlock}${themeBlock}${contextBlock}${focusBlock}${colorBlock}${rebuildHint}

Return action "update" with updatedSlides for any slide edits. Match slide ids exactly.
If the user requests any slide change, you MUST return updatedSlides or a full deck — never action "message" alone.`;
}

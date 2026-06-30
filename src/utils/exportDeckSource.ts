import { EXECUTIVE_USER } from '../config/user';
import { ADGM_BRAND } from '../config/brand';
import { ADGM_PPT_FOOTER } from '../config/adgmBrandForDeck';
import { SOURCE_EXPLANATION_SLIDE } from '../data/intelLaymanCopy';

type DeckMessage = {
  role: string;
  content: string;
};

type DeckConversation = {
  title: string;
  updatedAt: string;
  messages: DeckMessage[];
};

export function buildDeckSourceMarkdown(
  conversation: DeckConversation | null,
  extraNotes = '',
): string {
  const lines: string[] = [
    `# Apparel Group Command Centre — deck source`,
    ``,
    `**Executive:** ${EXECUTIVE_USER.fullName} · ${EXECUTIVE_USER.title}`,
    `**Organisation:** ${EXECUTIVE_USER.orgShort}`,
    `**Exported:** ${new Date().toISOString()}`,
    ``,
    `> Brand: Apparel Group ${ADGM_BRAND.version} — see src/config/apparelGroupGuidelines.ts`,
    ``,
  ];

  if (extraNotes.trim()) {
    lines.push(`## Briefing intent`, extraNotes.trim(), ``);
  }

  if (!conversation?.messages?.length) {
    lines.push(`## Content`, `_No conversation selected — add notes above or export from chat after a reply._`, ``);
    return lines.join('\n');
  }

  lines.push(`## Thread: ${conversation.title}`, `_Updated ${conversation.updatedAt}_`, ``);

  for (const m of conversation.messages) {
    const label = m.role === 'user' ? 'CEO question' : 'Personal AI answer';
    lines.push(`### ${label}`, '', m.content.trim(), '');
  }

  lines.push(SOURCE_EXPLANATION_SLIDE.en, ``);

  lines.push(
    `## Deck instructions (for PPT Master)`,
    `- Format: PowerPoint 16:9`,
    `- Brand: Apparel Group — navy ${ADGM_BRAND.navy.DEFAULT}, lime ${ADGM_BRAND.primary.clearsky}, Gotham, tagline "${ADGM_BRAND.tagline}"`,
    `- Footer: ${ADGM_PPT_FOOTER}`,
    `- Audience: ${EXECUTIVE_USER.fullName}, CEO, Apparel Group`,
    `- Include: title, 3–5 insight slides, one data-sources slide (above), one comparison or metrics table, closing "Do this" slide`,
    `- Cite source handles where used (KB-, ACT-, CAL-, MKT-)`,
    ``,
  );

  return lines.join('\n');
}

export function downloadDeckSourceMarkdown(markdown: string, filename = 'apparel-group-deck-source.md') {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const PPT_MASTER_CURSOR_PROMPT = `Read tools/claude-design-ai/DESIGN-FOR-DECKS.md (Claude Design deck craft).
Read tools/ppt-master/skills/ppt-master/SKILL.md (run npm run ppt-master:setup first if missing).

Create a native editable PowerPoint from the exported deck-source.md.

Design: Apparel Group Brand ${ADGM_BRAND.version} — navy ${ADGM_BRAND.navy.DEFAULT}, lime ${ADGM_BRAND.primary.clearsky}, Gotham, McKinsey action titles, 16:9.
Read src/config/apparelGroupGuidelines.ts before generating.
Audience: ${EXECUTIVE_USER.fullName}, CEO, Apparel Group.
Confirm the eight design spec items with me, then run the full PPT Master pipeline.`;

export const CLAUDE_DESIGN_CURSOR_PROMPT = `Read tools/claude-design-ai/DESIGN-FOR-DECKS.md.
Read .cursor/skills/adgm-claude-design-ppt/SKILL.md.

Polish or rebuild the Apparel Group board deck from the exported Markdown deck-source.md.

Apply Claude Design + McKinsey rules: action titles, MECE, exhibit panels, KPI layouts.
Deliver .pptx (PPT Master) or HTML deck per the skill workflow.`;

export const UNIFIED_PPT_CURSOR_PROMPT = `You are building an outstanding, board-ready Apparel Group executive deck. Apply ALL shared skills together.

## 0 — Brand (MANDATORY — read first)
src/config/apparelGroupGuidelines.ts
src/config/adgmBrandForDeck.ts · Apparel Group Brand ${ADGM_BRAND.version}

## 1 — Master contract
tools/adgm-deck-craft/MASTER.md

## 2 — Skill stack
- McKinsey: action titles, MECE, hypothesis-led storyline (every title = full insight sentence)
- Claude Design: tools/claude-design-ai/DESIGN-FOR-DECKS.md
- PPT Master (native .pptx): tools/ppt-master/skills/ppt-master/SKILL.md (npm run ppt-master:setup)

## 3 — Source
Use the deck Markdown from this Presentation Builder export.

## 4 — Wow bar (non-negotiable)
- Apparel Group Brand: navy ${ADGM_BRAND.navy.DEFAULT}, lime ${ADGM_BRAND.primary.clearsky}, Gotham, tagline "${ADGM_BRAND.tagline}"
- Premium navy hero title + ink accent beam
- KPI slides: large numerics, accent-soft cards
- Insight slides: exhibit panel for charts
- Max 4 bullets × 12 words; footer "${ADGM_PPT_FOOTER}"
- Speaker notes: 60–90s executive talk track per slide

## 5 — Deliver
Best path: Perceptis API (PERCEPTIS_API_KEY in .env.local) for native McKinsey-grade .pptx, OR regenerate premium HTML AND/OR native .pptx via PPT Master.
Use server/apparelGroupPptPrompt.mjs for the full board-ready strategy brief.
Confirm storyline with user, then execute. Audience: ${EXECUTIVE_USER.fullName}, CEO, Apparel Group.`;

import { EXECUTIVE_USER } from '../config/user';
import { ADGM_BRAND } from '../config/brand';
import { ADGM_PPT_FOOTER } from '../config/adgmBrandForDeck';

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
    `# ADGM Command Centre — deck source`,
    ``,
    `**Executive:** ${EXECUTIVE_USER.fullName} · ${EXECUTIVE_USER.title}`,
    `**Organisation:** ${EXECUTIVE_USER.orgShort}`,
    `**Exported:** ${new Date().toISOString()}`,
    ``,
    `> Brand: ADGM Brand Book ${ADGM_BRAND.version} — see docs/brand-2025/PPT-BRAND-RULES.md`,
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
    const label = m.role === 'user' ? 'CSO question' : 'Personal AI answer';
    lines.push(`### ${label}`, '', m.content.trim(), '');
  }

  lines.push(
    `## Deck instructions (for PPT Master)`,
    `- Format: PowerPoint 16:9`,
    `- Brand: ADGM Brand Book ${ADGM_BRAND.version} — Clearsky ${ADGM_BRAND.primary.clearsky}, navy ${ADGM_BRAND.navy.DEFAULT}, Gilroy/Aptos, tagline "${ADGM_BRAND.tagline}"`,
    `- Footer: ${ADGM_PPT_FOOTER}`,
    `- Audience: ${EXECUTIVE_USER.fullName}, CSO`,
    `- Include: title, 3–5 insight slides, one comparison or metrics table, closing "Do this" slide`,
    `- Cite source handles where used (KB-, ACT-, CAL-, MKT-)`,
    ``,
  );

  return lines.join('\n');
}

export function downloadDeckSourceMarkdown(markdown: string, filename = 'adgm-deck-source.md') {
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

Create a native editable PowerPoint from:
tools/ppt-master-adgm/projects/adgm-command-centre/sources/deck-source.md

Design: ADGM Brand Book ${ADGM_BRAND.version} — navy ${ADGM_BRAND.navy.DEFAULT}, Clearsky ${ADGM_BRAND.primary.clearsky}, Gilroy/Aptos, McKinsey action titles, 16:9.
Read docs/brand-2025/PPT-BRAND-RULES.md before generating.
Audience: ${EXECUTIVE_USER.fullName}, Chief Strategy Officer, ADGM.
Confirm the eight design spec items with me, then run the full PPT Master pipeline.`;

export const CLAUDE_DESIGN_CURSOR_PROMPT = `Read tools/claude-design-ai/DESIGN-FOR-DECKS.md.
Read .cursor/skills/adgm-claude-design-ppt/SKILL.md.

Polish or rebuild the ADGM board deck from the exported Markdown at:
tools/ppt-master-adgm/projects/adgm-command-centre/sources/deck-source.md

Apply Claude Design + McKinsey rules: action titles, MECE, exhibit panels, KPI layouts.
Deliver .pptx (PPT Master) or HTML deck per the skill workflow.`;

/** All shared PPT skills in one agent run — preferred for wow / outstanding decks */
export const UNIFIED_PPT_CURSOR_PROMPT = `You are building an outstanding, board-ready ADGM executive deck. Apply ALL shared skills together.

## 0 — Brand (MANDATORY — read first)
docs/brand-2025/PPT-BRAND-RULES.md
src/config/adgmBrandForDeck.ts · ADGM Brand Book ${ADGM_BRAND.version}

## 1 — Master contract
tools/adgm-deck-craft/MASTER.md

## 2 — Skill stack
- McKinsey: action titles, MECE, hypothesis-led storyline (every title = full insight sentence)
- Open Design: run npm run open-design:setup if needed → read tools/open-design/design-templates/html-ppt/SKILL.md and deck-swiss-international
- Claude Design: tools/claude-design-ai/DESIGN-FOR-DECKS.md
- PPT Master (native .pptx): tools/ppt-master/skills/ppt-master/SKILL.md (npm run ppt-master:setup)

## 3 — Cursor skill
.cursor/skills/adgm-ppt-master/SKILL.md

## 4 — Source
Use the deck Markdown from this Presentation Builder export (or tools/ppt-master-adgm/projects/adgm-command-centre/sources/deck-source.md).

## 5 — Wow bar (non-negotiable)
- ADGM Brand Book ${ADGM_BRAND.version}: Clearsky ${ADGM_BRAND.primary.clearsky}, navy ${ADGM_BRAND.navy.DEFAULT}, Gilroy/Aptos, tagline "${ADGM_BRAND.tagline}"
- Premium navy hero title + Clearsky accent beam
- KPI slides: large numerics, accent-soft cards
- Insight slides: exhibit panel for charts
- Max 4 bullets × 12 words; footer "${ADGM_PPT_FOOTER}"
- Speaker notes: 60–90s executive talk track per slide

## 6 — Deliver
Best path: regenerate premium HTML (html-ppt + ADGM tokens) AND/OR native .pptx via PPT Master.
Confirm storyline with user, then execute. Audience: ${EXECUTIVE_USER.fullName}, CSO, ADGM.`;

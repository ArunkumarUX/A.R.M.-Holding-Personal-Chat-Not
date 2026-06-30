/**
 * Apparel Group board-ready deck prompt — shared with server (apparelGroupPptPrompt.mjs).
 * @see server/apparelGroupPptPrompt.mjs
 */

const APPAREL_CONTEXT = `Organisation: Apparel Group — 14 countries, 85+ brands, 2,500+ stores, 27,000+ team members.
Portfolio: R&B Fashion, 6thStreet, Club Apparel, Nysaa + international brands.
CEO: Neeraj Teckchandani. Brand: Navy #003399, Lime #C5D92D, Gotham, "Exceed Expectations Everyday".`;

export type ApparelPptPromptFields = {
  topic?: string;
  coreQuestion?: string;
  decision?: string;
  inputs?: string;
  slideCount?: number;
};

export function buildApparelGroupPptPrompt(fields: ApparelPptPromptFields = {}): string {
  const {
    topic = '[INSERT TOPIC]',
    coreQuestion = '[INSERT THE SINGLE MOST IMPORTANT QUESTION THIS PRESENTATION MUST ANSWER]',
    decision = '[INSERT THE EXACT DECISION, APPROVAL OR ACTION REQUIRED]',
    inputs = '[INSERT REPORTS, DATA, DOCUMENTS, LINKS, PERFORMANCE METRICS, RESEARCH OR NOTES]',
    slideCount = 14,
  } = fields;

  return `Create a world-class, board-ready strategy presentation for Apparel Group (McKinsey / BCG / Bain standard).

CONTEXT: ${APPAREL_CONTEXT}
Topic: ${topic}
Core question: ${coreQuestion}
Required decision: ${decision}
Inputs: ${inputs}

MANDATORY: Pyramid Principle + SCQA · recommendation in first 3 slides · action titles (conclusions, not labels) · MECE · 12–18 core slides (${slideCount} target) · three strategic options with weighted matrix · financial impact (base/upside/downside) · phased roadmap · governance · risks · final decision slide · speaker notes · sources · fully editable output.

STRUCTURE: Cover → Executive recommendation → Key findings → Why now → Current state → Market insight → Portfolio analysis → Performance diagnosis → Root causes → Strategic options → Evaluation → Recommended strategy → Business impact → Future operating model → Roadmap → Governance → Risks → Decisions required → Appendix.

DESIGN: Apparel Group navy/lime, Gotham, premium minimal executive layout. No marketing brochure or decorative filler.

QUALITY GATE: CEO understands recommendation in 3 minutes; every slide has action title + evidence + so what; Apparel Group-specific; board-ready.`;
}

/** Appended to SlideAI system prompt for alignment with Perceptis generation. */
export const APPAREL_GROUP_PPT_STANDARD = buildApparelGroupPptPrompt({
  topic: '[User topic from latest message]',
  coreQuestion: '[Derived from user request]',
  decision: '[CEO / board approval required]',
  inputs: '[Command Centre context + user notes]',
});

export const PERCEPTIS_DECK_HINT =
  'For native .pptx export, use Perceptis API (server action perceptis-deck) with the full Apparel Group strategy prompt.';

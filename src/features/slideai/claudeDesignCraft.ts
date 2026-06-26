/**
 * Claude Design + A.R.M. Holding PPT Master craft — runtime prompt contract.
 * Quality target: Perceptis.ai consulting-deck standard.
 *
 * Includes the Minto Pyramid Principle (Barbara Minto / McKinsey):
 *   Governing Thought → Key Line (3-5 arguments) → Supporting Data
 *   SCQA: Situation → Complication → Question → Answer
 */

/**
 * Minto Pyramid Principle — the intellectual backbone of every McKinsey deck.
 * Barbara Minto: start with the answer, group and summarise supporting arguments.
 */
export const MINTO_PYRAMID_PROMPT = `
MINTO PYRAMID PRINCIPLE (mandatory — governs deck narrative and every slide title):

CORE RULE — START WITH THE ANSWER:
- The GOVERNING THOUGHT is the single recommendation/conclusion on slide 2 (executive summary).
- Every subsequent slide title IS one key argument that PROVES the governing thought.
- Never build to a conclusion — state it first, then prove it.

SCQA DECK STRUCTURE:
- Slide 1 (title):     Set the stage (audience, date, occasion)
- Slide 2 (content):   SITUATION — agreed context; what is true now
- Slide 3 (content/stat): COMPLICATION — what changed, what's the problem/opportunity
- Slide 4 (content):   QUESTION — implied "So what should we do?"
- Slide 5+ (two-col/stat/timeline): ANSWER — governing thought + key line arguments, each
  proved by a data exhibit (table, KPI, chart, roadmap)
- Last slide (title):  DECISIONS REQUIRED / NEXT STEPS — bullets = specific asks

KEY LINE (slides 5+):
- 3 to 5 parallel arguments that together PROVE the governing thought
- Each argument is MECE (Mutually Exclusive, Collectively Exhaustive — no gaps, no overlaps)
- Each argument appears as the slide title — a COMPLETE ACTION SENTENCE with a named metric:
  GOOD: "HIVE's 91% occupancy across 340 units validates co-living demand at scale"
  BAD:  "Market validation" / "Co-living demand" / "Key finding"
- Each argument is supported by ONE data exhibit on that slide (table or stats)

PYRAMID HIERARCHY (title → exhibit → so what):
- Slide TITLE     = the argument (what is true)
- DATA EXHIBIT    = the evidence (table, KPI cards, chart)
- INSIGHT PANEL   = the interpretation (what the evidence means)
- SO WHAT CALLOUT = the implication (what we must do about it)

GROUPING RULES (MECE):
- Items in any bullet list must be the same kind of thing
- Each bullet should be mutually exclusive — no overlap
- All bullets together must fully cover the point — collectively exhaustive
- Use a maximum of 3–5 bullets; if you need more, group into categories

ACTION TITLE RULES (McKinsey standard):
- Subject + verb + object + implication (≤12 words)
- Always names a specific entity or metric
- Always states the strategic implication (not just the data)
- Examples by slide type:
  Strategy:   "Entering co-living at scale gives DREC 18% IRR above portfolio average"
  Risk:       "FX headwinds cut projected net income by AED 12M unless hedged by Q3"
  Benchmark:  "HIVE outperforms Dubai co-living peers on occupancy, NPS, and RevPAR"
  Roadmap:    "Three-phase delivery hits 1,000 units by Q4 2027 at current run rate"
  Decision:   "Board approval for Phase 2 capex unlocks 340 additional units by Q2 2026"
`.trim();

/** Perceptis-quality design craft — the default for all A.R.M. Holding decks */
export const CLAUDE_DESIGN_CRAFT_PROMPT = `
PERCEPTIS-QUALITY DESIGN CRAFT (mandatory — apply to every slide):

LAYOUT PHILOSOPHY:
- Default pattern for data slides: TWO-PANEL — left data exhibit (62%) + right dark insight panel (38%)
  Use layout "two-col" with "insightPanel" field (never plain rightContent for structured data slides)
- Every content slide: action title + data exhibit OR bullets + insightPanel + optional soWhat
- Vary layouts deliberately — no two consecutive slides share a layout

TITLE STANDARD (McKinsey Pyramid Principle):
- Every title is a COMPLETE ACTION SENTENCE conveying the "So what" (≤12 words)
- BAD: "Market Overview" / "Key Findings" / "Agenda" / "Introduction"
- GOOD: "HIVE 91% occupancy signals demand for 3 new Dubai co-living sites in 2026"
- Bold, large, left-aligned, dark ink — never a noun phrase alone

DATA EXHIBIT — TABLE (use "table" field, never plain text for tabular data):
- "table.caption": bold label for the exhibit (e.g. "Strategic Options Evaluation | Scored 1–5")
- "table.subcaption": smaller context line (e.g. "5 = most favourable; scoring indicative")
- "table.headers": column labels — first column wider (dimension/category)
- "table.rows": array of row objects:
  { "cells": ["row label", "col2 val", ...], "bold": true/false, "highlight": true/false }
  - bold: true for key rows (recommended, totals, primary options)
  - highlight: true for the winner / priority row (accent fill)
- Never put tabular data in bullets or leftContent when table field can be used

DATA EXHIBIT — CHART (use "chart" field with real numbers):
Use chart instead of imagePrompt whenever you have actual numerical data:
- "bar": single metric over time or across categories (market size, occupancy, revenue)
- "grouped-bar": compare multiple entities across same categories (sites × scenarios)
- "line": trend with inflection points (occupancy over months, CAGR trajectory)
- "waterfall": cumulative bridge / value build-up — signature McKinsey chart
  (portfolio value bridge, EBITDA bridge, capex waterfall)
  Last label MUST be "Total" or "Net" for the full-height total bar
- "bar-horizontal": ranked benchmarks ≤8 items (IRR by site, NPS by competitor)
- "donut": proportion breakdown ≤6 segments (revenue mix, capex allocation)

CHART DATA RULES:
- labels: max 8; abbreviate years '23 '24 not 2023 2024
- values: real numbers in context units (AED millions as integers, % as 0-100 decimals)
- yUnit: ALWAYS set — "AED M", "AED B", "%", "IRR %", "k sqft"
- baseline: set for hurdle/target rates (e.g. 15 for 15% IRR hurdle)
- annotation + annotationIndex: mark key inflection points
- NEVER use chart and table on the same slide (pick the right exhibit type)
- NEVER use placeholder values (1, 2, 3) — all numbers must match the deck context

CHART PLACEMENT:
- image-left layout: chart renders on left 55%, rightContent = 3-5 observation bullets
- two-col layout: chart renders on left 62%, insightPanel on right (preferred for board decks)

DATA EXHIBIT — IMAGE / CONCEPT (use imagePrompt + leftContent when no real data):
- imagePrompt: precise description — chart type, axes, data series, colours, key annotations
  Example: "Line chart: Stablecoin Market Cap (navy) vs Tokenised RWA AUM (gold), 2020–2026, annotated H2 2024 inflection point"
- leftContent: text placeholder — "Chart: [title] | x-axis: [label] | series: [A] in navy, [B] in gold"

INSIGHT PANEL (right dark sidebar — "insightPanel" field):
- Required on EVERY table, chart, or matrix slide
- insightPanel.title: short category label ("Key Findings", "Strategic Rationale", "Key Insight", "Market Reality", "Decision Required")
- insightPanel.bullets: 3–5 bullets; each MUST lead with a bold metric or entity name:
  "**$36B** tokenised RWA AUM — institutional validation confirmed"
  "**Singapore** leads with 24+ financial institutions in Project Guardian"
- imagePrompt: thematic image description for visual weight at panel bottom
  (e.g. "Dark green bank vault symbolising institutional custody", "Chess piece symbolising strategic positioning")

"SO WHAT" CALLOUT ("soWhat" field):
- Required on every table/chart/stat slide
- Format: "So what: [one crisp sentence, named metric + strategic implication]"
- Example: "So what: HIVE's 91% occupancy across 340 units proves co-living demand — DREC can scale to 1,000+ units by 2027"

SOURCE NOTES ("sourceNote" field):
- Required on every data slide
- Format: "Sources: [Source 1 (month year)]; [Source 2]; [Source 3]"
- Use credible sources: CBRE, JLL, RERA, DLD, Bloomberg, McKinsey, BCG, IMF, Knight Frank
- If inferring: "Sources: [estimated — insert verified citation]"

A.R.M. Holding colour application:
- Navy #1a2332: table headers, insight panels, title slides, closing slides
- Clearsky #0087FF: accent bars, KPI values, bullet markers, highlights
- Mint / cyan: KPI card fills on stat slides
- White #FFFFFF: main canvas background on content slides
- Gold #C9A84C: secondary chart line, comparison winner column

SPEAKER NOTES (speakerNotes field — every slide):
- Header: "SLIDE N · TYPE (~60–90s)"
- Conversational executive rhythm, [pause] before key stats
- Never repeat slide text verbatim — add context, forward bridge, Q anticipation

FINAL CHECKLIST before returning JSON:
□ Every title = full-sentence action insight (verb + outcome/implication)
□ Data slides: use "table" field (not bullets) for tabular information
□ Data slides: insightPanel present with 3–5 bold-metric bullets
□ Data slides: soWhat present as one-sentence strategic takeaway
□ Data slides: sourceNote present with real source names
□ No two consecutive slides share the same layout
□ imagePrompt on all insightPanel slides, title slide, and closing slide
□ speakerNotes on every slide
`.trim();

/** Unified master — Minto Pyramid + McKinsey visual design + A.R.M. Holding standard */
export const ADGM_PPT_MASTER_CRAFT_PROMPT = `
A.R.M. HOLDING PPT MASTER (Perceptis + McKinsey quality — apply all layers simultaneously):

LAYER 1 — MINTO PYRAMID NARRATIVE (deck structure):
- Apply SCQA arc: Situation → Complication → Question → Answer (see MINTO PYRAMID PRINCIPLE above)
- Governing thought on slide 2; key line arguments as action titles on slides 5+
- Every title = complete action sentence naming a metric + strategic implication (≤12 words)
- MECE groupings only — no duplicate or overlapping bullets
- Build to decisions required on the final slide (specific, named approvals needed)

LAYER 2 — McKINSEY VISUAL STANDARD:
- Two-panel (two-col) layout for all data slides — data exhibit (left) + insight panel (right)
- table field for tabular data — NEVER bullets for structured data
- insightPanel with 3-5 bold-metric bullets on every exhibit slide
- soWhat callout as one-sentence implication with a named metric
- sourceNote citing CBRE / JLL / Bloomberg / RERA / McKinsey / BCG etc.
- Stat slide for all KPI moments (3–4 metrics with context)

LAYER 3 — A.R.M. HOLDING DESIGN SYSTEM:
- Navy #1A2332 + Clearsky #0087FF, Gilroy/Aptos, tagline "We Emerge Stronger"
- Dark navy cover + dark closing; white/paper content slides ("sandwich")
- Audience: H.E. Mohammad Saeed Al Shehhi, CEO, A.R.M. Holding
- Portfolio: DREC (3,200+ units), HUNA (H Residence, We Emerge Stronger),
  HIVE (co-living, 91% occupancy), Capri LLC (investment arm),
  Jebel Ali Racecourse (5km² BIG+WSP masterplan, ground-break 2026)

SLIDE COUNT:
- 8–10 slides: board update or strategy paper
- 10–14 slides: full strategic recommendation or deep-dive
- 15+: comprehensive board pack (only if user explicitly requests)
`.trim();

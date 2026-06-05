# ADGM Personal AI — Agent Behaviours & Answer Formats

**Document purpose:** Stakeholder reference for how the five AI specialists behave, how they are selected for a question, and what structure answers follow.  
**Product:** ADGM Command Centre / Personal AI (Chief Strategy Office prototype)  
**Audience:** ADGM leadership, programme sponsors, architecture reviewers  
**Version:** June 2026 — aligned with **CSO Personal AI Assistant: Agent Prompt Pack & Response Standards** (implemented in `server/csoPromptPack.mjs`, `server/answerFormatRules.mjs`, `server/chatCore.mjs`).

---

## 1. Executive summary

The Personal AI platform uses **five specialist agents** coordinated by a **Chief of Staff orchestrator**. Stakeholders see **one unified answer** in the chat — not five separate conversations. Agent chips in the UI show **which specialists contributed** to that answer.

Answers are grounded in demo institutional data: calendar, action register, knowledge base, market snapshot, and department metrics. When the Claude API is enabled, responses are generated live; otherwise the same structures are delivered from curated demo scripts.

**Every factual claim is tied to a cited source and validated against the data actually supplied to the model.** The platform is built to *abstain* — to say "no source available" — rather than invent. How that is enforced, not merely asserted, is set out in §6.

---

## 2. How orchestration works

| Concept | Behaviour |
|--------|-----------|
| **Unified reply** | Multiple agents may be active, but the executive receives a single markdown message. |
| **Agent chips** | UI highlights participating agents (e.g. Policy + Strategy) while the answer streams. A chip is shown only when that specialist's instruction block was actually placed in the prompt — see §6.4. |
| **Smart routing** | Default: system picks agents from the question topic (focus area), which in turn selects the specialist blocks **and the data slices** loaded into the call. Can be turned off in Settings for manual selection. |
| **Explicit invoke** | User can target one agent with `@policy`, `@strategy`, `@cos`, `@crm`, or `@comms` in the question. |
| **Grounding & sources** | Answers show a **grounding indicator** (full / partial / inferred) and resolve cited source handles to knowledge-base documents. This replaces the earlier model-reported confidence score — see §6. |
| **Follow-ups** | Chat answers end with 2–3 suggested next questions; briefing documents do not. |

**Typical flow**

1. Executive asks a question (or selects a briefing format).  
2. System routes to one or more agents **and assembles the matching context** (calendar, CRM/actions, KB, market slices).  
3. Agents draw on that injected context (demo data in prototype), each record carrying a source handle.  
4. Orchestrator synthesises one executive-grade markdown response, citing handles for every factual claim.  
5. UI shows agents used, the grounding indicator, and source links; high-stakes answers pass a verification step first (§6.5).

---

## 3. The five agents — roles & behaviour

### 3.1 Chief of Staff AI (Agent 01)

| Field | Detail |
|-------|--------|
| **Role** | Orchestrator — operational cadence of the executive office |
| **Tagline** | Routes tasks, synthesises outputs, tracks commitments |
| **Primary tools** | Calendar, action register, briefings |
| **Focus areas** | Meetings, stakeholders, knowledge |
| **Integrations (target)** | Microsoft Graph, CRM register, SharePoint |

**Behaviour**

- Owns meeting timing, prep status, and what the CSO must decide.  
- Surfaces open and overdue actions from the action register.  
- Assembles board-pack style summaries and morning-briefing orchestration.  
- Often included automatically when other agents run (unless already in the agent set).

**Does not typically own**

- Deep regulatory comparison tables (Policy AI).  
- Long competitor market essays without operational hook (Strategy AI).  
- Full bilingual ministerial drafts (Communications AI).

---

### 3.2 Strategy AI (Agent 02)

| Field | Detail |
|-------|--------|
| **Role** | Market intelligence |
| **Tagline** | Falcon Economy, competitors, geopolitical and sector signals |
| **Primary tools** | Bloomberg feed, Falcon Economy scorecard, competitor radar |
| **Focus areas** | Strategic intelligence, knowledge |
| **Integrations (target)** | Bloomberg / Refinitiv, regulatory feeds, knowledge base |

**Behaviour**

- Daily and on-demand intelligence: GCC markets, sector flows, competitor moves (DIFC, MAS, Hong Kong, Luxembourg).  
- Scores opportunities against **Falcon Economy** and Abu Dhabi economic priorities (not Dubai D33), citing the scorecard datapoint behind each score.  
- Produces competitor benchmark tables (multi-dimension scoring) sourced to a named benchmark document.  
- Connects market signals to CSO implications and timing (“why now”), with the read marked as analysis (§6.3).

**Does not typically own**

- CRM relationship warmth and meeting history (Relationship AI).  
- FSRA legal framework drafting (Policy AI).  
- Formal Arabic correspondence (Communications AI).

---

### 3.3 Policy AI (Agent 03)

| Field | Detail |
|-------|--------|
| **Role** | Regulatory |
| **Tagline** | FSRA frameworks, MAS/FCA benchmarks, consultation drafts |
| **Primary tools** | Regulatory monitor, policy KB, impact memos |
| **Focus areas** | Regulatory, knowledge |
| **Integrations (target)** | Regulatory RSS/APIs, FSRA SharePoint |

**Behaviour**

- Monitors global regulation relevant to ADGM (12 jurisdictions in target state).  
- Compares ADGM/FSRA position vs international benchmarks (e.g. MAS digital assets), citing the source for each jurisdiction claim.  
- Drafts and assesses policy consultations and impact memos.  
- Ties recommendations to dates in the action register when applicable.

**Does not typically own**

- Stakeholder relationship narratives (Relationship AI).  
- Generic market commentary without regulatory hook (Strategy AI).

---

### 3.4 Relationship AI (Agent 04)

| Field | Detail |
|-------|--------|
| **Role** | Stakeholders (institutional CRM) |
| **Tagline** | CRM, partnerships, pre-meeting stakeholder profiles |
| **Primary tools** | Executive CRM, commitment tracker, partnership map |
| **Focus areas** | Stakeholders, meetings |
| **Integrations (target)** | CRM sync, LinkedIn, Microsoft Graph |

**Behaviour**

- Living stakeholder profiles: relationship warmth, last touchpoints, sensitivities — each drawn from a CRM record.  
- Open commitments and follow-ups before/after meetings.  
- Partnership pipeline and network mapping across ADGM.  
- Pre-meeting “who” and “their likely agenda” alongside CoS; a likely-agenda inference with no source is marked as inferred.

**Does not typically own**

- Full regulatory benchmark matrices (Policy AI).  
- Falcon Economy sector ranking lists without stakeholder angle (Strategy AI).

---

### 3.5 Communications AI (Agent 05)

| Field | Detail |
|-------|--------|
| **Role** | Executive voice |
| **Tagline** | Arabic/English speeches, ministerial notes, talking points |
| **Primary tools** | Voice learning, bilingual drafts, tone review |
| **Focus areas** | Communications, meetings |
| **Integrations (target)** | Microsoft Graph email, KB, style loop |

**Behaviour**

- Drafts speeches, talking points, and executive correspondence.  
- **Bilingual** Arabic and English with formal ministerial register.  
- Summarises and prioritises inbound correspondence.  
- Applies CSO voice learning from approved prior notes. Any metric quoted in a draft carries a source handle; ministerial output always runs the verification pass (§6.5).

**Does not typically own**

- Dense regulatory comparison tables (Policy AI).  
- Raw action-register dumps without narrative framing (CoS).

---

## 4. When each agent is selected (routing)

Routing in a single-call architecture does not gate separate models. It selects **which specialist instruction blocks** and **which data slices** are assembled into the one call. Treat it as context assembly, not agent dispatch.

### 4.1 Priority order

1. **@mentions** in the question (e.g. `@policy Compare MAS stablecoin rules`).  
2. **Manual agent selection** (Settings → Smart routing off).  
3. **Focus-area match** from keywords / example prompts (see table below).  
4. **Chief of Staff prepended** to focus-area agents if CoS not already listed.  
5. **Default fallback:** Chief of Staff + Strategy + Policy.

### 4.2 Focus area → agents

| Focus area | Agents activated |
|------------|------------------|
| Strategic intelligence & briefings | Strategy, Policy |
| Meetings & agenda preparation | Chief of Staff, Relationship, Communications |
| Regulatory & policy intelligence | Policy, Strategy |
| Correspondence & communications | Communications, Chief of Staff |
| Stakeholder & relationship management | Relationship, Chief of Staff |
| Knowledge management | Policy, Strategy, Chief of Staff |

### 4.3 Example starter prompts → agents shown

| Example question | Agents shown on answer |
|------------------|------------------------|
| Compare ADGM digital assets framework vs Singapore MAS | Strategy, Policy |
| ADGM 2024 strategic decisions vs Falcon Economy | Strategy, Chief of Staff |
| Brief me on my 3pm meeting tomorrow | Chief of Staff, Relationship |
| Top investment opportunities for Abu Dhabi | Strategy |
| Draft HH office note on Q2 performance in Arabic | Communications |

---

## 5. Answer formats (what stakeholders should expect)

### 5.1 General chat answers

| Element | Format |
|---------|--------|
| **Language** | Executive English by default; Modern Standard Arabic when user writes in Arabic or requests AR output |
| **Structure** | Markdown: `##` headings, bullet lists, tables where useful |
| **Tone** | Decision-ready, specific to ADGM, Abu Dhabi, and Falcon Economy |
| **Persona framing** | At the start of a turn, the user may also say: *"You are a senior McKinsey strategy manager."* That line sets consulting-grade structure (hypothesis-led, MECE, recommendation-first) for that answer. The default system prompt already includes this persona; saying it in the question reinforces tone without replacing ADGM grounding (§6). |
| **Grounding** | Every factual claim cites a **source handle** (`KB-`, `CAL-`, `ACT-`, `CRM-`, `MKT-`) that is validated against the data injected into the call. The model's own interpretation is marked as **analysis**, never stated as fact. Full contract in §6. |
| **Closing** | 2–3 short follow-up prompts the CSO might ask next |
| **UI metadata** | Agent chips (a chip means the specialist block was in the prompt), a **grounding indicator** (full / partial / inferred) derived from source coverage, and source links that resolve to cited handles. No model-generated confidence percentage is shown. |

**Live AI (Claude):** One synthesised answer coordinating all active specialist perspectives, subject to the grounding contract in §6.  
**Demo mode:** Same topics use scripted templates matching the structures below; demo records carry the same handles so citations resolve.

**Optional opening line (user or prompt)**

You could also say at the beginning of the question:

> You are a senior McKinsey strategy manager.

Use this when you want sharper strategic framing—situation → insight → recommendation—while still requiring cited facts from injected ADGM data (§6). Example:

> You are a senior McKinsey strategy manager. Compare ADGM digital-assets positioning vs MAS and give me one decision for the CSO this week.

---

### 5.2 Agent-specific content patterns

Use these as the **expected sections** inside a unified answer. In a single-call system these are **enforced structural requirements**, not suggestions — they are the forcing function that stops one call from producing generic, unsourced prose. If a specialist is active, its required artefact (e.g. the Policy benchmark table, the Strategy scores) must be present and sourced.

#### Chief of Staff AI

- Meeting: **when, where, prep status** `[CAL-…]`  
- **Attendees** and decision required from CSO  
- **Open / overdue actions** (owner, due date, status) `[ACT-…]`  
- **Recommended next steps** (numbered, 1–3 items) — marked as analysis

#### Strategy AI

- **Market & competitor context** (GCC, sectors, named centres) `[MKT-…]`  
- **Falcon Economy alignment** or opportunity scores, each citing the scorecard datapoint  
- **Strategic read** — one clear implication for the CSO, marked as analysis  
- Tables: competitor comparison or ranked opportunities, sourced to a benchmark document

#### Policy AI

- **ADGM / FSRA position** in plain language `[KB-…]`  
- **What changed** (consultation, guidance, jurisdiction)  
- **Benchmark table:** dimension × ADGM × comparator (e.g. MAS), sourced to a named benchmark doc with an "as of" date  
- **Recommended regulatory action** with date if in action register `[ACT-…]` — marked as analysis

#### Relationship AI

- **Relationship status** (warm / neutral / new) and last engagement `[CRM-…]`  
- **Their likely agenda** or interests — marked **inferred** where no source supports it  
- **Open commitments** (table or bullets) `[ACT-…]`  
- **Suggested next step** for the engagement — marked as analysis

#### Communications AI

- **Talking points** or correspondence intent (bullets)  
- **Bilingual blocks** when requested: **العربية** then **English** (formal honorifics)  
- Any **metric quoted** carries a source handle; tone note: ministerial / keynote / FSRA terminology review

---

## 6. Grounding & source integrity

This section is the contract that makes "truthful sources" mechanical rather than aspirational. A specification cannot stop a model from inventing a plausible-looking source; only enforcement can. Each rule below pairs a **model behaviour** (instructed in the system prompt) with a **system check** (run after generation). Read the enforcement column as the reason to trust the rule.

### 6.1 Source handles

Every record injected into a call carries a stable handle, its origin system, and a last-updated timestamp. The model may cite **only** handles that appear in the context it was given.

| Prefix | Source | Example |
|--------|--------|---------|
| `KB-` | Knowledge base document | `[KB-014]` |
| `ACT-` | Action register item | `[ACT-07]` |
| `CAL-` | Calendar event | `[CAL-1500]` |
| `CRM-` | Stakeholder record | `[CRM-emaar]` |
| `MKT-` | Market snapshot datapoint | `[MKT-2026-06-03]` |

### 6.2 The grounding contract

| # | Rule | Model behaviour | System enforcement |
|---|------|-----------------|--------------------|
| 1 | **Cite by handle** | Every factual claim about institutional data carries a source handle. | After generation, each cited handle is checked against the set actually injected; unknown handles are stripped and the claim flagged. |
| 2 | **Snippet-anchor strong claims** | For a number, date, or regulatory position, attach a short supporting snippet beside the handle. | The snippet is substring-matched against the source text; no match → claim marked **unverified**. |
| 3 | **Closed-book for facts** | Factual statements derive only from injected context. | The verification pass (§6.5) flags any factual sentence carrying no valid handle. |
| 4 | **Open-book for judgement** | The model's interpretation is permitted but labelled **analysis** — never stated as fact. | The answer format separates cited facts from the marked read (§6.3); unlabelled assertions are flagged. |
| 5 | **Licence to abstain** | "Not in the knowledge base / no source available" is a valid, encouraged answer. | Abstention is scored as a **correct** outcome in eval, not a failure; the prompt rewards it over a complete-looking guess. |
| 6 | **No fabricated specifics** | Numbers, names, dates, and clauses must trace to a source or be expressed qualitatively. | Any specific value with no handle is caught by the no-numeric-without-handle check and by §6.5. |
| 7 | **Freshness** | Market and time-sensitive claims state "as of [date]" taken from the record timestamp. | Records older than a configurable window are surfaced as **stale** rather than presented as current. |

### 6.3 Verified vs inferred (answer presentation)

The structure of the answer carries the honesty so the executive can see it at a glance:

- **Facts** are cited inline or gathered in a `Sources:` line.  
- The **strategic read** sits under a clearly marked heading (e.g. "Analysis (Policy AI)").  
- No confidence percentage is shown. A **grounding indicator** — `full` / `partial` / `inferred` — replaces it, derived from coverage: the share of factual claims carrying a valid handle.

### 6.4 Machine grounding block

Alongside the prose, the model emits a structured block — not shown to the executive — that the platform validates:

```yaml
agents_used: [policy, strategy]
sources_cited: [KB-014, KB-022, ACT-07]
grounding: partial            # full | partial | inferred
unverified_claims:
  - "MAS raised its stablecoin reserve ratio in Q1"   # no handle → flagged
```

- `sources_cited` is validated against the injected handles; invented entries are stripped.  
- `agents_used` drives the chips, so **a chip means a specialist block was genuinely in the prompt**, not a label applied afterward.  
- `unverified_claims` surfaces anything the verification pass could not support.

### 6.5 Verification pass (high-stakes)

For ministerial notes, anything bound for the HH office, or any answer marked `grounding: inferred` on a material decision, a second model pass takes the draft plus the injected sources and checks each factual claim for support. It returns a pass/flag list **before** the answer reaches the executive. In production this is paired with a human approval gate on ministerial output.

---

## 7. Six briefing document formats

Briefings are **structured documents** (not casual chat). Target read time: **under 2 minutes**. No generic closing prompts.

Briefings follow the same grounding contract (§6): every injected datapoint carries a handle and is cited inline. Because briefings omit closing prompts, the `Sources:` line and the grounding indicator are the only metadata shown.

| Briefing type | Typical agents | Required structure | Target time |
|---------------|----------------|-------------------|-------------|
| **Pre-meeting brief** | CoS, Relationship, Strategy | Who → Their likely agenda → Talking points → Watch-outs → Suggested ask | < 30 s |
| **Board pack summary** | CoS, Strategy | Decisions required → Falcon Economy alignment → Risks → One recommendation | < 60 s |
| **Stakeholder profile** | Relationship, CoS | Relationship & history → Focus areas → Open follow-ups → Next step | < 30 s |
| **Policy impact analysis** | Policy, Strategy | What changed → Impact on ADGM → Gap vs competitor → Recommended action | < 90 s |
| **Strategic opportunity brief** | Strategy | 4 opportunities with Falcon Economy-style scores → Top 2 recommendations → Why now | < 60 s |
| **Ministerial note (AR/EN)** | Communications, Strategy | Formal Arabic paragraph(s) → English paragraph(s) → Key metrics cited | < 45 s |

**Data injected into every briefing** (each item carries a handle and timestamp)

- Next or relevant **calendar meeting** (title, time UAE, attendees, location, prep status) `[CAL-…]`  
- **Open action register** `[ACT-…]`  
- **Market snapshot** (GCC, digital assets, competitor note, top sector) `[MKT-…]`  
- **Knowledge base** document list — cited by handle when used `[KB-…]`

---

## 8. Worked examples (demo-quality structures)

These examples now model the grounding contract: facts carry handles, illustrative analysis is labelled, and a `Sources:` line with a grounding indicator closes each one.

### 8.1 Policy + Strategy — Digital assets vs MAS

```
## ADGM vs Singapore (MAS) — Digital Assets Framework

Where ADGM leads
• English common law certainty for tokenisation [KB-014]
• Early FSRA licensing track record [KB-014]

Where MAS leads
• Retail-access experimentation; stablecoin framework depth [KB-018]

Benchmark — curated benchmark doc, as of May 2026 [KB-022]
• Digital-assets framework — ADGM 88 / MAS 90
• Regulatory agility       — ADGM 86 / MAS 88

Analysis (Policy AI) — recommendation, not a sourced fact
• Accelerate FSRA digital-fund guidance; foreground the legal-certainty advantage

Sources: KB-014 (ADGM digital-assets overview), KB-018 (MAS framework note),
         KB-022 (ADGM–MAS benchmark, May 2026)        Grounding: full
```

The benchmark scores are tied to a dated source handle, not asserted free-floating; the recommendation is marked as analysis.

### 8.2 CoS + Relationship — Pre-meeting brief

```
## Pre-meeting brief — [Meeting title] [CAL-1500]

Who — attendees, relationship warmth, last engagement [CRM-emaar]
Their agenda — expected topics (inferred where no source) [CRM-emaar]
Talking points — 3 bullets — Analysis (Comms / Strategy)
Watch-outs — sensitivities [CRM-emaar]
Suggested ask — one concrete ask before Q3 — Analysis
Open actions — [ACT-07], [ACT-11]

Sources: CAL-1500, CRM-emaar, ACT-07, ACT-11          Grounding: partial
```

`Grounding: partial` because the agenda and the ask are interpretation, not records.

### 8.3 Communications — Ministerial note

```
## Ministerial note — Q2 performance

العربية
[Formal paragraph to the HH office]

English
[Matching formal paragraph]

Metrics — departments green [KB-031]; Falcon Economy score [MKT-2026-06-03]

Sources: KB-031, MKT-2026-06-03    Grounding: full    Verification pass: passed
```

Ministerial output always runs the verification pass (§6.5) before it ships.

---

## 9. Prototype vs production (stakeholder clarity)

| Capability | Prototype (today) | Production target |
|------------|-------------------|-------------------|
| Agent routing | Keyword + focus-area rules (selects blocks + data slices) | LangGraph orchestration graph |
| Data | Seeded demo store + local persistence | Live Graph, CRM, Bloomberg, FSRA feeds |
| Answers | Claude API when configured; else scripted demo | Always live with audit logging |
| **Source integrity** | Handle citation + post-validation against the seeded store | Same contract over live sources, with an audit log of every cited handle |
| **Hallucination guardrail** | Closed-book rule + snippet match + verification pass on high-stakes output | Full verification pass on every answer + human approval gate on ministerial output |
| **Confidence signal** | Coverage-derived grounding indicator (full/partial/inferred) | Same, plus per-claim provenance trail |
| Arabic | Supported in prompts and comms briefings | Full RTL QA (Week 6 gate) |
| Security | Demo PIN / QR session | Azure AD SSO, RBAC, UAE North hosting |

---

## 10. Glossary

| Term | Meaning |
|------|---------|
| **CoS** | Chief of Staff AI — orchestrator |
| **Falcon Economy** | Abu Dhabi economic vision alignment scorecard |
| **FSRA** | Financial Services Regulatory Authority (ADGM) |
| **KB** | Knowledge base (ingested documents + graph) |
| **Smart routing** | Automatic agent selection from question topic, driving block and data-slice assembly |
| **Unified answer** | Single markdown reply regardless of how many agents ran |
| **Source handle** | Stable ID for an injected record (`KB-`/`ACT-`/`CAL-`/`CRM-`/`MKT-`); the only thing the model may cite |
| **Grounding indicator** | `full` / `partial` / `inferred` — coverage-based signal that replaces a confidence percentage |
| **Closed-book / open-book** | Facts come only from injected context (closed-book); interpretation is permitted but labelled as analysis (open-book) |
| **Abstention** | Returning "no source available" instead of inventing; counted as a correct outcome in eval |
| **Verification pass** | A second model pass that checks each factual claim against the injected sources before a high-stakes answer ships |

---

## 11. Document conversion notes

To convert this file for stakeholders:

- **Microsoft Word:** Open this `.md` file in Word, or paste into Word and apply Heading 1/2 styles to `##` sections.  
- **PDF:** Export from Word or use any Markdown-to-PDF tool.  
- **PowerPoint:** Use Section 3 (one slide per agent), Section 5 (format slides), Section 6 (the grounding contract as a trust slide), Section 7 (briefing table slide).

**File location:** `personal-ai-chat/docs/ADGM-Agent-Behaviours-and-Answer-Formats.md`

---

*Abu Dhabi Global Market — Personal AI Command Centre. Confidential prototype documentation.*

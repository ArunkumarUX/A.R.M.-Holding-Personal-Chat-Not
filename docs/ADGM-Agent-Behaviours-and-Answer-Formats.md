# ADGM Personal AI — Agent Behaviours & Answer Formats

**Document purpose:** Stakeholder reference for how the five AI specialists behave, how they are selected for a question, and what structure answers follow.  
**Product:** ADGM Command Centre / Personal AI (Chief Strategy Office prototype)  
**Audience:** ADGM leadership, programme sponsors, architecture reviewers  
**Version:** June 2026 (aligned to current prototype specification)

---

## 1. Executive summary

The Personal AI platform uses **five specialist agents** coordinated by a **Chief of Staff orchestrator**. Stakeholders see **one unified answer** in the chat — not five separate conversations. Agent chips in the UI show **which specialists contributed** to that answer.

Answers are grounded in demo institutional data: calendar, action register, knowledge base, market snapshot, and department metrics. When the Claude API is enabled, responses are generated live; otherwise the same structures are delivered from curated demo scripts.

---

## 2. How orchestration works

| Concept | Behaviour |
|--------|-----------|
| **Unified reply** | Multiple agents may be active, but the executive receives a single markdown message. |
| **Agent chips** | UI highlights participating agents (e.g. Policy + Strategy) while the answer streams. |
| **Smart routing** | Default: system picks agents from the question topic (focus area). Can be turned off in Settings for manual selection. |
| **Explicit invoke** | User can target one agent with `@policy`, `@strategy`, `@cos`, `@crm`, or `@comms` in the question. |
| **Confidence & sources** | Answers may show a confidence score and linked knowledge-base documents when available. |
| **Follow-ups** | Chat answers end with 2–3 suggested next questions; briefing documents do not. |

**Typical flow**

1. Executive asks a question (or selects a briefing format).  
2. System routes to one or more agents.  
3. Agents draw on calendar, CRM/actions, KB, and market feeds (demo data in prototype).  
4. Orchestrator synthesises one executive-grade markdown response.  
5. UI shows agents used, confidence, and sources.

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
| **Tagline** | D33, competitors, geopolitical and sector signals |
| **Primary tools** | Bloomberg feed, D33 scorecard, competitor radar |
| **Focus areas** | Strategic intelligence, knowledge |
| **Integrations (target)** | Bloomberg / Refinitiv, regulatory feeds, knowledge base |

**Behaviour**

- Daily and on-demand intelligence: GCC markets, sector flows, competitor moves (DIFC, MAS, Hong Kong, Luxembourg).  
- Scores opportunities against **D33** and Abu Dhabi economic priorities.  
- Produces competitor benchmark tables (multi-dimension scoring).  
- Connects market signals to CSO implications and timing (“why now”).

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
- Compares ADGM/FSRA position vs international benchmarks (e.g. MAS digital assets).  
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

- Living stakeholder profiles: relationship warmth, last touchpoints, sensitivities.  
- Open commitments and follow-ups before/after meetings.  
- Partnership pipeline and network mapping across ADGM.  
- Pre-meeting “who” and “their likely agenda” alongside CoS.

**Does not typically own**

- Full regulatory benchmark matrices (Policy AI).  
- D33 sector ranking lists without stakeholder angle (Strategy AI).

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
- Applies CSO voice learning from approved prior notes.

**Does not typically own**

- Dense regulatory comparison tables (Policy AI).  
- Raw action-register dumps without narrative framing (CoS).

---

## 4. When each agent is selected (routing)

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
| ADGM 2024 strategic decisions vs D33 | Strategy, Chief of Staff |
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
| **Tone** | Decision-ready, specific to ADGM, Abu Dhabi, and D33 |
| **Grounding** | Cites calendar, actions, KB document names; states when inferring |
| **Closing** | 2–3 short follow-up prompts the CSO might ask next |
| **UI metadata** | Agent chips, confidence %, source document links |

**Live AI (Claude):** One synthesised answer coordinating all active specialist perspectives (see system rules in platform).  
**Demo mode:** Same topics use scripted templates matching the structures below.

---

### 5.2 Agent-specific content patterns

Use these as the **expected sections** inside a unified answer (headings may vary slightly in live AI).

#### Chief of Staff AI

- Meeting: **when, where, prep status**  
- **Attendees** and decision required from CSO  
- **Open / overdue actions** (owner, due date, status)  
- **Recommended next steps** (numbered, 1–3 items)

#### Strategy AI

- **Market & competitor context** (GCC, sectors, named centres)  
- **D33 alignment** or opportunity scores  
- **Strategic read** — one clear implication for the CSO  
- Tables: competitor comparison or ranked opportunities

#### Policy AI

- **ADGM / FSRA position** in plain language  
- **What changed** (consultation, guidance, jurisdiction)  
- **Benchmark table:** dimension × ADGM × comparator (e.g. MAS)  
- **Recommended regulatory action** with date if in action register

#### Relationship AI

- **Relationship status** (warm / neutral / new) and last engagement  
- **Their likely agenda** or interests  
- **Open commitments** (table or bullets)  
- **Suggested next step** for the engagement

#### Communications AI

- **Talking points** or correspondence intent (bullets)  
- **Bilingual blocks** when requested: **العربية** then **English** (formal honorifics)  
- Tone note: ministerial / keynote / FSRA terminology review

---

## 6. Six briefing document formats

Briefings are **structured documents** (not casual chat). Target read time: **under 2 minutes**. No generic closing prompts.

| Briefing type | Typical agents | Required structure | Target time |
|---------------|----------------|-------------------|-------------|
| **Pre-meeting brief** | CoS, Relationship, Strategy | Who → Their likely agenda → Talking points → Watch-outs → Suggested ask | < 30 s |
| **Board pack summary** | CoS, Strategy | Decisions required → D33 alignment → Risks → One recommendation | < 60 s |
| **Stakeholder profile** | Relationship, CoS | Relationship & history → Focus areas → Open follow-ups → Next step | < 30 s |
| **Policy impact analysis** | Policy, Strategy | What changed → Impact on ADGM → Gap vs competitor → Recommended action | < 90 s |
| **Strategic opportunity brief** | Strategy | 4 opportunities with D33-style scores → Top 2 recommendations → Why now | < 60 s |
| **Ministerial note (AR/EN)** | Communications, Strategy | Formal Arabic paragraph(s) → English paragraph(s) → Key metrics cited | < 45 s |

**Data injected into every briefing**

- Next or relevant **calendar meeting** (title, time UAE, attendees, location, prep status)  
- **Open action register**  
- **Market snapshot** (GCC, digital assets, competitor note, top sector)  
- **Knowledge base** document list (cite names when used)

---

## 7. Worked examples (demo-quality structures)

### 7.1 Policy + Strategy — Digital assets vs MAS

```
## ADGM vs Singapore (MAS) — Digital Assets Framework

Where ADGM leads
• English common law certainty for tokenisation
• Early FSRA licensing track record

Where MAS leads
• Retail-access experimentation; stablecoin framework depth

Benchmark (Strategy AI)
• Digital-assets framework — ADGM 88 / MAS 90
• Regulatory agility — ADGM 86 / MAS 88

Recommended action (Policy)
• Accelerate FSRA digital-fund guidance; foreground legal-certainty advantage
```

### 7.2 CoS + Relationship — Pre-meeting brief

```
## Pre-meeting brief — [Meeting title]

Who — attendees, relationship warmth, last engagement
Their agenda — expected topics
Your talking points — 3 bullets
Watch-outs — sensitivities
Suggested ask — one concrete ask before Q3
```

### 7.3 Communications — Ministerial note

```
## Ministerial note — Q2 performance

العربية
[Formal paragraph to HH office]

English
[Matching formal paragraph]

[Optional: metrics from Strategy/CoS — departments green, D33 score]
```

---

## 8. Prototype vs production (stakeholder clarity)

| Capability | Prototype (today) | Production target |
|------------|-------------------|-------------------|
| Agent routing | Keyword + focus-area rules | LangGraph orchestration graph |
| Data | Seeded demo store + local persistence | Live Graph, CRM, Bloomberg, FSRA feeds |
| Answers | Claude API when configured; else scripted demo | Always live with audit logging |
| Arabic | Supported in prompts and comms briefings | Full RTL QA (Week 6 gate) |
| Security | Demo PIN / QR session | Azure AD SSO, RBAC, UAE North hosting |

---

## 9. Glossary

| Term | Meaning |
|------|---------|
| **CoS** | Chief of Staff AI — orchestrator |
| **D33** | Abu Dhabi economic vision alignment scorecard |
| **FSRA** | Financial Services Regulatory Authority (ADGM) |
| **KB** | Knowledge base (ingested documents + graph) |
| **Smart routing** | Automatic agent selection from question topic |
| **Unified answer** | Single markdown reply regardless of how many agents ran |

---

## 10. Document conversion notes

To convert this file for stakeholders:

- **Microsoft Word:** Open this `.md` file in Word, or paste into Word and apply Heading 1/2 styles to `##` sections.  
- **PDF:** Export from Word or use any Markdown-to-PDF tool.  
- **PowerPoint:** Use Section 3 (one slide per agent), Section 5 (format slides), Section 6 (briefing table slide).

**File location:** `personal-ai-chat/docs/ADGM-Agent-Behaviours-and-Answer-Formats.md`

---

*Abu Dhabi Global Market — Personal AI Command Centre. Confidential prototype documentation.*

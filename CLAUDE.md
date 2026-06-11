# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start both Vite UI (port 5173) and local API proxy (port 8787) concurrently
npm run dev:ui       # Vite only — no API, uses offline/canned responses
npm run dev:api      # API proxy only (node server/dev-api.mjs)
npm run build        # tsc -b && vite build (also runs scripts/write-build-info.mjs prebuild)
npm run lint         # eslint .
npm run kb:build     # Rebuild the Falcon Economy / institutional knowledge base chunks
```

No test runner is configured. Type-check without building: `npx tsc --noEmit`.

**Environment variables** (copy `.env.example` → `.env.local`):
- `ANTHROPIC_API_KEY` — required for live Claude responses (never bundled into the browser)
- `BRAVE_SEARCH_API_KEY` — optional; enables live web search (falls back to RSS feeds)
- `ADGM_ACCESS_PIN` — auth PIN, defaults to `9898`
- `ANTHROPIC_MODEL` — defaults to `claude-sonnet-4-6`

## Architecture

### Deployment targets

| Target | Entry | Chat endpoint |
|--------|-------|---------------|
| Local dev | `server/dev-api.mjs` (port 8787) | `POST /api/chat` |
| Netlify | `netlify/functions/api.mjs` | `/.netlify/functions/api` → `/api/chat` |
| Vercel | `api/chat.mjs` (inferred) | `POST /api/chat` |

All three share `server/apiRouter.mjs` → `server/chatCore.mjs`. The Vite dev server proxies `/api/*` to the local API.

### Chat request flow

1. **User types a message** → `CommandCentreChatPage.tsx` (the primary chat UI at `/chat`)
2. **`prepareChatTurn()`** (`src/api/prepareChatTurn.ts`):
   - `routeAgentsForQuery()` → determines which agents respond (`cos`, `strategy`, `policy`, `relationship`, `comms`, or `explorer`)
   - `buildChatContext()` → assembles the full context object (grounded records, calendar, actions, market snapshot, Falcon KB excerpts, GST time)
   - `buildChatUserMessage()` → constructs the user-role message sent to the API (greeting/explorer/CSO paths each have different message shapes)
3. **`streamClaudeChat()`** (`src/api/claudeChat.ts`) → `POST /api/chat` with `{ message, language, history, context }`
4. **Server: `chatCore.mjs`**:
   - Runs live web search (Brave API or RSS fallback) — Explorer queries get broad search; CSO queries get domain-scoped `smartSearch()`
   - `buildSystemPrompt()` selects the correct prompt path: greeting → single sentence / catchup → daily briefing / Explorer → web search answer / CSO → full prompt pack
   - Calls Anthropic SSE and streams `{ type: 'token', text }` events back
5. **Client** streams tokens into the message bubble; on completion, sets `thinking: false`

`USE_CLAUDE = true` is hardcoded in `CommandCentreChatPage.tsx`, `AppContext.tsx`, and `generateBriefing.ts` — do not change to an env var (it was previously `import.meta.env.VITE_USE_CLAUDE_API`, which silently defaulted to `false` on Vercel).

### Agent routing (`src/data/agents.ts`)

`routeAgentsForQuery()` runs on every message:
1. Greeting / catchup / thanks → `['cos']`
2. `isExplorerQuery()` returns `true` → `['explorer']` (any question with no specific ADGM/CSO entity context)
3. `@agent` mentions → direct override
4. Focus area keywords → `FOCUS_AREA_MAP`
5. `wantsPolicy` / `wantsStrategy` / `wantsCos` / `wantsComms` / `wantsRelationship` regex matching
6. Fallback → `['explorer']`

`isExplorerQuery()` uses **specific ADGM entity names only** as CSO indicators (`adgm`, `fsra`, `falcon economy`, `mubadala`, `difc`, etc.). Generic words like `regulation`, `policy`, `compliance`, `benchmark` alone do NOT route to CSO agents — they must be combined with an ADGM/FSRA/Abu Dhabi entity.

### System prompt assembly (`server/csoPromptPack.mjs` + `server/chatCore.mjs`)

`buildSystemPrompt(ctx, language)` in `chatCore.mjs` selects a path:
- **greeting** → exact single sentence, no extras
- **catchup** → structured daily briefing format
- **irrelevant** → dead code path (never triggered currently)
- **Explorer agent** → clean web-search prompt with SOURCE PRIORITY (KB → web → training)
- **CSO agents** → assembles `CSO_GLOBAL_SYSTEM_PROMPT` + `CSO_ORCHESTRATOR_PROMPT` + `CSO_SOURCE_CONFIDENCE_RULES` + `ANSWER_FORMAT_RULES` + `buildOutputContractBlock(query)` + `buildSpecialistPromptBlocks(agentIds)` + grounded records + web search block + THREE-TIER ANSWERING rules

`csoPromptPack.mjs` exports:
- `CSO_GLOBAL_SYSTEM_PROMPT`, `CSO_ORCHESTRATOR_PROMPT`, `CSO_SOURCE_CONFIDENCE_RULES` — the full Agent Prompt Pack
- `CSO_AGENT_PROMPTS` — keyed by agent id (`cos`, `strategy`, `policy`, `relationship`, `comms`, `explorer`)
- `CSO_OUTPUT_CONTRACTS` — 10 question-type format contracts (strategy_document, market_intel, benchmark, regulatory, performance, meeting, stakeholder, communication, quick_factual, deep_dive, default)
- `inferOutputContract(query)` — auto-selects the output contract from query text
- `buildSpecialistPromptBlocks(agentIds)` / `buildOutputContractBlock(query)` — called by `chatCore.mjs`

`answerFormatRules.mjs` contains `ANSWER_FORMAT_RULES` (grounding/citation rules and response standards) injected into every CSO system prompt.

### Executive state (`src/data/executiveStore.ts`)

Single source of truth for all UI data — persisted to `localStorage` under key `adgm-executive-state-v4`. Contains meetings, actions, market snapshot, documents, departments, Bloomberg articles, metrics. Live patches come from `GET /api/executive/snapshot`. `buildGroundedRecords()` converts this state into KB/CAL/ACT/MKT/CRM source handles for Claude to cite.

### Grounded source handle system

Sources are referenced by typed handles throughout:
- `KB-NNN` — knowledge base / uploaded documents
- `CAL-NNN` — calendar / meetings
- `ACT-NNN` — action register
- `MKT-NNN` — market snapshot
- `CRM-NNN` — stakeholder / CRM records
- `WEB-NN` — live web search results

`src/utils/sourceHandles.ts` and `server/sourceHandles.mjs` build/format these handles. Claude is instructed to cite only handles present in the injected context.

### Falcon Economy KB (`src/data/kb/falconKb.ts` + `server/kb/falconKb.mjs`)

Embedded JSON chunks from institutional PDFs (Falcon Economy Strategy, ADGM laws, etc.). `isFalconKbQuery()` detects relevant queries; `retrieveFalconExcerpts()` does keyword-scored retrieval. Client and server each have their own copy (same content).

### Web search (`server/webSearch.mjs`)

- `braveSearch()` — CSO queries, domain-scoped to ADGM/MAS/Reuters/Bloomberg etc.
- `braveSearchBroad()` — Explorer queries, unscoped, any topic
- `freeRssSearch()` — free fallback (no API key needed)
- `smartSearch()` — tries Brave first, falls back to RSS
- `formatSearchResultsBlock()` — formats results into a `[WEB-NN]` block injected into the system prompt

### Briefings (`src/api/generateBriefing.ts`)

Briefing formats (premeeting, boardpack, stakeholder, policy, opportunity, ministerial) are configured in `src/context/briefingConfig.ts`. Each format has a `buildUserMessage()` and an agent list. `generateBriefing()` calls `streamClaudeChat()` directly with a `briefingFormat` context key; the server treats briefing requests as CSO path (not Explorer) even if Explorer would otherwise match.

### Auth flow

Login: email or UAE mobile → `POST /api/auth/send-otp` → `POST /api/auth/verify-otp` → session cookie/token. `RequireOnboarding` in `src/auth/AuthGate.tsx` gates all protected routes. Server sessions use `server/authSessionStore.mjs` (Netlify Blobs in prod, in-memory fallback).

### Design system

Tokens in `src/config/brand.ts`. CSS variables in `src/styles/command-centre.css` and `src/styles/adgm-fonts.css`. Primary blue: `#0087FF`. Typography: Gilroy (adgm-gilroy) with Aptos fallback; Madani Arabic + Noto Naskh for RTL. Use `dir="rtl"` / logical CSS (`ms-`/`me-`) when `language === 'ar'`.

### Feature flags (`src/config/features.ts`)

`PPT_MASTER_ENABLED` and `PRESENTATION_BUILDER_ENABLED` are hardcoded `false` for the executive release. `ARCHITECTURE_ENABLED` requires `VITE_ENABLE_ARCHITECTURE=true` in env and a non-prod build.

### Vercel deployment notes

- `public/build-info.json` holds the `builtAt` timestamp — update it when pushing significant changes
- `USE_CLAUDE = true` is hardcoded in three files; do not restore the `VITE_USE_CLAUDE_API` env var pattern
- The `checkClaudeAvailable()` health-check gate has been intentionally removed from the chat path — errors surface as `⚠️ AI unavailable: <reason>` in the chat bubble instead

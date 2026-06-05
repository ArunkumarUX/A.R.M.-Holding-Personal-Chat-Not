# Create PPT (SlideAI) — production readiness

**Status:** Local development only. **Do not enable on Netlify production** until every item in the local verification section is checked.

---

## What works locally today

| Area | Status |
|------|--------|
| Chat → deck generation | `/api/slideai` via Claude |
| Conversational refine | `create` / `update` / `message` actions |
| Live preview + filmstrip | ADGM-branded CSS cards |
| PPTX export | `pptxgenjs`, Brand Book 2025 colours + footer |
| Demo fallback | When API offline or key missing |
| API proxy | `server/dev-api.mjs` + Netlify function route wired |
| Feature gate | Hidden unless `VITE_ENABLE_PPT_MASTER=true` |
| Brand rules | `prompts.ts`, `adgmBrandForDeck.ts`, `PPT-BRAND-RULES.md` |

---

## Do NOT push live until

1. All **Local verification** steps below pass on your machine
2. Stakeholder sign-off on deck quality (action titles, brand, export)
3. Explicit decision to set `VITE_ENABLE_PPT_MASTER=true` on Netlify (currently **off by design**)

---

## P0 — required before production

| # | Item | Notes |
|---|------|--------|
| 1 | **Keep flag off on Netlify** | `.env.example`: `VITE_ENABLE_PPT_MASTER` commented out for prod |
| 2 | **`ANTHROPIC_API_KEY` on Netlify** | Required when SlideAI goes live (server-side only) |
| 3 | **`npm run verify:slideai`** | Health + optional live AI smoke test |
| 4 | **API always paired with UI** | Use `npm run dev`, not `dev:ui` alone |
| 5 | **Export .pptx opens in PowerPoint** | Gilroy may fallback to Aptos — acceptable |
| 6 | **Brand footer on every slide** | `ADGM · Path to Forward · Confidential` |
| 7 | **Error UX** | No silent failures on export; API banner when offline |
| 8 | **Input limits on server** | `slideAi.mjs` caps message count / length |

---

## P1 — polish before wider rollout

| # | Item |
|---|------|
| 1 | HTML deck export from SlideAI deck |
| 2 | Arabic copy on preview panel (partial today) |
| 3 | Streaming assistant text while deck builds |
| 4 | Per-slide inline edit in preview |
| 5 | Auth gate on `/api/slideai` (match app session if required) |
| 6 | Rate limiting / cost caps for Anthropic |
| 7 | Remove or archive old `PresentationBuilderPage` wizard |

---

## P2 — later

- SlideAI unit tests (JSON parse, `normalizeDeck`, PPTX smoke)
- E2E (Playwright): prompt → deck → download
- Netlify preview deploy with flag on for QA branch only
- PPT Master / Open Design Cursor skills as optional upgrade path

---

## Local verification (run before any deploy)

### 1. Environment

```bash
# .env.local
VITE_ENABLE_PPT_MASTER=true
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6
```

### 2. Start full stack

```bash
npm run dev
```

Expect:

```
[api] http://localhost:8787  claude=on
[ui]  Local: http://localhost:5173/
```

### 3. Automated smoke test

```bash
npm run verify:slideai          # health only
npm run verify:slideai -- --live   # includes one Claude call (~costs tokens)
```

### 4. Manual checklist

- [ ] Sidebar shows **Create PPT** only when flag is `true`
- [ ] Suggestion chip creates a deck (8+ slides with live API)
- [ ] Follow-up: “Make slide 2 shorter” updates deck
- [ ] **New deck** clears state
- [ ] **Export .pptx** downloads and opens
- [ ] Title slide: navy hero, tagline, ADGM
- [ ] Kill API (`lsof -ti:8787 | xargs kill`) → demo deck + banner, not crash
- [ ] Arabic UI: composer + banner strings correct
- [ ] `npm run build` passes

### 5. Production build preview (still local)

```bash
npm run build
npm run preview
# Set VITE_ENABLE_PPT_MASTER=true at build time for preview:
VITE_ENABLE_PPT_MASTER=true npm run build && npm run preview
```

Note: `preview` proxies `/api` only if you also run `npm run dev:api` in another terminal.

---

## When ready for Netlify (not yet)

1. Merge to deploy branch
2. Netlify env: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ADGM_ACCESS_PIN`
3. **Only after sign-off:** `VITE_ENABLE_PPT_MASTER=true` on Netlify
4. Redeploy, run manual checklist on production URL
5. Monitor Anthropic usage / errors

---

## Key files

| File | Role |
|------|------|
| `src/features/slideai/` | SlideAI UI + agent + export |
| `server/slideAi.mjs` | Claude proxy |
| `src/config/adgmBrandForDeck.ts` | Brand tokens |
| `docs/brand-2025/PPT-BRAND-RULES.md` | Brand rules |
| `scripts/verify-slideai-local.mjs` | Local smoke test |

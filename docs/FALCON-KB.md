# Institutional Knowledge Base (Falcon + ADGM Archive)

Official PDFs are indexed for grounded answers in **Chat**, **Briefings**, and **Knowledge Base**.

| Document | KB handle | File |
|----------|-----------|------|
| Falcon Economy Strategy 2025–2045 (English) | `KB-006` | `20240923_FalconEconomy-Eng.pdf` |
| Falcon Strategy (Executive Summary) | `KB-007` | `20240501_Falcon Strategy.pdf` |
| ADGM Law No. 1547 — Version 3.14 | `KB-008` | `adgm-1547-3267-v3-14.pdf` |
| ADGM Law No. 1547 — Version 01.11.0319 | `KB-009` | `adgm-1547-v01110319.pdf` |
| ADGM Law No. 1547 — Version 1 | `KB-010` | `adgm-1547-v1.pdf` |
| ADGM Law No. 1547 — Version 2025 | `KB-011` | `adgm-1547-v2025.pdf` |
| ADGM Law No. 1547 — April 2020 | `KB-012` | `adgm-1547-apr-2020.pdf` |
| ADGM Law No. 1547 — April 2026 | `KB-013` | `adgm-1547-apr-2026.pdf` |
| Application of English Law Regulations — Amendment 1 (2022) | `KB-014` | `english-law-amendment-2022.pdf` |
| UAE Cabinet Resolution No. 4 of 2013 | `KB-015` | `cabinet-resolution-4-2013.pdf` |

## Where files live

- **PDFs:** `data/kb-pdfs/` and `public/kb/` (open in browser)
- **Search index:** `src/data/kb/falconKbChunks.json` (rebuild with `npm run kb:build`)
- **Archive source:** `/Users/arunkumarg/Downloads/Archive` (8 unique PDFs; duplicates skipped)
- **Retrieval:** `src/data/kb/falconKb.ts` + `server/kb/falconKb.mjs`

## Rebuild index after PDF update

```bash
# Rebuild from Falcon PDFs + Downloads/Archive (deduped)
npm run kb:build
# Optional: custom archive path
KB_ARCHIVE_DIR=/path/to/pdfs npm run kb:build
```

## Behaviour

Questions mentioning **Falcon Economy**, **ADGM Law 1547**, **English law regulations**, **Cabinet Resolution**, **Abu Dhabi diversification**, etc. pull ranked excerpts into the Claude prompt. Answers must cite `KB-00x-xx` handles from the table above.

Existing browsers: reload the app once; `loadExecutiveState` merges `d6` / `d7` documents automatically.

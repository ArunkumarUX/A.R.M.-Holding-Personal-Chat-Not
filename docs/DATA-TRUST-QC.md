# Data trust QC — Personal AI chat (ADGM)

Stakeholder review checklist: what is **live**, **official**, or **scenario prototype**.

## Live / trustworthy today

| Domain | Source | Notes |
|--------|--------|--------|
| **Personal AI answers** | Claude Sonnet 4.6 (`ANTHROPIC_API_KEY`) | Must cite handles (KB-, MKT-, CAL-, ACT-, CRM-, BBG-). No invented figures. |
| **Knowledge base** | Official PDFs (Falcon Economy, ADGM Law 1547, etc.) | 183 grounded chunks (KB-006–KB-015). Built from `data/kb-pdfs/`. |
| **Market headlines** | Bloomberg via Apify (`APIFY_TOKEN`) | Live when token set; headlines appear as BBG-01… in chat context. |
| **GST refresh** | `/api/executive/snapshot` | 08:00 & 22:00 Abu Dhabi — rolls calendar/actions dates and market rotation. |
| **Auth sessions** | Vercel Blob | Production PIN gate. |

## Scenario prototype (do not present as live ERP/Bloomberg terminal)

| Domain | Current behaviour |
|--------|-------------------|
| Market ticker (ADX, Brent, BTC, etc.) | Static layout indices in `commandCentreData.ts` |
| Department dashboards (9 depts) | Illustrative RAG / KPIs |
| Momentum, capital flows, regulatory table | Curated demo content |
| Calendar & action register | GST-dated scenario data (not Microsoft Graph) |
| MKT- snapshot metrics (GCC %, digital assets %) | Rotation unless Bloomberg lead overrides headline |

## Enabling live Bloomberg for demos

1. Create Apify token: https://console.apify.com/account/integrations  
2. Vercel → Project → Environment → Production: `APIFY_TOKEN=…`  
3. Trigger refresh (Settings → Refresh data, or wait for 08:00/22:00 GST)  
4. Confirm dashboard **Data sources** panel shows **Live** for market headlines  

## UI trust controls (shipped)

- **Data sources** panel on Command Centre home  
- **Compact trust line** under chat composer  
- **Ticker disclaimer** — scenario indices  
- **Claude system prompt** — DATA TRUST block; removed hardcoded “licence growth +12%”  

## Health check

`GET /api/health` returns `dataTrust` flags: `claude`, `bloombergApify`, `kbChunks`, integration modes.

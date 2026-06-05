# Apify MCP — Bloomberg Category News

Connect Cursor and the Command Centre API to **[piotrv1001/bloomberg-category-news-scraper](https://apify.com/piotrv1001/bloomberg-category-news-scraper)** on Apify.

## 1. Apify account & token

1. Sign up at [Apify Console](https://console.apify.com/).
2. Open **Settings → Integrations** and copy your **API token**.
3. Subscribe to or rent the Bloomberg actor if required ($9/month + usage per actor page).

## 2. Cursor MCP (recommended)

This repo includes MCP config:

- Workspace root: `.cursor/mcp.json`
- App folder: `personal-ai-chat/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "apify-bloomberg": {
      "url": "https://mcp.apify.com/?tools=piotrv1001/bloomberg-category-news-scraper,actors,docs,get-actor-run,get-dataset-items"
    }
  }
}
```

### Connect in Cursor

1. **Cursor → Settings → MCP** (or open MCP panel).
2. Reload MCP servers — you should see **apify-bloomberg**.
3. **First connect:** browser OAuth to Apify (no token in the file), **or** add a bearer header:

```json
"headers": {
  "Authorization": "Bearer YOUR_APIFY_TOKEN"
}
```

4. One-click alternative: [mcp.apify.com](https://mcp.apify.com) → add actor `piotrv1001/bloomberg-category-news-scraper` → **Install in Cursor**.

### Example prompt in Cursor chat

> Run the Bloomberg category news scraper for `https://www.bloomberg.com/markets` and `https://www.bloomberg.com/crypto` with max 5 items per URL. Summarise top headlines for ADGM market intel.

Actor input shape:

```json
{
  "searchUrls": [
    "https://www.bloomberg.com/markets",
    "https://www.bloomberg.com/crypto"
  ],
  "maxItemsPerUrl": 5
}
```

## 3. Command Centre API (scheduled refresh)

When `APIFY_TOKEN` is in `.env.local`, the dev API and Netlify function call the same actor on each **08:00 / 22:00 GST** refresh (`/api/executive/snapshot`):

```bash
# .env.local
APIFY_TOKEN=apify_api_...
# optional
APIFY_BLOOMBERG_URLS=https://www.bloomberg.com/markets,https://www.bloomberg.com/economics
APIFY_BLOOMBERG_MAX_ITEMS=5
```

Restart:

```bash
cd personal-ai-chat && npm run dev
```

The latest Bloomberg headline is merged into `regulatoryHeadline` and `marketSnapshot.competitorNote` when the run succeeds.

## 4. Troubleshooting

| Issue | Fix |
|--------|-----|
| MCP not listed | Reload Cursor; confirm `.cursor/mcp.json` is in the opened workspace folder |
| 401 / auth | Add `Authorization: Bearer` header or complete OAuth |
| Actor rental | Rent actor on Apify Store or use pay-per-result |
| Slow run | Actor can take 30–120s; sync API timeout is 120s |
| No live data in app | Set `APIFY_TOKEN` in `.env.local` and restart `npm run dev` |

## References

- [Apify MCP documentation](https://docs.apify.com/platform/integrations/mcp)
- [Bloomberg Category News Scraper](https://apify.com/piotrv1001/bloomberg-category-news-scraper)

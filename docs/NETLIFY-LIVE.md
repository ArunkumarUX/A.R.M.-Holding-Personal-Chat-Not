# Netlify live site

**URL:** https://personal-ai-chat-bot.netlify.app/

## Required Netlify settings

| Setting | Value |
|---------|--------|
| Base directory | *(empty)* — repo root must be `personal-ai-chat` |
| Build command | `npm run build` |
| Publish directory | `dist` |

If Base directory is wrong, Netlify serves an **old build** and sidebar items (Architecture, Create PPT) will not match git `main`.

## Verify deploy after push

1. Open https://personal-ai-chat-bot.netlify.app/build-info.json  
   - Should show recent `gitSha` (matches latest commit on `main`).
2. In the app: **Settings → Command Centre data** → footer should say  
   `Build: Production · Hidden on live: Create PPT, Architecture`
3. Sidebar **System** group should show **Settings only** (no Architecture, no Create PPT).

## Manual redeploy

Netlify dashboard → **Deploys** → **Trigger deploy** → **Deploy site**.

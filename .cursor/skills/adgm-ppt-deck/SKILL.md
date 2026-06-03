---
name: adgm-ppt-deck
description: >
  Generate a native editable ADGM board deck from Command Centre content using PPT Master.
  Use when the user asks for PowerPoint, PPT, deck, slides, or "ppt-master" from this repo.
---

# ADGM PPT deck (PPT Master integration)

This repo integrates [ppt-master](https://github.com/hugohe3/ppt-master) **locally only** — not deployed to Netlify.

## Prerequisites

1. Run from `personal-ai-chat/`: `npm run ppt-master:setup`
2. App dev flag: `VITE_ENABLE_PPT_MASTER=true` in `.env.local` (optional UI)
3. Python 3.10+ with `pip install -r tools/ppt-master/requirements.txt` (setup script does this)

## Source material

- Use app **Create PPT** (`/create-ppt`) → full wizard → **Export Markdown**, or
- Place files in: `tools/ppt-master-adgm/projects/adgm-command-centre/sources/`

## Pipeline

1. Read **`tools/ppt-master/skills/ppt-master/SKILL.md`** — follow that workflow exactly (serial gates, no script-generated SVG).
2. Project path for ADGM: `tools/ppt-master-adgm/projects/adgm-command-centre/`
3. Brand: navy `#00092a`, Clearsky `#0087ff`, executive 16:9, Gilroy-style typography
4. Audience: Rajiv Sehgal, Chief Strategy Officer, ADGM (Abu Dhabi Global Market)
5. Grounding: prefer facts from exported Command Centre content; label analysis clearly

## Default Cursor prompt

```
Read tools/ppt-master/skills/ppt-master/SKILL.md.
Create a native editable PowerPoint from tools/ppt-master-adgm/projects/adgm-command-centre/sources/deck-source.md.
ADGM executive board style, 16:9. Confirm design spec with the user before generating SVG pages.
```

## Output

Editable `.pptx` under the ppt-master project `exports/` folder — open in PowerPoint 2016+.

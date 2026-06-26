#!/usr/bin/env bash
# Copy ANTHROPIC_API_KEY from Naar price monitor → A.R.M. Holding (.env.local + optional Netlify).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PRICE_BACKEND="$HOME/Desktop/AI Projects/Naar web/naar-price-monitor/backend/.env"
PRICE_ROOT="$HOME/Desktop/AI Projects/Naar web/naar-price-monitor/.env"
ARM_ENV="$ROOT/.env.local"

read_key() {
  local file="$1"
  [[ -f "$file" ]] || return 1
  grep -E '^ANTHROPIC_API_KEY=' "$file" | head -1 | cut -d= -f2- | tr -d '\r' | sed 's/^["'\'']//; s/["'\'']$//'
}

KEY=""
SOURCE=""
for candidate in "$PRICE_BACKEND" "$PRICE_ROOT"; do
  k="$(read_key "$candidate" || true)"
  if [[ -n "$k" && "$k" != "sk-ant-..." && ${#k} -gt 20 ]]; then
    KEY="$k"
    SOURCE="$candidate"
    break
  fi
done

if [[ -z "$KEY" ]]; then
  echo "No ANTHROPIC_API_KEY found in naar-price-monitor (.env or backend/.env)." >&2
  exit 1
fi

echo "Using key from: $SOURCE"

python3 - "$ARM_ENV" "$KEY" << 'PY'
import re, sys
from pathlib import Path
arm, key = Path(sys.argv[1]), sys.argv[2]
text = arm.read_text() if arm.exists() else (arm.parent / ".env.example").read_text()
if re.search(r"^ANTHROPIC_API_KEY=", text, re.M):
    text = re.sub(r"^ANTHROPIC_API_KEY=.*$", f"ANTHROPIC_API_KEY={key}", text, count=1, flags=re.M)
else:
    text = text.rstrip() + f"\nANTHROPIC_API_KEY={key}\n"
arm.write_text(text)
print(f"Updated {arm}")
PY

if command -v netlify >/dev/null 2>&1; then
  if netlify status >/dev/null 2>&1; then
    echo "Setting Netlify ANTHROPIC_API_KEY (production)…"
    cd "$ROOT"
    netlify env:set ANTHROPIC_API_KEY "$KEY" --context production
    echo "Done. Trigger a deploy: netlify deploy --prod  (or push to main)"
  else
    echo ""
    echo "Netlify CLI not logged in. To fix live chat on arm11.netlify.app:"
    echo "  1. netlify login && cd \"$ROOT\" && netlify link"
    echo "  2. Re-run: npm run sync:anthropic-key"
    echo "  Or paste the same key manually in Netlify → Environment variables → ANTHROPIC_API_KEY"
  fi
else
  echo ""
  echo "Netlify CLI not installed. Paste the same key in Netlify → Environment variables → ANTHROPIC_API_KEY"
fi

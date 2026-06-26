#!/usr/bin/env bash
# Sync ANTHROPIC_API_KEY into A.R.M. Holding (.env.local + optional Netlify).
# Sources: price monitor (default) or personal-ai-chat (known working on Netlify).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARM_ENV="$ROOT/.env.local"
FROM="${1:-price}"

PRICE_BACKEND="$HOME/Desktop/AI Projects/Naar web/naar-price-monitor/backend/.env"
PRICE_ROOT="$HOME/Desktop/AI Projects/Naar web/naar-price-monitor/.env"
PERSONAL_ENV="$HOME/Desktop/AI Projects/AI Catalog App - Naar/personal-ai-chat/.env.local"

read_key() {
  local file="$1"
  [[ -f "$file" ]] || return 1
  grep -E '^ANTHROPIC_API_KEY=' "$file" | head -1 | cut -d= -f2- | tr -d '\r' | sed 's/^["'\'']//; s/["'\'']$//'
}

read_model() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  grep -E '^ANTHROPIC_MODEL=' "$file" | head -1 | cut -d= -f2- | tr -d '\r' | sed 's/^["'\'']//; s/["'\'']$//'
}

KEY=""
SOURCE=""
MODEL=""

case "$FROM" in
  price|price-monitor|naar)
    for candidate in "$PRICE_BACKEND" "$PRICE_ROOT"; do
      k="$(read_key "$candidate" || true)"
      if [[ -n "$k" && "$k" != "sk-ant-..." && ${#k} -gt 20 ]]; then
        KEY="$k"
        SOURCE="$candidate"
        MODEL="$(read_model "$candidate" || true)"
        break
      fi
    done
    ;;
  personal|personal-ai-chat|adgm)
    k="$(read_key "$PERSONAL_ENV" || true)"
    if [[ -n "$k" && ${#k} -gt 20 ]]; then
      KEY="$k"
      SOURCE="$PERSONAL_ENV"
      MODEL="$(read_model "$PERSONAL_ENV" || true)"
    fi
    ;;
  *)
    echo "Usage: $0 [price|personal]" >&2
    exit 1
    ;;
esac

if [[ -z "$KEY" ]]; then
  echo "No ANTHROPIC_API_KEY found for source: $FROM" >&2
  exit 1
fi

echo "Using key from: $SOURCE"
echo "Fingerprint: prefix=${KEY:0:12} suffix=${KEY: -4} len=${#KEY}"
[[ -n "$MODEL" ]] && echo "Model: $MODEL"

python3 - "$ARM_ENV" "$KEY" "$MODEL" << 'PY'
import re, sys
from pathlib import Path
arm, key, model = Path(sys.argv[1]), sys.argv[2], sys.argv[3]

def set_var(text, name, value):
    if not value:
        return text
    if re.search(rf"^{re.escape(name)}=", text, re.M):
        return re.sub(rf"^{re.escape(name)}=.*$", f"{name}={value}", text, count=1, flags=re.M)
    return text.rstrip() + f"\n{name}={value}\n"

text = arm.read_text() if arm.exists() else (arm.parent / ".env.example").read_text()
text = set_var(text, "ANTHROPIC_API_KEY", key)
text = set_var(text, "ANTHROPIC_MODEL", model)
arm.write_text(text)
print(f"Updated {arm}")
PY

if command -v netlify >/dev/null 2>&1 && netlify status >/dev/null 2>&1; then
  echo "Pushing to Netlify environment…"
  cd "$ROOT"
  TMP="$(mktemp)"
  {
    echo "ANTHROPIC_API_KEY=$KEY"
    [[ -n "$MODEL" ]] && echo "ANTHROPIC_MODEL=$MODEL"
  } > "$TMP"
  netlify env:import "$TMP" --replaceExisting
  rm -f "$TMP"
  echo "Done. Trigger deploy: Netlify → Deploys → Trigger deploy"
else
  echo ""
  echo "Netlify: paste this key in Site configuration → Environment variables"
  echo "  ANTHROPIC_API_KEY  (suffix ${KEY: -4}, length ${#KEY})"
  [[ -n "$MODEL" ]] && echo "  ANTHROPIC_MODEL=$MODEL"
  echo ""
  echo "Then Deploys → Trigger deploy."
  echo "Verify: https://arm11.netlify.app/api/health?verify=1"
  echo "  claudeKeyFingerprint.suffix should be ${KEY: -4}"
  echo ""
  echo "Tip: personal-ai-chat key is known working on Netlify:"
  echo "  npm run sync:anthropic-key -- personal"
fi

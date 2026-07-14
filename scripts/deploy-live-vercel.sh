#!/usr/bin/env bash
# One-shot: sync Bedrock/AWS env + production deploy + health check.
# Run in a normal Terminal (not Cursor sandbox): bash scripts/deploy-live-vercel.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mask() {
  sed -E \
    -e 's/(AKIA[0-9A-Z]{16})/[AWS_KEY_MASKED]/g' \
    -e 's/(AWS_SECRET_ACCESS_KEY[=: ]+)[^[:space:]]+/\1[MASKED]/g' \
    -e 's/(AWS_ACCESS_KEY_ID[=: ]+)[^[:space:]]+/\1[MASKED]/g' \
    -e 's/(sk-ant-[A-Za-z0-9_-]+)/[ANTHROPIC_MASKED]/g'
}

echo "== whoami =="
vercel whoami

echo "== sync production from .env.local =="
npm run sync:vercel-env 2>&1 | mask

KEYS=(CHAT_PROVIDER BEDROCK_AGENT_ARN BEDROCK_AGENT_ID BEDROCK_AGENT_ALIAS_ID AWS_REGION AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY)
for target in preview development; do
  echo "== sync Bedrock/AWS -> $target =="
  for key in "${KEYS[@]}"; do
    line="$(grep -E "^${key}=" .env.local | tail -1 || true)"
    [[ -z "$line" ]] && { echo "  skip $key"; continue; }
    value="${line#*=}"; value="${value%\"}"; value="${value#\"}"
    [[ -z "$value" ]] && { echo "  skip $key (empty)"; continue; }
    printf '%s' "$value" | vercel env rm "$key" "$target" --yes >/dev/null 2>&1 || true
    if printf '%s' "$value" | vercel env add "$key" "$target" >/dev/null 2>&1; then
      echo "  ok $key"
    else
      echo "  fail $key"
    fi
  done
done

echo "== deploy production =="
vercel --prod --yes 2>&1 | mask | tee /tmp/dmcc-vercel-deploy.log
grep -Eo 'https://[^ ]+' /tmp/dmcc-vercel-deploy.log | sort -u || true

echo "== health =="
curl -sS --max-time 30 "https://apparelgroup-ceo-ai-igvb.vercel.app/api/health"
echo

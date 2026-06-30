#!/usr/bin/env bash
# Sync production env vars from .env.local to the linked Vercel project.
# Usage: npm run sync:vercel-env
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local — run: vercel env pull .env.local" >&2
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "Install Vercel CLI: npm i -g vercel" >&2
  exit 1
fi

if ! vercel whoami >/dev/null 2>&1; then
  echo "Run: vercel login" >&2
  exit 1
fi

if [[ ! -f .vercel/project.json ]]; then
  echo "Link this folder to apparelgroup-ceo-ai-igvb:" >&2
  echo "  vercel link --project apparelgroup-ceo-ai-igvb" >&2
  exit 1
fi

KEYS=(
  ANTHROPIC_API_KEY
  ANTHROPIC_MODEL
  PERCEPTIS_API_KEY
  PERCEPTIS_API_BASE_URL
  PERCEPTIS_TEMPLATE_NAME
  BLOB_READ_WRITE_TOKEN
)

echo "Syncing ${#KEYS[@]} keys to Vercel production…"
for key in "${KEYS[@]}"; do
  line="$(grep -E "^${key}=" .env.local | tail -1 || true)"
  if [[ -z "$line" ]]; then
    echo "  skip $key (not in .env.local)"
    continue
  fi
  value="${line#*=}"
  value="${value%\"}"
  value="${value#\"}"
  if [[ -z "$value" ]]; then
    echo "  skip $key (empty)"
    continue
  fi
  printf '%s' "$value" | vercel env rm "$key" production --yes 2>/dev/null || true
  printf '%s' "$value" | vercel env add "$key" production
  echo "  ok $key"
done

echo "Done. Redeploy: vercel --prod"
echo "Health check: https://apparelgroup-ceo-ai-igvb.vercel.app/api/health"

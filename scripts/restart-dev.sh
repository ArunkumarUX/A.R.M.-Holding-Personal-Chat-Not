#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Stopping dev servers on ports 5173–5190 and 8787–8810…"
for port in $(seq 5173 5190) $(seq 8787 8810); do
  pids=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pids" ]; then
    kill -9 $pids 2>/dev/null || true
  fi
done

sleep 1
echo "Starting npm run dev…"
exec npm run dev

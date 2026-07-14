#!/bin/bash
# Start DMCC API with Bedrock credentials (run in Terminal, not Cursor sandbox)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${API_PORT:-8840}"
printf '%s' "$PORT" > .dev-api-port
export API_PORT="$PORT"
# load .env.local into this shell
set -a
# shellcheck disable=SC1091
[ -f .env.local ] && . ./.env.local
set +a
echo "[dmcc-api] starting on :$PORT  provider=${CHAT_PROVIDER:-auto} region=${AWS_REGION:-}"
exec node server/dev-api.mjs

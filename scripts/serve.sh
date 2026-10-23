#!/usr/bin/env bash
# Serve the dashboard on its own (ES modules need http://, not file://):
#   hackathon/scripts/serve.sh            → http://localhost:8787/?mock=1   (fixtures, no platform)
#   hackathon/scripts/serve.sh 9000
# Point Settings at a platform's /api/lg/v1 with a key from the desk to leave mock mode.
set -euo pipefail
cd "$(dirname "$0")/../dashboard"
PORT=${1:-8787}
echo "LiquidGold · Lending — http://localhost:$PORT/?mock=1"
python3 -m http.server "$PORT" --bind 127.0.0.1

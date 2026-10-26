#!/usr/bin/env bash
# Serve the dashboard — or LiquidSettle — on its own (ES modules need http://, not file://):
#   hackathon/scripts/serve.sh                 → http://localhost:8787/?mock=1   (the dashboard on fixtures, no platform)
#   hackathon/scripts/serve.sh 9000
#   hackathon/scripts/serve.sh 8788 settle     → http://localhost:8788/?mock=1   (LiquidSettle on the sample data)
# Point Settings (the dashboard) or the data attributes (LiquidSettle) at a platform's /api/lg/v1 to leave mock mode.
set -euo pipefail
APP=${2:-dashboard}
cd "$(dirname "$0")/../$APP"
PORT=${1:-8787}
echo "$([ "$APP" = settle ] && echo 'LiquidSettle' || echo 'LiquidLend') — http://localhost:$PORT/?mock=1"
python3 -m http.server "$PORT" --bind 127.0.0.1

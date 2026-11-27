#!/bin/bash
# Start the full Hakim stack for quick demos and sandbox runs.
# API: port 4000 with an ephemeral in-memory MongoDB (USE_MEMORY_DB=true)
#      seeded with demo doctors and demo accounts.
# Web: Vite dev server on port 3000 (or WEB_PORT) proxying /api -> 4000.
# Redis is optional: the API degrades gracefully when it is unavailable.

set -u

BASE="$(cd "$(dirname "$0")/.." && pwd)"
WEB_PORT="${WEB_PORT:-3000}"

if [ ! -f "$BASE/server/.env" ]; then
  cat > "$BASE/server/.env" <<EOF
JWT_SECRET=dev_secret_change_me_in_production_0123456789abcdef
CLIENT_ORIGIN=http://localhost:$WEB_PORT
EOF
fi

# Stop leftovers from previous runs (including any app that occupies the port)
pkill -f 'node src/index.js' 2>/dev/null
pkill -f 'vite --port' 2>/dev/null
pkill -f 'next dev' 2>/dev/null
pkill -f 'next-server' 2>/dev/null
sleep 1

# API with in-memory MongoDB + seed data
cd "$BASE/server"
USE_MEMORY_DB=true setsid nohup node src/index.js >> "$BASE/../hakim-server.log" 2>&1 < /dev/null &
disown

# Web client
cd "$BASE/client"
setsid nohup npm run dev -- --port "$WEB_PORT" --host --strictPort >> "$BASE/../hakim-client.log" 2>&1 < /dev/null &
disown

# Wait until both respond, and make sure the frontend is really Hakim
for i in $(seq 1 45); do
  ok=0
  curl -s --max-time 2 localhost:4000/api/health | grep -q '"status":"ok"' && \
  curl -s --max-time 2 "localhost:$WEB_PORT/" | grep -q 'Hakim' && ok=1
  [ $ok -eq 1 ] && { echo "HAKIM UP"; exit 0; }
  sleep 2
done
echo "HAKIM FAILED"; exit 1

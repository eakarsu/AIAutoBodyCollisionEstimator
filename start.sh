#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"; test -f .env || { echo 'Copy .env.example to .env and configure it.'; exit 1; }
test -d backend/node_modules -a -d frontend/node_modules || { echo 'Run scripts/bootstrap.sh first.'; exit 1; }
set -a; source .env; set +a
for port in "${BACKEND_PORT:-3001}" "${FRONTEND_PORT:-5173}"; do lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 && { echo "Port $port is occupied." >&2; exit 1; } || true; done
export RUNTIME_PROJECT_NAME="AI Auto Body Collision Estimator"
export RUNTIME_AI_ENDPOINT="/api/ai/collision-estimate-review"
export RUNTIME_AI_FEATURE="collision-estimate-evidence-review"
export RUNTIME_AI_SYSTEM_PROMPT="Review collision-estimate evidence, distinguishing visible damage from teardown uncertainty and flagging OEM procedures, calibration, safety, and insurer-review needs."
node backend/server.js & backend_pid=$!; npm --prefix frontend run dev -- --port "${FRONTEND_PORT:-5173}" --strictPort --host 127.0.0.1 & frontend_pid=$!
cleanup(){ kill "$backend_pid" "$frontend_pid" 2>/dev/null || true; }; trap cleanup EXIT INT TERM; wait "$backend_pid" "$frontend_pid"

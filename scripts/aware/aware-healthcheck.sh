#!/usr/bin/env bash
# AWARE Portal — Health Check (one-shot)
set -euo pipefail

STATE_DIR="/home/runner/.aware"
PID_FILE="$STATE_DIR/aware.pid"
HEALTH_URL="http://localhost:5173"
TIMEOUT=5

VERBOSE=false
[[ "${1:-}" == "--verbose" || "${1:-}" == "-v" ]] && VERBOSE=true

if [[ -f "$PID_FILE" ]]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        $VERBOSE && echo "Process alive: PID $PID"
    else
        $VERBOSE && echo "Process dead: PID $PID"
        exit 1
    fi
else
    $VERBOSE && echo "No PID file"
    exit 1
fi

if curl -sf --max-time "$TIMEOUT" "$HEALTH_URL" >/dev/null 2>&1; then
    $VERBOSE && echo "HTTP health: OK ($HEALTH_URL)"
    exit 0
else
    $VERBOSE && echo "HTTP health: FAIL ($HEALTH_URL)"
    exit 1
fi

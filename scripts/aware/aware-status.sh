#!/usr/bin/env bash
# AWARE Portal — Status
set -euo pipefail

STATE_DIR="/home/runner/.aware"
PID_FILE="$STATE_DIR/aware.pid"
WATCHDOG_PID="$STATE_DIR/watchdog.pid"
CRON_PID="$STATE_DIR/cron.pid"

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[0;33m'; NC='\033[0m'
ok()   { echo -e "  ${GREEN}●${NC} $1"; }
fail() { echo -e "  ${RED}●${NC} $1"; }
warn() { echo -e "  ${YELLOW}●${NC} $1"; }

echo "AWARE Portal Status"
echo "-------------------"

if [[ -f "$PID_FILE" ]]; then
    PID=$(cat "$PID_FILE")
    if lsof -ti :5173 >/dev/null 2>&1; then
        ok "Server:   running (PID $PID)"
    elif kill -0 "$PID" 2>/dev/null; then
        ok "Server:   running (PID $PID, port pending)"
    else
        fail "Server:   dead (stale PID $PID)"
    fi
else
    fail "Server:   not started"
fi

if [[ -f "$WATCHDOG_PID" ]]; then
    PID=$(cat "$WATCHDOG_PID")
    if kill -0 "$PID" 2>/dev/null; then ok "Watchdog: running (PID $PID)"; else fail "Watchdog: dead (stale PID $PID)"; fi
else
    warn "Watchdog: not started"
fi

if [[ -f "$CRON_PID" ]]; then
    PID=$(cat "$CRON_PID")
    if kill -0 "$PID" 2>/dev/null; then ok "Cron:     running (PID $PID)"; else fail "Cron:     dead (stale PID $PID)"; fi
else
    warn "Cron:     not started"
fi

if curl -sf --max-time 3 http://localhost:5173 >/dev/null 2>&1; then
    ok "HTTP:     healthy (localhost:5173)"
else
    fail "HTTP:     unhealthy"
fi

export PATH="/home/runner/workspace/.config/npm/node_global/bin:$PATH"
if command -v opencode &>/dev/null; then
    ok "opencode: $(command -v opencode)"
else
    warn "opencode: not found"
fi

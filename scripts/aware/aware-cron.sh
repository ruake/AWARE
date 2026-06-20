#!/usr/bin/env bash
# AWARE Portal — Cron Daemon (user-level health loop)
set -euo pipefail

STATE_DIR="/home/runner/.aware"
PID_FILE="$STATE_DIR/aware.pid"
WATCHDOG_PID="$STATE_DIR/watchdog.pid"
LOG_DIR="$STATE_DIR/logs"
CRON_PID="$STATE_DIR/cron.pid"
HEALTH_URL="http://localhost:5173"
CHECK_INTERVAL=60
HEALTH_TIMEOUT=5

mkdir -p "$STATE_DIR" "$LOG_DIR"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [cron] $*" >> "$LOG_DIR/cron.log"; }

# Write our own PID (this is the actual script PID, not nohup's wrapper)
echo $$ > "$CRON_PID"

cleanup() { rm -f "$CRON_PID"; exit 0; }
trap cleanup SIGTERM SIGINT

is_healthy() {
    curl -sf --max-time "$HEALTH_TIMEOUT" "$HEALTH_URL" >/dev/null 2>&1
}

restart_server() {
    log "Restarting AWARE server..."
    /home/runner/workspace/scripts/aware/aware-stop.sh >> "$LOG_DIR/cron.log" 2>&1 || true
    sleep 3
    nohup /home/runner/workspace/scripts/aware/aware-start.sh >> "$LOG_DIR/startup.log" 2>&1 &
    log "Restart triggered."
}

ensure_watchdog() {
    if [[ -f "$WATCHDOG_PID" ]]; then
        WD_PID=$(cat "$WATCHDOG_PID")
        if kill -0 "$WD_PID" 2>/dev/null; then
            return 0
        fi
    fi
    log "Watchdog dead. Restarting..."
    touch "$STATE_DIR/watchdog.running"
    nohup /home/runner/workspace/scripts/aware/aware-watchdog.sh >> "$LOG_DIR/watchdog.log" 2>&1 &
    echo $! > "$WATCHDOG_PID"
    log "Watchdog restarted (PID $!)."
}

log "Cron daemon started (PID $$). Interval: ${CHECK_INTERVAL}s"

while true; do
    sleep "$CHECK_INTERVAL"
    ensure_watchdog
    if ! is_healthy; then
        log "Server unhealthy. Attempting restart..."
        restart_server
    fi
done

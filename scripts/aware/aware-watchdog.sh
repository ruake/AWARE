#!/usr/bin/env bash
# AWARE Portal — Self-Healing Watchdog
set -euo pipefail

AWARE_DIR="/home/runner/workspace/artifacts/aware-app"
STATE_DIR="/home/runner/.aware"
PID_FILE="$STATE_DIR/aware.pid"
LOG_DIR="$STATE_DIR/logs"
HEALTH_URL="http://localhost:5173"
CHECK_INTERVAL=30
HEALTH_TIMEOUT=10
MAX_CONSECUTIVE_FAILURES=3
RESTART_DELAY=5
WATCHDOG_LOG="$LOG_DIR/watchdog.log"

mkdir -p "$STATE_DIR" "$LOG_DIR"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [watchdog] $*" >> "$WATCHDOG_LOG"; }

# Write our own PID
echo $$ > "$STATE_DIR/watchdog.pid"

CONSECUTIVE_FAILURES=0
TOTAL_RESTARTS=0

is_server_alive() {
    # Check if anything is listening on port 5173
    lsof -ti :5173 >/dev/null 2>&1
}

is_server_healthy() {
    curl -sf --max-time "$HEALTH_TIMEOUT" "$HEALTH_URL" >/dev/null 2>&1
}

restart_server() {
    log "Attempting restart (attempt $((TOTAL_RESTARTS + 1)))..."
    TOTAL_RESTARTS=$((TOTAL_RESTARTS + 1))

    if [[ -f "$PID_FILE" ]]; then
        local old_pid
        old_pid=$(cat "$PID_FILE")
        if kill -0 "$old_pid" 2>/dev/null; then
            log "  Sending SIGTERM to PID $old_pid..."
            kill -TERM "$old_pid" 2>/dev/null || true
            for i in $(seq 1 10); do
                kill -0 "$old_pid" 2>/dev/null || break
                sleep 1
            done
            if kill -0 "$old_pid" 2>/dev/null; then
                log "  Graceful shutdown failed. Sending SIGKILL..."
                kill -9 "$old_pid" 2>/dev/null || true
                sleep 1
            fi
        fi
        rm -f "$PID_FILE"
    fi

    # Kill any orphaned processes on port 5173
    local orphans
    orphans=$(lsof -ti :5173 2>/dev/null || true)
    if [[ -n "$orphans" ]]; then
        log "  Killing orphaned processes on port 5173: $orphans"
        echo "$orphans" | xargs kill -9 2>/dev/null || true
        sleep 2
    fi

    sleep "$RESTART_DELAY"

    cd "$AWARE_DIR" || { log "  FATAL: AWARE directory not found!"; return 1; }
    nohup pnpm dev --host 0.0.0.0 --port 5173 >> "$LOG_DIR/aware-server.log" 2>&1 &
    local new_pid=$!
    echo "$new_pid" > "$PID_FILE"
    log "  Server restarted (PID $new_pid)."

    log "  Waiting for health check..."
    for i in $(seq 1 30); do
        if is_server_healthy; then
            log "  Restart health check PASSED."
            return 0
        fi
        if ! kill -0 "$new_pid" 2>/dev/null; then
            log "  Server died during restart health check."
            return 1
        fi
        sleep 2
    done
    log "  WARN: Health check timeout after restart."
    return 1
}

log "Watchdog started (PID $$). Interval: ${CHECK_INTERVAL}s"

while true; do
    sleep "$CHECK_INTERVAL"

    if [[ ! -f "$STATE_DIR/watchdog.running" ]]; then
        log "Watchdog stopping (no running flag)."
        exit 0
    fi

    if ! is_server_alive; then
        log "Server process NOT running."
        CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
        if [[ $CONSECUTIVE_FAILURES -ge $MAX_CONSECUTIVE_FAILURES ]]; then
            log " $CONSECUTIVE_FAILURES consecutive failures. Restarting..."
            if restart_server; then
                CONSECUTIVE_FAILURES=0
            fi
        else
            log "  Failure $CONSECUTIVE_FAILURES/$MAX_CONSECUTIVE_FAILURES. Waiting..."
        fi
        continue
    fi

    if ! is_server_healthy; then
        CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
        log "Server alive but unhealthy (failure $CONSECUTIVE_FAILURES/$MAX_CONSECUTIVE_FAILURES)."
        if [[ $CONSECUTIVE_FAILURES -ge $MAX_CONSECUTIVE_FAILURES ]]; then
            log "Max failures reached. Restarting..."
            if restart_server; then
                CONSECUTIVE_FAILURES=0
            fi
        fi
    else
        if [[ $CONSECUTIVE_FAILURES -gt 0 ]]; then
            log "Server recovered after $CONSECUTIVE_FAILURES failure(s). All good."
        fi
        CONSECUTIVE_FAILURES=0
    fi
done

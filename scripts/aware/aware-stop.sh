#!/usr/bin/env bash
# AWARE Portal — Graceful Shutdown
set -euo pipefail

STATE_DIR="/home/runner/.aware"
PID_FILE="$STATE_DIR/aware.pid"
WATCHDOG_PID="$STATE_DIR/watchdog.pid"
CRON_PID="$STATE_DIR/cron.pid"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# Stop watchdog
if [[ -f "$WATCHDOG_PID" ]]; then
    WD_PID=$(cat "$WATCHDOG_PID")
    if kill -0 "$WD_PID" 2>/dev/null; then
        log "Stopping watchdog (PID $WD_PID)..."
        kill -TERM "$WD_PID" 2>/dev/null || true
        for i in $(seq 1 5); do kill -0 "$WD_PID" 2>/dev/null || break; sleep 1; done
        kill -9 "$WD_PID" 2>/dev/null || true
        log "Watchdog stopped."
    fi
    rm -f "$WATCHDOG_PID"
fi
rm -f "$STATE_DIR/watchdog.running"

# Stop cron daemon
if [[ -f "$CRON_PID" ]]; then
    CRON_P=$(cat "$CRON_PID")
    if kill -0 "$CRON_P" 2>/dev/null; then
        log "Stopping cron daemon (PID $CRON_P)..."
        kill -TERM "$CRON_P" 2>/dev/null || true
        sleep 2
        kill -9 "$CRON_P" 2>/dev/null || true
        log "Cron daemon stopped."
    fi
    rm -f "$CRON_PID"
fi

# Stop the server
if [[ -f "$PID_FILE" ]]; then
    SERVER_PID=$(cat "$PID_FILE")
    if kill -0 "$SERVER_PID" 2>/dev/null; then
        log "Stopping AWARE server (PID $SERVER_PID)..."
        kill -TERM "$SERVER_PID" 2>/dev/null || true
        for i in $(seq 1 15); do kill -0 "$SERVER_PID" 2>/dev/null || break; sleep 1; done
        if kill -0 "$SERVER_PID" 2>/dev/null; then
            log "Graceful shutdown timed out. Sending SIGKILL..."
            kill -9 "$SERVER_PID" 2>/dev/null || true
        fi
        log "Server stopped."
    else
        log "Server already dead (PID $SERVER_PID)."
    fi
    rm -f "$PID_FILE"
else
    log "No PID file found. Nothing to stop."
fi

# Kill orphaned processes on port 5173
ORPHANS=$(lsof -ti :5173 2>/dev/null || true)
if [[ -n "$ORPHANS" ]]; then
    log "Killing orphaned processes on port 5173: $ORPHANS"
    echo "$ORPHANS" | xargs kill -9 2>/dev/null || true
fi

log "AWARE portal fully stopped."

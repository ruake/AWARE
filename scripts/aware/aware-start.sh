#!/usr/bin/env bash
# AWARE Portal — Master Launcher
set -euo pipefail

AWARE_DIR="/home/runner/workspace/artifacts/aware-app"
STATE_DIR="/home/runner/.aware"
LOG_DIR="$STATE_DIR/logs"
PID_FILE="$STATE_DIR/aware.pid"
WATCHDOG_PID="$STATE_DIR/watchdog.pid"
CRON_PID_FILE="$STATE_DIR/cron.pid"
HEALTH_URL="http://localhost:5173"
HEALTH_TIMEOUT=10
HEALTH_RETRIES=30
RETRY_DELAY=3
STARTUP_LOG="$STATE_DIR/logs/startup.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$STARTUP_LOG"; }
die() { log "FATAL: $*"; exit 1; }

mkdir -p "$STATE_DIR" "$LOG_DIR"

# Prevent duplicate starts
if [[ -f "$PID_FILE" ]]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        log "AWARE already running (PID $OLD_PID). Use 'aware-stop' first."
        exit 0
    else
        log "Stale PID file found (PID $OLD_PID dead). Cleaning up."
        rm -f "$PID_FILE"
    fi
fi

# Phase 1: Ensure opencode-ai
log "=== Phase 1: Ensuring opencode-ai ==="
export PATH="/home/runner/workspace/.config/npm/node_global/bin:$PATH"
if ! command -v opencode &>/dev/null; then
    log "opencode-ai not found. Installing globally..."
    for attempt in $(seq 1 3); do
        log "  Install attempt $attempt/3..."
        if npm install -g opencode-ai 2>&1 | tee -a "$STARTUP_LOG"; then
            log "  opencode-ai installed successfully."
            break
        fi
        log "  Install failed. Retrying in ${RETRY_DELAY}s..."
        sleep "$RETRY_DELAY"
    done
    if ! command -v opencode &>/dev/null; then
        die "Failed to install opencode-ai after 3 attempts."
    fi
fi
log "opencode-ai OK: $(command -v opencode)"

# Phase 2: Ensure AWARE dependencies
log "=== Phase 2: Ensuring AWARE dependencies ==="
cd "$AWARE_DIR" || die "AWARE directory not found: $AWARE_DIR"
if [[ ! -d "node_modules" ]] || [[ ! -d "node_modules/.pnpm" ]]; then
    log "node_modules missing. Running pnpm install..."
    pnpm install 2>&1 | tee -a "$STARTUP_LOG"
fi
log "Dependencies OK."

# Phase 3: Start the dev server
log "=== Phase 3: Starting AWARE dev server ==="
cd "$AWARE_DIR"

# Kill orphaned processes on port 5173
ORPHANS=$(lsof -ti :5173 2>/dev/null || true)
if [[ -n "$ORPHANS" ]]; then
    log "Killing orphaned processes on port 5173: $ORPHANS"
    echo "$ORPHANS" | xargs kill -9 2>/dev/null || true
    sleep 2
fi

nohup pnpm dev --host 0.0.0.0 --port 5173 >> "$LOG_DIR/aware-server.log" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"
log "Dev server started (PID $SERVER_PID). Waiting for health..."

# Phase 4: Health check
log "=== Phase 4: Health check ==="
health_ok=false
for i in $(seq 1 $HEALTH_RETRIES); do
    if curl -sf --max-time "$HEALTH_TIMEOUT" "$HEALTH_URL" >/dev/null 2>&1; then
        log "Health check PASSED on attempt $i."
        health_ok=true
        break
    fi
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
        log "Server process died during health check (attempt $i)."
        break
    fi
    log "  Waiting... ($i/$HEALTH_RETRIES)"
    sleep 2
done
if [[ "$health_ok" != "true" ]]; then
    log "WARN: Health check did not pass. Check $LOG_DIR/aware-server.log"
fi

# Phase 5: Start the watchdog
log "=== Phase 5: Starting watchdog ==="
if [[ -f "$WATCHDOG_PID" ]]; then
    OLD_WD=$(cat "$WATCHDOG_PID")
    if kill -0 "$OLD_WD" 2>/dev/null; then
        log "Watchdog already running (PID $OLD_WD). Skipping."
    else
        rm -f "$WATCHDOG_PID"
    fi
fi
if [[ ! -f "$WATCHDOG_PID" ]]; then
    touch "$STATE_DIR/watchdog.running"
    nohup /home/runner/workspace/scripts/aware/aware-watchdog.sh >> "$LOG_DIR/watchdog.log" 2>&1 &
    log "Watchdog launched (nohup PID $!). Waiting for daemon to self-register..."
    for w in $(seq 1 3); do
        [[ -f "$WATCHDOG_PID" ]] && break
        sleep 1
    done
    log "Watchdog started (PID $(cat "$WATCHDOG_PID" 2>/dev/null || echo 'unknown'))."
fi

# Phase 6: Start the cron daemon
log "=== Phase 6: Starting cron daemon ==="
if [[ -f "$CRON_PID_FILE" ]]; then
    OLD_CRON=$(cat "$CRON_PID_FILE")
    if kill -0 "$OLD_CRON" 2>/dev/null; then
        log "Cron daemon already running (PID $OLD_CRON). Skipping."
    else
        rm -f "$CRON_PID_FILE"
    fi
fi
if [[ ! -f "$CRON_PID_FILE" ]]; then
    nohup /home/runner/workspace/scripts/aware/aware-cron.sh >> "$LOG_DIR/cron.log" 2>&1 &
    log "Cron daemon launched (nohup PID $!). Waiting for daemon to self-register..."
    # Wait for daemon to write its own PID (up to 3s)
    for w in $(seq 1 3); do
        [[ -f "$CRON_PID_FILE" ]] && break
        sleep 1
    done
    log "Cron daemon started (PID $(cat "$CRON_PID_FILE" 2>/dev/null || echo 'unknown'))."
fi

log "=== AWARE startup complete ==="
log "  Portal:   $HEALTH_URL"
log "  Logs:     $LOG_DIR/"
log "  PID:      $(cat "$PID_FILE" 2>/dev/null)"
log "  Watchdog: $(cat "$WATCHDOG_PID" 2>/dev/null)"
log "  Cron:     $(cat "$CRON_PID_FILE" 2>/dev/null)"

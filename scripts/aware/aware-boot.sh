#!/usr/bin/env bash
# AWARE Portal — Boot entry (flock-protected, idempotent)
set -euo pipefail

STATE_DIR="/home/runner/.aware"
LOCK_FILE="$STATE_DIR/boot.lock"
START_SCRIPT="/home/runner/workspace/scripts/aware/aware-start.sh"

exec 200>"$LOCK_FILE"
if ! flock -n 200; then
    exit 0
fi

if [[ -f "$STATE_DIR/aware.pid" ]]; then
    PID=$(cat "$STATE_DIR/aware.pid")
    if kill -0 "$PID" 2>/dev/null; then
        exit 0
    fi
fi

nohup "$START_SCRIPT" >> "$STATE_DIR/logs/boot.log" 2>&1 &
disown
flock -u 200

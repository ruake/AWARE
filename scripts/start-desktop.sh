#!/usr/bin/env bash
set -e

DISPLAY_NUM=99
VNC_PORT=$((5900 + DISPLAY_NUM))
WS_PORT=8080
NOVNC_DIR=/nix/store/n7h60i6lqysmya4clas5vghfsjc6sspa-novnc-1.6.0/share/webapps/novnc
WEBSOCKIFY=/home/runner/workspace/.pythonlibs/bin/websockify

echo "[desktop] Cleaning up stale locks..."
rm -f /tmp/.X${DISPLAY_NUM}-lock /tmp/.X11-unix/X${DISPLAY_NUM} 2>/dev/null || true
pkill -f "Xvnc :${DISPLAY_NUM}" 2>/dev/null || true
pkill -f "websockify.*${WS_PORT}" 2>/dev/null || true
sleep 1

echo "[desktop] Starting Xvnc on display :${DISPLAY_NUM} (VNC port ${VNC_PORT})..."
Xvnc :${DISPLAY_NUM} \
  -geometry 1280x720 \
  -depth 24 \
  -SecurityTypes None \
  -AlwaysShared \
  -BlacklistThreshold 0 \
  -BlacklistTimeout 0 \
  -rfbport ${VNC_PORT} \
  -desktop "AWARE Desktop" \
  &
XVNC_PID=$!
echo "[desktop] Xvnc PID=${XVNC_PID}"

# Wait for Xvnc to be ready
for i in $(seq 1 20); do
  if xdpyinfo -display :${DISPLAY_NUM} >/dev/null 2>&1; then
    echo "[desktop] Xvnc ready on :${DISPLAY_NUM}"
    break
  fi
  sleep 0.5
done

export DISPLAY=:${DISPLAY_NUM}
export HOME=/tmp/desktop-home
mkdir -p $HOME

echo "[desktop] Starting window manager (openbox)..."
openbox --sm-disable &

sleep 1

echo "[desktop] Setting background..."
xsetroot -solid "#1a1a2e" 2>/dev/null || true

echo "[desktop] Starting xterm..."
xterm \
  -geometry 100x28+0+390 \
  -fa "Monospace" -fs 12 \
  -bg "#0d1117" -fg "#c9d1d9" \
  -title "Terminal" \
  -e "bash --login" \
  &

sleep 1

echo "[desktop] Starting Firefox..."
firefox \
  --no-remote \
  --new-instance \
  "http://localhost:20857" \
  2>/dev/null &

echo "[desktop] Starting websockify (noVNC) on port ${WS_PORT}..."
echo "[desktop] noVNC viewer → http://localhost:${WS_PORT}/vnc.html"

exec $WEBSOCKIFY \
  --web="${NOVNC_DIR}" \
  --heartbeat=30 \
  ${WS_PORT} \
  localhost:${VNC_PORT}

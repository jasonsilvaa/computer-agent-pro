#!/bin/bash
set -e

Xvfb :99 -screen 0 1280x960x24 &
sleep 3

# Start x11vnc
x11vnc -display :99 -forever -shared -rfbport 5900 &
sleep 2

# noVNC (websockify proxies VNC to HTTP/WebSocket)
websockify --web=/usr/share/novnc 6080 localhost:5900 &

# Start Desktop API
python /app/api.py

#!/bin/bash
set -euo pipefail

export DISPLAY=:99
export XDG_RUNTIME_DIR=/tmp/runtime-root
DESKTOP_WIDTH="${DESKTOP_WIDTH:-1280}"
DESKTOP_HEIGHT="${DESKTOP_HEIGHT:-720}"
mkdir -p "${XDG_RUNTIME_DIR}"
chmod 700 "${XDG_RUNTIME_DIR}"

rm -f /tmp/.X99-lock
rm -f /tmp/.X11-unix/X99

wait_for_command() {
  local command="$1"
  local timeout="$2"
  local error_message="$3"

  for _ in $(seq 1 "${timeout}"); do
    if eval "${command}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  echo "${error_message}" >&2
  exit 1
}

Xvfb :99 -screen 0 "${DESKTOP_WIDTH}x${DESKTOP_HEIGHT}x24" -ac +extension RANDR &

# Wait for the virtual display to be reachable.
wait_for_command "xdpyinfo -display :99" 30 "Xvfb did not become ready on :99"

# Create X authority so Python/pyautogui (Xlib) can connect to :99 for mouse/keyboard.
export XAUTHORITY="${XAUTHORITY:-/root/.Xauthority}"
touch "$XAUTHORITY"
xauth -f "$XAUTHORITY" add :99 . $(mcookie)

eval "$(dbus-launch --sh-syntax)"

# Start a real XFCE desktop session so noVNC shows an actual Linux desktop.
startxfce4 >/tmp/xfce.log 2>&1 &

# Wait until xfce components are alive before exposing VNC.
wait_for_command "pgrep -f 'xfce4-session|xfwm4|xfdesktop'" 30 "XFCE desktop session did not become ready"

x11vnc -display :99 -forever -shared -rfbport 5900 -nopw -xkb >/tmp/x11vnc.log 2>&1 &
websockify --web=/usr/share/novnc 6080 localhost:5900 >/tmp/novnc.log 2>&1 &

wait_for_command "nc -z 127.0.0.1 5900" 15 "x11vnc did not start on port 5900"
wait_for_command "nc -z 127.0.0.1 6080" 15 "websockify did not start on port 6080"

python /app/api.py

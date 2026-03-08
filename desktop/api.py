"""
Desktop API - HTTP server for screenshot, mouse, keyboard, browser.
Runs inside Xvfb (DISPLAY=:99) with pyautogui.
"""

import io
import os
import socket
import subprocess
import sys
import time
import unicodedata

from flask import Flask, jsonify, request

app = Flask(__name__)

# Lazy import - pyautogui needs DISPLAY
_pyautogui = None
_mss = None


def _get_pyautogui():
    global _pyautogui
    if _pyautogui is None:
        import pyautogui
        _pyautogui = pyautogui
    return _pyautogui


def _get_mss():
    global _mss
    if _mss is None:
        import mss
        _mss = mss
    return _mss


def _ascii_sanitize(text: str) -> str:
    """Remove accents for keyboard input (avoids 500 on non-ASCII)."""
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if not unicodedata.combining(c)
    )


def _capture_pil_image():
    sct = _get_mss()
    with sct.mss() as m:
        mon = m.monitors[0]
        img = m.grab(mon)
    from PIL import Image
    return Image.frombytes("RGB", img.size, img.bgra, "raw", "BGRX")


def _is_process_running(pattern: str) -> bool:
    return (
        subprocess.run(
            ["pgrep", "-f", pattern],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        ).returncode
        == 0
    )


def _is_port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        return sock.connect_ex((host, port)) == 0


def _get_desktop_health() -> dict:
    screenshot_error = None
    dark_ratio = 1.0
    screen_size = None
    screen_visible = False
    try:
        image = _capture_pil_image()
        screen_size = [image.width, image.height]
        grayscale = image.convert("L")
        histogram = grayscale.histogram()
        dark_pixels = sum(histogram[:8])
        total_pixels = grayscale.width * grayscale.height or 1
        dark_ratio = dark_pixels / total_pixels
        screen_visible = dark_ratio < 0.98
    except Exception as exc:
        screenshot_error = str(exc)

    xfce_running = any(
        _is_process_running(pattern)
        for pattern in ("xfce4-session", "xfwm4", "xfdesktop")
    )
    x11vnc_running = _is_process_running("x11vnc")
    websockify_running = _is_process_running("websockify")
    vnc_port_open = _is_port_open("127.0.0.1", 5900)
    novnc_port_open = _is_port_open("127.0.0.1", 6080)
    ready = (
        screenshot_error is None
        and xfce_running
        and x11vnc_running
        and websockify_running
        and vnc_port_open
        and novnc_port_open
    )
    return {
        "display": os.environ.get("DISPLAY", ":99"),
        "xfce_running": xfce_running,
        "x11vnc_running": x11vnc_running,
        "websockify_running": websockify_running,
        "vnc_port_open": vnc_port_open,
        "novnc_port_open": novnc_port_open,
        "screen_size": screen_size,
        "dark_ratio": dark_ratio,
        "screen_visible": screen_visible,
        "screenshot_error": screenshot_error,
        "ready": ready,
    }


@app.route("/health", methods=["GET"])
def health():
    status = _get_desktop_health()
    return jsonify(status), 200 if status["ready"] else 503


@app.route("/screenshot", methods=["GET"])
def screenshot():
    im = _capture_pil_image()
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue(), 200, {"Content-Type": "image/png"}


@app.route("/mouse/move", methods=["POST"])
def mouse_move():
    pa = _get_pyautogui()
    data = request.get_json() or {}
    x, y = int(data.get("x", 0)), int(data.get("y", 0))
    pa.moveTo(x, y, duration=0.05)
    return jsonify({"ok": True})


@app.route("/mouse/click", methods=["POST"])
def mouse_click():
    pa = _get_pyautogui()
    data = request.get_json() or {}
    btn = data.get("button", "left")
    x, y = data.get("x"), data.get("y")
    if x is not None and y is not None:
        pa.click(x, y, button=btn)
    else:
        pa.click(button=btn)
    return jsonify({"ok": True})


@app.route("/mouse/double_click", methods=["POST"])
def mouse_double_click():
    pa = _get_pyautogui()
    pa.doubleClick()
    return jsonify({"ok": True})


@app.route("/mouse/drag", methods=["POST"])
def mouse_drag():
    pa = _get_pyautogui()
    data = request.get_json() or {}
    x1, y1 = int(data.get("x1", 0)), int(data.get("y1", 0))
    x2, y2 = int(data.get("x2", 0)), int(data.get("y2", 0))
    pa.moveTo(x1, y1)
    pa.drag(x2 - x1, y2 - y1, duration=0.3)
    return jsonify({"ok": True})


@app.route("/mouse/scroll", methods=["POST"])
def mouse_scroll():
    pa = _get_pyautogui()
    data = request.get_json() or {}
    direction = data.get("direction", "down")
    amount = int(data.get("amount", 2))
    clicks = amount if direction == "down" else -amount
    pa.scroll(clicks)
    return jsonify({"ok": True})


@app.route("/keyboard/type", methods=["POST"])
def keyboard_type():
    pa = _get_pyautogui()
    data = request.get_json() or {}
    text = _ascii_sanitize(str(data.get("text", "")))
    pa.write(text, interval=0.03)
    return jsonify({"ok": True})


@app.route("/keyboard/press", methods=["POST"])
def keyboard_press():
    pa = _get_pyautogui()
    data = request.get_json() or {}
    keys = data.get("keys", [])
    if len(keys) == 1:
        pa.press(keys[0])
    elif len(keys) > 1:
        pa.hotkey(*keys)
    return jsonify({"ok": True})


def _open_browser_cmd(url: str, browser: str, env: dict):
    """Launch browser on DISPLAY :99. Prefer Firefox (reliable in Xvfb); fallback to Playwright Chromium."""
    # Ensure X is available to the child process
    env["DISPLAY"] = ":99"
    env.setdefault("XAUTHORITY", "/root/.Xauthority")
    if browser == "chromium":
        # Try system Chromium first (if installed), then Playwright
        for cmd in (
            ["chromium-browser", "--no-sandbox", "--disable-dev-shm-usage", url],
            ["chromium", "--no-sandbox", "--disable-dev-shm-usage", url],
            [sys.executable, "-m", "playwright", "open", "--browser", "chromium", url],
        ):
            try:
                subprocess.Popen(
                    cmd,
                    env=env,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    start_new_session=True,
                )
                return
            except FileNotFoundError:
                continue
        # Fallback to Firefox
        subprocess.Popen(
            ["firefox", "--new-window", url],
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
    else:
        subprocess.Popen(
            ["firefox", "--new-window", url],
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )


@app.route("/open_browser", methods=["POST"])
def open_browser():
    data = request.get_json() or {}
    url = data.get("url", "https://google.com")
    browser = str(data.get("browser", "chromium")).lower()
    if not url.startswith("http"):
        url = f"https://{url}"
    env = os.environ.copy()
    try:
        _open_browser_cmd(url, browser, env)
    except Exception:
        env["DISPLAY"] = ":99"
        env.setdefault("XAUTHORITY", "/root/.Xauthority")
        subprocess.Popen(
            ["firefox", "--new-window", url],
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
    time.sleep(1.5)
    return jsonify({"ok": True, "url": url, "browser": browser})


@app.route("/run_command", methods=["POST"])
def run_command():
    data = request.get_json() or {}
    cmd = data.get("command", "")
    background = data.get("background", False)
    env = os.environ.copy()
    env["DISPLAY"] = ":99"
    if background:
        subprocess.Popen(
            cmd,
            shell=True,
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return jsonify({"ok": True, "output": ""})
    r = subprocess.run(cmd, shell=True, env=env, capture_output=True, text=True, timeout=60)
    return jsonify({"ok": r.returncode == 0, "output": r.stdout or r.stderr or ""})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

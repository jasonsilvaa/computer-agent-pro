"""
Desktop API - HTTP server for screenshot, mouse, keyboard, browser.
Runs inside Xvfb (DISPLAY=:99) with pyautogui.
"""

import io
import os
import subprocess
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


@app.route("/screenshot", methods=["GET"])
def screenshot():
    sct = _get_mss()
    with sct.mss() as m:
        mon = m.monitors[0]
        img = m.grab(mon)
    from PIL import Image
    im = Image.frombytes("RGB", img.size, img.bgra, "raw", "BGRX")
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue(), 200, {"Content-Type": "image/png"}


@app.route("/mouse/move", methods=["POST"])
def mouse_move():
    pa = _get_pyautogui()
    data = request.get_json() or {}
    x, y = int(data.get("x", 0)), int(data.get("y", 0))
    pa.moveTo(x, y)
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
    pa.write(text, interval=0.075)
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


@app.route("/open_browser", methods=["POST"])
def open_browser():
    data = request.get_json() or {}
    url = data.get("url", "https://google.com")
    if not url.startswith("http"):
        url = f"https://{url}"
    env = os.environ.copy()
    env["DISPLAY"] = ":99"
    subprocess.Popen(
        ["firefox", url],
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return jsonify({"ok": True})


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

"""
Mock Desktop API for Windows. Same endpoints as desktop/api.py but no real
mouse/keyboard/screenshot - so the backend and agent can run without WSL/Linux.
Run: pip install flask pillow && python desktop_mock_win.py  (from repo root or desktop/)
"""

import io
from flask import Flask, jsonify, request

app = Flask(__name__)

# 1280x720 black PNG so backend/model get expected size
def _black_png():
    try:
        from PIL import Image
        buf = io.BytesIO()
        Image.new("RGB", (1280, 720), (0, 0, 0)).save(buf, format="PNG")
        return buf.getvalue()
    except Exception:
        # minimal 1x1 PNG fallback
        return (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
        )


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "ready": True,
        "display": ":0",
        "screen_size": [1280, 720],
        "screenshot_error": None,
    }), 200


@app.route("/screenshot", methods=["GET"])
def screenshot():
    return _black_png(), 200, {"Content-Type": "image/png"}


@app.route("/mouse/move", methods=["POST"])
def mouse_move():
    return jsonify({"ok": True})


@app.route("/mouse/click", methods=["POST"])
def mouse_click():
    return jsonify({"ok": True})


@app.route("/mouse/double_click", methods=["POST"])
def mouse_double_click():
    return jsonify({"ok": True})


@app.route("/mouse/drag", methods=["POST"])
def mouse_drag():
    return jsonify({"ok": True})


@app.route("/mouse/scroll", methods=["POST"])
def mouse_scroll():
    return jsonify({"ok": True})


@app.route("/keyboard/type", methods=["POST"])
def keyboard_type():
    return jsonify({"ok": True})


@app.route("/keyboard/press", methods=["POST"])
def keyboard_press():
    return jsonify({"ok": True})


@app.route("/open_browser", methods=["POST"])
def open_browser():
    data = request.get_json() or {}
    url = data.get("url", "https://google.com")
    return jsonify({"ok": True, "url": url, "browser": "chromium"}), 200


@app.route("/run_command", methods=["POST"])
def run_command():
    data = request.get_json() or {}
    return jsonify({"ok": True, "output": ""}), 200


if __name__ == "__main__":
    print("Desktop mock (Windows) at http://localhost:5000 - no real automation")
    app.run(host="0.0.0.0", port=5000)

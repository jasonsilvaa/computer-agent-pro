"""
Local desktop adapter - mimics e2b Sandbox interface using HTTP Desktop API.
Used when E2B_API_KEY is not set (fully local mode).
"""

import os
import time
from typing import Any

import httpx

DESKTOP_API_URL = os.getenv("DESKTOP_API_URL", "http://desktop:5000")
VNC_URL = os.getenv("VNC_URL", "http://localhost:6080/vnc.html")
WIDTH = 1280
HEIGHT = 960


class LocalStream:
    """Mock stream object for VNC URL (local noVNC)."""

    def get_url(
        self,
        auto_connect: bool = True,
        view_only: bool = False,
        resize: str = "scale",
        auth_key: str | None = None,
    ) -> str:
        return VNC_URL

    def get_auth_key(self) -> str:
        return ""


class LocalCommands:
    """Mock commands object - runs via Desktop API."""

    def __init__(self, api_url: str):
        self._api_url = api_url

    def run(self, cmd: str, background: bool = False) -> str:
        with httpx.Client(timeout=30) as client:
            r = client.post(
                f"{self._api_url}/run_command",
                json={"command": cmd, "background": background},
            )
            r.raise_for_status()
            return r.json().get("output", "")


class LocalDesktop:
    """
    Local desktop that implements the e2b Sandbox interface.
    Talks to a Desktop API (Xvfb + pyautogui) over HTTP.
    """

    def __init__(self, api_url: str | None = None):
        self._api_url = (api_url or DESKTOP_API_URL).rstrip("/")
        self.stream = LocalStream()
        self.commands = LocalCommands(self._api_url)

    def get_screen_size(self) -> tuple[int, int]:
        return (WIDTH, HEIGHT)

    def screenshot(self) -> bytes:
        with httpx.Client(timeout=30) as client:
            r = client.get(f"{self._api_url}/screenshot")
            r.raise_for_status()
            return r.content

    def move_mouse(self, x: int, y: int) -> None:
        with httpx.Client(timeout=10) as client:
            client.post(
                f"{self._api_url}/mouse/move",
                json={"x": x, "y": y},
            ).raise_for_status()

    def left_click(self) -> None:
        with httpx.Client(timeout=10) as client:
            client.post(f"{self._api_url}/mouse/click", json={"button": "left"}).raise_for_status()

    def right_click(self) -> None:
        with httpx.Client(timeout=10) as client:
            client.post(f"{self._api_url}/mouse/click", json={"button": "right"}).raise_for_status()

    def double_click(self) -> None:
        with httpx.Client(timeout=10) as client:
            client.post(f"{self._api_url}/mouse/double_click").raise_for_status()

    def drag(self, origin: list[int], destination: list[int]) -> None:
        with httpx.Client(timeout=10) as client:
            client.post(
                f"{self._api_url}/mouse/drag",
                json={
                    "x1": origin[0],
                    "y1": origin[1],
                    "x2": destination[0],
                    "y2": destination[1],
                },
            ).raise_for_status()

    def scroll(self, direction: str = "down", amount: int = 2) -> None:
        with httpx.Client(timeout=10) as client:
            client.post(
                f"{self._api_url}/mouse/scroll",
                json={"direction": direction, "amount": amount},
            ).raise_for_status()

    def write(self, text: str, delay_in_ms: int = 75) -> None:
        with httpx.Client(timeout=30) as client:
            client.post(
                f"{self._api_url}/keyboard/type",
                json={"text": text},
            ).raise_for_status()
        if delay_in_ms > 0:
            time.sleep(delay_in_ms / 1000.0)

    def press(self, keys: list[str]) -> None:
        with httpx.Client(timeout=10) as client:
            client.post(
                f"{self._api_url}/keyboard/press",
                json={"keys": keys},
            ).raise_for_status()

    def open(self, url: str) -> None:
        with httpx.Client(timeout=10) as client:
            client.post(
                f"{self._api_url}/open_browser",
                json={"url": url},
            ).raise_for_status()

    def kill(self) -> None:
        """No-op for local desktop - it's a shared service."""
        pass

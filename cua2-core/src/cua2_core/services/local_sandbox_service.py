"""
Local sandbox service - uses shared LocalDesktop (no E2B).
When E2B_API_KEY is not set, this service provides a single shared desktop.
"""

from typing import Literal

from pydantic import BaseModel

from cua2_core.services.local_desktop import LocalDesktop


class SandboxResponse(BaseModel):
    model_config = {"arbitrary_types_allowed": True}

    sandbox: LocalDesktop | None
    state: Literal["creating", "ready", "max_sandboxes_reached"]
    error: str | None = None


class LocalSandboxService:
    """Single shared local desktop - no cloud, no API keys."""

    def __init__(self, max_sandboxes: int = 50):
        self.max_sandboxes = max_sandboxes
        self._desktop: LocalDesktop | None = None

    def _get_desktop(self) -> LocalDesktop:
        if self._desktop is None:
            self._desktop = LocalDesktop()
        return self._desktop

    async def acquire_sandbox(self, session_hash: str) -> SandboxResponse:
        """Return shared local desktop once the desktop service is really ready."""
        desktop = self._get_desktop()
        try:
            status = desktop.health()
        except Exception as exc:
            return SandboxResponse(
                sandbox=None,
                state="creating",
                error=f"Desktop healthcheck failed: {exc}",
            )

        if not status.get("ready"):
            reason = (
                f"Desktop not ready yet "
                f"(xfce_running={status.get('xfce_running')}, dark_ratio={status.get('dark_ratio')})"
            )
            return SandboxResponse(
                sandbox=None,
                state="creating",
                error=reason,
            )

        return SandboxResponse(
            sandbox=desktop,
            state="ready",
        )

    async def release_sandbox(self, session_hash: str) -> None:
        """No-op - shared desktop stays alive."""
        pass

    async def get_sandbox_counts(self) -> tuple[int, int]:
        return (1, 0)

    def start_periodic_cleanup(self) -> None:
        pass

    def stop_periodic_cleanup(self) -> None:
        pass

    async def cleanup_sandboxes(self) -> None:
        pass

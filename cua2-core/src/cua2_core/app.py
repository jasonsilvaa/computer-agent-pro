import os
from contextlib import asynccontextmanager

from cua2_core.services.agent_service import AgentService
from cua2_core.services.agent_utils.get_model import get_app_mode
from cua2_core.services.local_sandbox_service import LocalSandboxService
from cua2_core.websocket.websocket_manager import WebSocketManager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()


def _create_sandbox_service(max_sandboxes: int):
    """Create the sandbox service for the configured app mode."""
    app_mode = get_app_mode()
    if app_mode == "local":
        return LocalSandboxService(max_sandboxes=max_sandboxes)

    if not os.getenv("HF_TOKEN"):
        raise ValueError("HF_TOKEN is required when APP_MODE=original")
    if not os.getenv("E2B_API_KEY"):
        raise ValueError("E2B_API_KEY is required when APP_MODE=original")

    from cua2_core.services.sandbox_service import SandboxService

    return SandboxService(max_sandboxes=max_sandboxes)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup: Initialize services
    print("Initializing services...")

    app_mode = get_app_mode()
    max_sandboxes = 1 if app_mode == "local" else 600
    websocket_manager = WebSocketManager()
    sandbox_service = _create_sandbox_service(max_sandboxes)
    agent_service = AgentService(websocket_manager, sandbox_service, max_sandboxes)

    # Start periodic cleanup (no-op for local)
    sandbox_service.start_periodic_cleanup()

    # Store services in app state for access in routes
    app.state.websocket_manager = websocket_manager
    app.state.sandbox_service = sandbox_service
    app.state.agent_service = agent_service

    print(
        f"Services initialized successfully (mode: {app_mode}, max_sandboxes: {max_sandboxes})"
    )

    yield

    print("Shutting down services...")
    sandbox_service.stop_periodic_cleanup()
    await agent_service.cleanup()
    await sandbox_service.cleanup_sandboxes()
    print("Services shut down successfully")


# Create FastAPI app with lifespan
app = FastAPI(
    title="Computer Use Backend",
    description="Backend API for Computer Use - AI-powered automation interface",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

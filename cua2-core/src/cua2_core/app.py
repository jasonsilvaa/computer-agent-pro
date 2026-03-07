import os
from contextlib import asynccontextmanager

from cua2_core.services.agent_service import AgentService
from cua2_core.services.local_sandbox_service import LocalSandboxService
from cua2_core.websocket.websocket_manager import WebSocketManager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()


def _create_sandbox_service(max_sandboxes: int):
    """Use LocalSandboxService (no E2B/HF keys) or E2B when E2B_API_KEY is set."""
    if os.getenv("E2B_API_KEY"):
        from cua2_core.services.sandbox_service import SandboxService
        return SandboxService(max_sandboxes=max_sandboxes)
    return LocalSandboxService(max_sandboxes=max_sandboxes)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup: Initialize services
    print("Initializing services...")

    max_sandboxes = 600
    websocket_manager = WebSocketManager()
    sandbox_service = _create_sandbox_service(max_sandboxes)
    agent_service = AgentService(websocket_manager, sandbox_service, max_sandboxes)

    # Start periodic cleanup (no-op for local)
    sandbox_service.start_periodic_cleanup()

    # Store services in app state for access in routes
    app.state.websocket_manager = websocket_manager
    app.state.sandbox_service = sandbox_service
    app.state.agent_service = agent_service

    mode = "E2B cloud" if os.getenv("E2B_API_KEY") else "local (no API keys)"
    print(f"Services initialized successfully (mode: {mode})")

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

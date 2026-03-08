# CUA2 - Computer Use Agent

An AI-powered automation interface featuring real-time agent task processing, VNC streaming, and step-by-step execution visualization.

Based on [smolagents/computer-use-agent](https://huggingface.co/spaces/smolagents/computer-use-agent), this fork now supports two explicit runtime modes:

- `APP_MODE=original`: closest to the upstream architecture, using Hugging Face inference plus E2B sandboxes
- `APP_MODE=local`: local desktop automation with Ollama and the bundled `desktop` container

---

## Features

- **Explicit runtime selection**: choose `original` or `local` with `APP_MODE`
- **Original-compatible path**: supports Hugging Face + E2B as the canonical mode
- **Local runtime**: uses Ollama plus the bundled desktop container
- **VNC desktop**: real-time view of the agent's virtual desktop in local mode
- **4GB VRAM optimized local defaults**: local model list prioritizes `qwen3-vl:2b`

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- ~8GB RAM recommended
- GPU optional (CPU works, but slower)

---

## Quick Start

### Local mode with Docker Compose

`docker-compose.yml` is the local runtime and sets `APP_MODE=local`.

```bash
git clone https://github.com/jasonsilvaa/computer-agent-pro.git
cd computer-agent-pro
docker compose up --build
```

1. On first run, Ollama pulls the local models automatically. Wait 2-5 minutes.
2. Open `http://localhost:7860` for the main UI.
3. Open `http://localhost:6080/vnc.html` to inspect the local desktop stream.

### Como replicar (replicação em um comando)

Para replicar o projeto em outra máquina com um único comando, use os scripts de setup:

- **Linux / macOS:** `./scripts/setup.sh` (após `chmod +x scripts/setup.sh`)
- **Windows (PowerShell):** `.\scripts\setup.ps1`

Guia completo (pré-requisitos, estrutura, troubleshooting): **[docs/REPLICATION.md](./docs/REPLICATION.md)**.

### Original-compatible mode

Create `cua2-core/.env` based on `cua2-core/env.example` and set:

```env
APP_MODE=original
HF_TOKEN=your_huggingface_token
E2B_API_KEY=your_e2b_api_key
```

In this mode the backend requires both credentials and uses the original cloud-style path instead of the local desktop runtime.

---

## Make Commands

| Command | Description |
|---------|-------------|
| `make compose-up` | Start all services (foreground) |
| `make compose-up-d` | Start in background |
| `make compose-down` | Stop all services |
| `make docker-logs` | Stream logs from all containers |
| `make dev-backend` | Run backend with hot reload |
| `make dev-frontend` | Run frontend dev server |

---

## View Logs

```bash
# All services
docker compose logs -f

# Only CUA2 backend
docker compose logs -f cua2

# Last 100 lines
docker compose logs --tail=100 cua2
```

---

## Project Structure

```
computer-agent-pro/
├── cua2-core/          # Backend (FastAPI, agent logic)
├── cua2-front/         # Frontend (React + Vite)
├── desktop/            # Virtual desktop container (noVNC + API)
├── ollama/             # Ollama container for local LLMs
├── scripts/            # setup.sh, setup.ps1, pull_models.sh, pull_models.ps1
├── docs/               # REPLICATION.md (guia de replicação)
├── docker-compose.yml
├── Dockerfile
└── Makefile
```

---

## Architecture

For the full technical architecture, including containers, backend services, frontend state, execution flow, WebSocket events, and repository layout, see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## Configuration

### Runtime modes

The backend no longer falls back silently based on missing tokens. Set the mode explicitly:

```env
APP_MODE=original
```

or:

```env
APP_MODE=local
```

### `APP_MODE=original`

Required:

```env
APP_MODE=original
HF_TOKEN=your_huggingface_token
E2B_API_KEY=your_e2b_api_key
```

Behavior:

- uses Hugging Face inference models
- uses `SandboxService`
- matches the upstream runtime more closely

### `APP_MODE=local`

Typical local variables:

```env
APP_MODE=local
DESKTOP_API_URL=http://desktop:5000
OLLAMA_BASE_URL=http://ollama:11434
VNC_URL=http://localhost:6080/vnc.html
DESKTOP_WIDTH=1280
DESKTOP_HEIGHT=720
```

Behavior:

- uses Ollama multimodal models
- uses `LocalSandboxService`
- exposes the local VNC stream

### GPU support (RTX 3050 4GB)

GPU is enabled in `docker-compose.yml` for NVIDIA. Requirements:

- **Windows (Docker Desktop)**: Settings → Resources → WSL Integration → enable "Use the WSL 2 based engine" and restart. Keep NVIDIA drivers updated.
- **Linux**: Install [nvidia-container-toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html).

Default models (llava, qwen3-vl:2b, qwen3-vl:4b) are suitable for 4GB VRAM.

---

## Local Development

```bash
# Install dependencies
make sync

# Terminal 1: Backend
make dev-backend

# Terminal 2: Frontend
make dev-frontend
```

Backend runs on port 8000, frontend on its dev port. For the bundled local runtime (`APP_MODE=local` with desktop + Ollama), use `docker compose up` instead.

---

## Pre-pull Models (optional)

If you want to pull models before first use:

```bash
# Start only Ollama
docker compose up -d ollama

# Wait for healthy, then:
./scripts/pull_models.sh       # Linux/macOS
# or
.\scripts\pull_models.ps1      # Windows PowerShell
```

---

## Credits

- Original project: [smolagents/computer-use-agent](https://huggingface.co/spaces/smolagents/computer-use-agent) by [smolagents](https://github.com/huggingface/smolagents)
- Built with [smolagents](https://github.com/huggingface/smolagents), [Ollama](https://ollama.ai), and [noVNC](https://github.com/novnc/noVNC)

---

## License

See the original project for license terms.

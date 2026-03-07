# CUA2 - Computer Use Agent

An AI-powered automation interface featuring real-time agent task processing, VNC streaming, and step-by-step execution visualization.

Based on [smolagents/computer-use-agent](https://huggingface.co/spaces/smolagents/computer-use-agent), this fork runs **fully locally** without `HF_TOKEN` or `E2B_API_KEY` — using Ollama and a local desktop sandbox instead.

---

## Features

- **Local-first**: No API keys required — runs entirely on your machine
- **Ollama integration**: Uses vision-language models (llava, qwen3-vl) via Ollama
- **VNC desktop**: Real-time view of the agent's virtual desktop
- **Cloud mode (optional)**: Set `HF_TOKEN` and `E2B_API_KEY` to use HuggingFace + E2B sandboxes
- **4GB VRAM optimized**: Default models tuned for modest GPUs

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- ~8GB RAM recommended
- GPU optional (CPU works, but slower)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/jasonsilvaa/computer-agent-pro.git
cd computer-agent-pro

# Start all services (CUA2, desktop, Ollama)
docker compose up --build
```

1. **First run**: Models are pulled automatically (llava, llava:7b, qwen3-vl:2b, qwen3-vl:4b). Wait 2–5 minutes.
2. Open **http://localhost:7860** — the main UI
3. Open **http://localhost:6080/vnc.html** — VNC desktop (click Connect)

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
├── scripts/            # pull_models.sh, pull_models.ps1
├── docker-compose.yml
├── Dockerfile
└── Makefile
```

---

## Configuration

### Local mode (default)

No environment variables needed. Uses Ollama and local desktop.

### Cloud mode (optional)

Create a `.env` file:

```env
HF_TOKEN=your_huggingface_token
E2B_API_KEY=your_e2b_api_key
```

Then rebuild and run. The app will use HuggingFace Inference and E2B sandboxes instead of local Ollama/desktop.

### GPU support

To use NVIDIA GPU with Ollama, uncomment the GPU section in `docker-compose.yml`:

```yaml
# In ollama service:
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]
```

Requires [nvidia-container-toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html).

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

Backend runs on port 8000, frontend on its dev port. For full local testing (desktop + Ollama), use `docker compose up` instead.

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

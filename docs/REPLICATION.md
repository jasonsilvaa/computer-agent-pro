# Como replicar este projeto

Este documento descreve como replicar o **computer-agent-pro** em outra máquina ou conta, com foco em simplicidade.

---

## Pré-requisitos

- **Docker** e **Docker Compose** instalados
- **Git** (para clonar)
- **~8 GB RAM** recomendado
- **GPU opcional**: NVIDIA com 4 GB VRAM (RTX 3050) para modo local mais rápido

---

## Replicação em 3 passos

### 1. Clonar o repositório

```bash
git clone https://github.com/jasonsilvaa/computer-agent-pro.git
cd computer-agent-pro
```

### 2. Subir a stack

**Linux / macOS:**

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**Windows (PowerShell):**

```powershell
.\scripts\setup.ps1
```

**Ou manualmente:**

```bash
docker compose up --build -d
```

### 3. Acessar

| O quê        | URL                          |
|-------------|------------------------------|
| Interface   | http://localhost:7860        |
| Desktop VNC | http://localhost:6080/vnc.html |

Na primeira execução, o Ollama pode levar **2–5 minutos** para baixar os modelos. Os serviços ficam saudáveis assim que `desktop` e `ollama` passarem no healthcheck.

---

## Estrutura do repositório (replicação)

```
computer-agent-pro/
├── cua2-core/           # Backend FastAPI + agente (smolagents)
├── cua2-front/          # Frontend React (Vite, MUI, Zustand)
├── desktop/             # Container: Xvfb, XFCE, noVNC, API de screenshot/teclado
├── ollama/              # Container: Ollama para modelos locais
├── scripts/
│   ├── setup.sh         # Setup one-shot (Linux/macOS)
│   ├── setup.ps1        # Setup one-shot (Windows)
│   ├── pull_models.sh    # Pré-baixar modelos Ollama (Linux/macOS)
│   └── pull_models.ps1  # Pré-baixar modelos Ollama (Windows)
├── docs/
│   └── REPLICATION.md   # Este arquivo
├── docker-compose.yml   # Orquestração dos 3 serviços
├── Dockerfile           # Imagem do serviço cua2 (backend + frontend)
├── Makefile             # Comandos de desenvolvimento
├── README.md
└── ARCHITECTURE.md      # Detalhes técnicos
```

- **Modo padrão** do `docker-compose.yml`: `APP_MODE=local` (Ollama + desktop local).
- Para modo **original** (Hugging Face + E2B), use `cua2-core/env.example` e defina `APP_MODE=original` e as chaves.

---

## Comandos úteis após replicar

```bash
# Ver status dos containers
docker compose ps

# Logs em tempo real
docker compose logs -f

# Parar tudo
docker compose down

# Pré-baixar modelos (com Ollama já rodando)
./scripts/pull_models.sh       # Linux/macOS
.\scripts\pull_models.ps1      # Windows
```

---

## Problemas comuns

1. **Portas em uso**: se 7860, 6080 ou 11434 estiverem ocupadas, altere em `docker-compose.yml` (ex.: `"7870:7860"`).
2. **Desktop não fica “healthy”**: aguarde até ~1 minuto; se persistir, reinicie o container `desktop`:  
   `docker compose restart desktop`
3. **GPU não detectada (Windows)**: Docker Desktop → Settings → Resources → WSL e drivers NVIDIA atualizados.
4. **Modelos não aparecem**: confirme que o Ollama está saudável: `docker compose ps` e `docker compose logs ollama`.

Com essa estrutura e os scripts de setup, o projeto fica fácil de replicar em qualquer ambiente com Docker.

# CUA2 - Computer Use Agent (Windows, local)

Interface de automação com agente de IA: processamento de tarefas em tempo real e visualização passo a passo. **Só Windows, sem Docker.**

Baseado em [smolagents/computer-use-agent](https://huggingface.co/spaces/smolagents/computer-use-agent).

---

## Pré-requisitos (Windows)

- **Python 3.10+** – [python.org](https://www.python.org/downloads/) ou Microsoft Store  
- **uv** (recomendado) ou pip: `pip install uv`  
- **Node.js 18+** – [nodejs.org](https://nodejs.org/)  
- **Ollama** – [ollama.ai](https://ollama.ai) (instale e deixe rodando)

---

## Quick Start (3 terminais)

### 1. Ollama

Instale o [Ollama para Windows](https://ollama.ai), abra e baixe um modelo:

```powershell
ollama pull qwen2.5-vl:3b
```

### 2. Dependências do projeto

Na raiz do repositório:

```powershell
cd cua2-core; uv sync --all-extras; cd ..
cd cua2-front; npm install; cd ..
pip install -r desktop/requirements_mock.txt
```

### 3. Configurar env

```powershell
copy .env.example cua2-core\.env
```

O arquivo `cua2-core\.env` já deve estar com `APP_MODE=local`, `OLLAMA_BASE_URL=http://localhost:11434` e `DESKTOP_API_URL=http://localhost:5000`.

### 4. Subir os 3 serviços

**Terminal 1 – Desktop (mock, para o backend não falhar):**

```powershell
.\scripts\run_desktop.ps1
```

**Terminal 2 – Backend:**

```powershell
.\scripts\run_backend.ps1
```

**Terminal 3 – Frontend:**

```powershell
.\scripts\run_frontend.ps1
```

- **Interface:** http://localhost:8080  
- **API:** http://localhost:8000  
- **Docs:** http://localhost:8000/docs  

---

## Sobre o desktop no Windows

No Windows não há controle real de mouse/teclado/tela. Por isso existe um **mock** (`desktop_mock_win.py`): ele responde às mesmas rotas da API de desktop (health, screenshot, mouse, teclado, browser) mas **não executa nada**. O backend e o agente rodam normalmente; o modelo “vê” uma tela preta e as ações são simuladas. Útil para testar fluxo, UI e respostas do modelo. Para automação real (cliques, abrir browser, etc.) seria preciso Linux ou WSL com Xvfb.

---

## Estrutura

```
computer-agent-pro/
├── cua2-core/           # Backend FastAPI (agente + Ollama)
├── cua2-front/          # Frontend React (Vite)
├── desktop/
│   ├── desktop_mock_win.py   # Mock da API de desktop (Windows)
│   └── requirements_mock.txt # flask, pillow
├── scripts/
│   ├── run_backend.ps1
│   ├── run_frontend.ps1
│   └── run_desktop.ps1   # Roda o mock no Windows
├── .env.example
└── README.md
```

---

## Comandos úteis

| Ação           | Comando |
|----------------|--------|
| Backend        | `.\scripts\run_backend.ps1` |
| Frontend       | `.\scripts\run_frontend.ps1` |
| Desktop mock   | `.\scripts\run_desktop.ps1` |
| Testes backend | `cd cua2-core; uv run pytest tests/ -v` |

---

## Modo original (Hugging Face + E2B)

Se quiser usar Hugging Face e E2B em vez de Ollama, em `cua2-core\.env`:

```env
APP_MODE=original
HF_TOKEN=seu_token
E2B_API_KEY=sua_chave
```

---

## Créditos

- [smolagents/computer-use-agent](https://huggingface.co/spaces/smolagents/computer-use-agent), [Ollama](https://ollama.ai)

.PHONY: sync setup install dev-backend dev-frontend dev clean docker-build compose-up compose-up-d compose-down docker-stop docker-clean docker-logs

# Sync all dependencies (Python + Node.js)
sync:
	@echo "Syncing Python dependencies..."
	uv sync --all-extras
	@echo "Installing frontend dependencies..."
	cd cua2-front && npm install
	@echo "✓ All dependencies synced!"

setup: sync

install-frontend:
	cd cua2-front && npm install

# Start backend development server
dev-backend:
	cd cua2-core && uv run uvicorn cua2_core.main:app --reload --host 0.0.0.0 --port 8000

# Start frontend development server
dev-frontend:
	cd cua2-front && npm run dev

pre-commit:
	uv run pre-commit run --all-files --show-diff-on-failure
	make test

# Run tests
test:
	cd cua2-core && uv run pytest tests/ -v

test-coverage:
	cd cua2-core && uv run pytest tests/ -v --cov=cua2_core --cov-report=html --cov-report=term

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	cd cua2-front && rm -rf node_modules dist 2>/dev/null || true
	@echo "✓ Cleaned!"

# Docker commands (local mode - no API keys)
compose-up:
	@echo "Starting CUA2 (local mode, no tokens)..."
	docker compose up --build

compose-up-d:
	@echo "Starting CUA2 in background (local mode, no tokens)..."
	docker compose up -d --build
	@echo "✓ Access at http://localhost:7860 | VNC: http://localhost:6080/vnc.html"

compose-down:
	docker compose down

docker-build:
	@echo "Building Docker images..."
	docker compose build
	@echo "✓ Docker images built!"

docker-stop: compose-down

docker-clean:
	@echo "Removing Docker images..."
	docker compose down --rmi local -v 2>/dev/null || true
	@echo "✓ Cleaned!"

docker-logs:
	docker compose logs -f

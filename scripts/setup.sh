#!/usr/bin/env bash
# One-command setup: build and start all services (run from repo root).
# Usage: ./scripts/setup.sh   or   bash scripts/setup.sh

set -e
cd "$(dirname "$0")/.."

echo "=== CUA2 - Computer Use Agent ==="
echo ""
echo "Building and starting services (this may take a few minutes)..."
echo ""

docker compose up --build -d

echo ""
echo "Waiting for services to become healthy..."
sleep 5
for i in 1 2 3 4 5 6 7 8 9 10; do
  if docker compose ps 2>/dev/null | grep -q "healthy"; then
    break
  fi
  sleep 3
done

echo ""
echo "--- Replicação concluída ---"
echo ""
echo "  UI:        http://localhost:7860"
echo "  Desktop:   http://localhost:6080/vnc.html"
echo ""
echo "Na primeira execução, o Ollama pode levar 2–5 min para baixar os modelos."
echo "Para pré-baixar: docker compose up -d ollama && ./scripts/pull_models.sh"
echo ""
echo "Parar: docker compose down"
echo ""

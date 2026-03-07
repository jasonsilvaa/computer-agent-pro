#!/bin/bash
# Pull all models used by CUA2 (local mode)
# Run: ./scripts/pull_models.sh  (requires: docker compose up -d ollama)

set -e

echo "Pulling Ollama models for CUA2 (4GB VRAM, qwen3-vl:2b default)..."

docker compose exec ollama ollama pull qwen3-vl:2b
docker compose exec ollama ollama pull llava
docker compose exec ollama ollama pull llava:7b
docker compose exec ollama ollama pull qwen3-vl:4b

echo "Done. Models installed:"
docker compose exec ollama ollama list

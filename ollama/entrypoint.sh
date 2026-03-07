#!/bin/sh
set -e

# Start Ollama server in background
ollama serve &
OLLAMA_PID=$!

# Wait for server to be ready
echo "Waiting for Ollama server..."
i=0
while [ $i -lt 30 ]; do
  if ollama list 2>/dev/null; then
    echo "Ollama server ready."
    break
  fi
  sleep 2
  i=$((i + 1))
done

# Pull all models automatically (optimized for 4GB VRAM)
echo "Pulling models: llava, llava:7b, qwen3-vl:2b, qwen3-vl:4b..."
ollama pull llava || true
ollama pull llava:7b || true
ollama pull qwen3-vl:2b || true
ollama pull qwen3-vl:4b || true
echo "Models ready."

# Keep container running (wait for ollama serve)
wait $OLLAMA_PID

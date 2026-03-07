# Pull all models used by CUA2 (local mode)
# Run: docker compose exec ollama ollama pull llava; docker compose exec ollama ollama pull llava:7b

Write-Host "Pulling Ollama models for CUA2..."

$models = @("llava", "llava:7b", "qwen3-vl:2b", "qwen3-vl:4b")
foreach ($model in $models) {
    Write-Host "Pulling $model..."
    docker compose exec ollama ollama pull $model
}

Write-Host "Done. Listing models:"
docker compose exec ollama ollama list

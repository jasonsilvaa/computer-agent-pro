# One-command setup: build and start all services (run from repo root).
# Usage: .\scripts\setup.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "=== CUA2 - Computer Use Agent ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Building and starting services (this may take a few minutes)..."
Write-Host ""

docker compose up --build -d

Write-Host ""
Write-Host "Waiting for services to become healthy..."
Start-Sleep -Seconds 5
$max = 10
for ($i = 1; $i -le $max; $i++) {
  $ps = docker compose ps 2>$null
  if ($ps -match "healthy") { break }
  Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "--- Replicação concluída ---" -ForegroundColor Green
Write-Host ""
Write-Host "  UI:        http://localhost:7860"
Write-Host "  Desktop:   http://localhost:6080/vnc.html"
Write-Host ""
Write-Host "Na primeira execução, o Ollama pode levar 2–5 min para baixar os modelos."
Write-Host "Para pré-baixar: docker compose up -d ollama; .\scripts\pull_models.ps1"
Write-Host ""
Write-Host "Parar: docker compose down"
Write-Host ""

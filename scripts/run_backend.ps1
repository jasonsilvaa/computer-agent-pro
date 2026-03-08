# Run backend locally (no Docker). Requires: Ollama running on localhost:11434.
# Optional: desktop API on localhost:5000 for full automation.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$core = Join-Path $root "cua2-core"

if (-not (Test-Path (Join-Path $core ".env"))) {
    $example = Join-Path $root ".env.example"
    if (Test-Path $example) {
        Copy-Item $example (Join-Path $core ".env")
        Write-Host "Created cua2-core/.env from .env.example"
    }
}

Set-Location $core
Write-Host "Starting backend at http://localhost:8000"
uv run uvicorn cua2_core.main:app --reload --host 0.0.0.0 --port 8000

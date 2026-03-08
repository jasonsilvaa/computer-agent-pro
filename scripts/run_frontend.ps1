# Run frontend locally. Backend should be at http://localhost:8000.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$front = Join-Path $root "cua2-front"

Set-Location $front
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..."
    npm install
}
Write-Host "Starting frontend (API: http://localhost:8000)"
npm run dev

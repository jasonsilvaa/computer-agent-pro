# Run desktop API mock (Windows). Keeps backend from failing; no real mouse/keyboard/screenshot.
# Install once: pip install flask pillow

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$desktop = Join-Path $root "desktop"

Set-Location $desktop
Write-Host "Starting desktop mock at http://localhost:5000 (Windows - no real automation)"
python desktop_mock_win.py

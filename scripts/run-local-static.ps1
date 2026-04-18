$ErrorActionPreference = "Stop"

if (-not (Test-Path "index.html")) {
    Write-Error "index.html not found. Run this script from the repository root."
}

$pythonCmd = $null

if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = "py -3"
} else {
    Write-Error "Python is not installed. Install Python or use the Ruby/Jekyll scripts."
}

Write-Host "Starting static server on http://localhost:8080 ..."
Write-Host "Note: This serves static files only (no Jekyll build for _posts)."

if ($pythonCmd -eq "python") {
    python -m http.server 8080
} else {
    py -3 -m http.server 8080
}

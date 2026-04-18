$ErrorActionPreference = "Stop"

function Ensure-Command {
    param(
        [string]$CommandName,
        [string]$WingetId
    )

    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        Write-Host "Installing $CommandName..."
        winget install --id $WingetId -e --accept-package-agreements --accept-source-agreements
    } else {
        Write-Host "$CommandName already installed."
    }
}

Write-Host "Installing local run dependencies (Windows)..."

Ensure-Command -CommandName "git" -WingetId "Git.Git"
Ensure-Command -CommandName "py" -WingetId "Python.Python.3.12"

Write-Host "Dependencies ready."
Write-Host "Run site locally with: py -3 -m http.server 8080"

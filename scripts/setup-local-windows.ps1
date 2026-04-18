$ErrorActionPreference = "Stop"

# ---- Config ----
$RepoUrl = "https://github.com/abhinavsreesan/abhinavsreesan.github.io.git"
$Branch = "refactor/simple-layout-issues-search"
$RootDir = Join-Path $HOME "Projects"
$RepoDir = Join-Path $RootDir "abhinavsreesan.github.io"
$Port = 8080

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

Write-Host "Ensuring required tools are installed..."
Ensure-Command -CommandName "git" -WingetId "Git.Git"
Ensure-Command -CommandName "py" -WingetId "Python.Python.3.12"

# Refresh PATH for the current process (best effort)
$env:Path += ";$env:ProgramFiles\Git\cmd"
$env:Path += ";$env:LocalAppData\Programs\Python\Python312"
$env:Path += ";$env:LocalAppData\Programs\Python\Python312\Scripts"

if (-not (Test-Path $RootDir)) {
    New-Item -ItemType Directory -Path $RootDir | Out-Null
}

if (-not (Test-Path (Join-Path $RepoDir ".git"))) {
    Write-Host "Cloning repository to $RepoDir..."
    git clone $RepoUrl $RepoDir
} else {
    Write-Host "Repository already exists at $RepoDir, reusing it."
}

Set-Location $RepoDir

Write-Host "Fetching latest changes..."
git fetch origin

Write-Host "Checking out branch $Branch..."
git checkout $Branch

Write-Host "Starting local server on http://localhost:$Port"
Start-Process "http://localhost:$Port"
py -3 -m http.server $Port

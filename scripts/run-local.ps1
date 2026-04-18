$ErrorActionPreference = "Stop"

if (-not (Test-Path "Gemfile")) {
    Write-Error "Gemfile not found. Run this script from the repository root."
}

if (-not (Get-Command bundle -ErrorAction SilentlyContinue)) {
    Write-Error "Bundler not found. Run scripts/install-deps.ps1 first."
}

Write-Host "Starting Jekyll server on http://localhost:4000 ..."
bundle exec jekyll serve --livereload --host 0.0.0.0 --port 4000

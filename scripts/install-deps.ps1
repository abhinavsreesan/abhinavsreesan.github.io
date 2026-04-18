$ErrorActionPreference = "Stop"

if (-not (Test-Path "Gemfile")) {
    Write-Error "Gemfile not found. Run this script from the repository root."
}

if (-not (Get-Command ruby -ErrorAction SilentlyContinue)) {
    Write-Error "Ruby is not installed. Install Ruby and rerun this script."
}

if (-not (Get-Command gem -ErrorAction SilentlyContinue)) {
    Write-Error "RubyGems (gem) is not available. Reinstall Ruby with RubyGems support."
}

if (-not (Get-Command bundle -ErrorAction SilentlyContinue)) {
    Write-Host "Bundler not found. Installing bundler..."
    gem install bundler --no-document
}

Write-Host "Installing project gems..."
bundle install

Write-Host "Dependencies installed successfully."

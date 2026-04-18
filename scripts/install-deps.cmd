@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-deps.ps1"
if errorlevel 1 exit /b %errorlevel%

echo.
echo Dependencies installed.
endlocal

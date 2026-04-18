@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-local-static.ps1"
if errorlevel 1 exit /b %errorlevel%

endlocal

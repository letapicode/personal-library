@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is required to identify the Library server.
    pause
    exit /b 1
)

node "%~dp0scripts\stop-library.mjs"
set "stopExit=%ERRORLEVEL%"
if not "%stopExit%"=="0" pause
exit /b %stopExit%

@echo off
setlocal enabledelayedexpansion

:: Always run from the project directory (allows Win+R invocation from anywhere)
cd /d "%~dp0"

echo ============================================================
echo   Personal Library Launcher
echo ============================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please install Node.js v20.19+ or v22.12+ from https://nodejs.org/
    echo Once installed, rerun this command.
    pause
    exit /b 1
)

:: 2. Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not found on your system!
    pause
    exit /b 1
)

:: 3. Check if node_modules exists; if not, automatically run npm install
if not exist "node_modules\" (
    echo [1/2] First time setup detected. Automatically installing dependencies...
    echo This may take 30-60 seconds depending on your connection...
    call npm install --legacy-peer-deps
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Dependency installation failed!
        pause
        exit /b 1
    )
    echo [OK] All dependencies successfully installed.
) else (
    echo [OK] Dependencies verified.
)

:: 4. Let the launcher verify port ownership and wait for Vite readiness.
echo [2/2] Checking port 3000 and starting Engineering Library if needed...
echo.
node "%~dp0scripts\launch-library.mjs"
set "launchExit=%ERRORLEVEL%"
if not "%launchExit%"=="0" (
    echo.
    echo [Library launch stopped with error code %launchExit%]
    pause
)
exit /b %launchExit%

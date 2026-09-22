@echo off
:: ============================================================
::  One-Time Registration: Makes "run-library" available from
::  Windows Run dialog (Win+R) without needing to cd anywhere.
::
::  Run this script ONCE. After that, Win+R → run-library
::  will launch the Engineering Library automatically.
:: ============================================================

setlocal

set "SCRIPT_DIR=%~dp0"
set "SCRIPT_PATH=%SCRIPT_DIR%run-library.cmd"

:: Remove trailing backslash from SCRIPT_DIR for the Path value
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

echo ============================================================
echo   Registering "run-library" for Windows Run (Win+R)
echo ============================================================
echo.
echo Script location: %SCRIPT_PATH%
echo.
:: Unblock all downloaded files in the folder so Windows Security doesn't prompt
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -LiteralPath '%SCRIPT_DIR%' -Recurse -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue" >nul 2>&1
:: Register in HKCU (no admin rights needed)
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\run-library.cmd" /ve /d "\"%SCRIPT_PATH%\"" /f >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to write registry key.
    pause
    exit /b 1
)

reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\run-library.cmd" /v "Path" /d "%SCRIPT_DIR%" /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\run-library.exe" /ve /d "\"%SCRIPT_PATH%\"" /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\run-library.exe" /v "Path" /d "%SCRIPT_DIR%" /f >nul 2>&1

echo [OK] Successfully registered!
echo.
echo You can now press Win+R, type "run-library", and hit Enter
echo to launch the Engineering Library from anywhere.
echo.
pause

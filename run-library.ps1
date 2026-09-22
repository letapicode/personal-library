# PowerShell Zero-Touch Launcher for ChatGPT Course Reader
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   ChatGPT Course Reader & Engineering Library Launcher" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verify Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not found on your system!" -ForegroundColor Red
    Write-Host "Please download and install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

# 2. Check if node_modules exists; if not, automatically run npm install
if (-not (Test-Path -Path "node_modules")) {
    Write-Host "[1/2] First-time setup detected. Automatically installing all dependencies..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install dependencies." -ForegroundColor Red
        Read-Host "Press Enter to exit..."
        exit 1
    }
    Write-Host "[OK] Dependencies installed successfully." -ForegroundColor Green
} else {
    Write-Host "[OK] Dependencies verified." -ForegroundColor Green
}

# 3. Launch application and auto-open browser
Write-Host "[2/2] Starting Engineering Library server..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"

npm run dev

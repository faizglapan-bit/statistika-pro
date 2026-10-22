#!/usr/bin/env pwsh
# Skrip untuk menjalankan aplikasi Statistika Pro di Windows
# Penggunaan: .\scripts\dev.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  STATISTIKA PRO — Development Server" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path -Parent $PSScriptRoot
$webDir = Join-Path $rootDir "apps\web"
$apiDir = Join-Path $rootDir "apps\api"
$venvPython = Join-Path $apiDir ".venv\Scripts\python.exe"
$venvPip = Join-Path $apiDir ".venv\Scripts\pip.exe"

# ========================
# Cek prasyarat
# ========================
Write-Host "[1/3] Memeriksa prasyarat..." -ForegroundColor Yellow

# Node.js
try {
    $nodeVersion = & node --version 2>&1
    Write-Host "  ✅ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js tidak ditemukan. Install dari https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Python virtual environment
if (-not (Test-Path $venvPython)) {
    Write-Host "  ⚠️  Virtual environment tidak ditemukan. Membuat..." -ForegroundColor Yellow
    Set-Location $apiDir
    py -m venv .venv
    & $venvPip install -r requirements.txt
    Write-Host "  ✅ Virtual environment dibuat" -ForegroundColor Green
} else {
    Write-Host "  ✅ Python virtual environment tersedia" -ForegroundColor Green
}

# ========================
# Install frontend deps jika perlu
# ========================
Write-Host ""
Write-Host "[2/3] Memeriksa dependensi frontend..." -ForegroundColor Yellow

$nodeModules = Join-Path $webDir "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Host "  Installing npm packages..." -ForegroundColor Yellow
    Set-Location $webDir
    npm install
}
Write-Host "  ✅ Dependensi frontend siap" -ForegroundColor Green

# ========================
# Jalankan server
# ========================
Write-Host ""
Write-Host "[3/3] Menjalankan server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  🌐 Frontend : http://localhost:5173" -ForegroundColor Cyan
Write-Host "  🔧 Backend  : http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "  📚 API Docs : http://127.0.0.1:8000/api/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Tekan Ctrl+C untuk menghentikan semua layanan." -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Jalankan backend di background
$backendJob = Start-Job -ScriptBlock {
    param($apiDir, $python)
    Set-Location $apiDir
    & $python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
} -ArgumentList $apiDir, $venvPython

Write-Host "  Backend job started (ID: $($backendJob.Id))" -ForegroundColor Gray

# Tunggu sebentar agar backend siap
Start-Sleep -Seconds 2

# Jalankan frontend (foreground)
Set-Location $webDir
try {
    npm run dev
} finally {
    # Hentikan backend saat frontend dihentikan
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "  Semua layanan dihentikan." -ForegroundColor Gray
}

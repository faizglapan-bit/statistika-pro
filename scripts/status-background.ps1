# Skrip untuk memeriksa status layanan Statistika Pro
$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   STATISTIKA PRO - Status Layanan Background       " -ForegroundColor White
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

function Check-ServiceStatus ($name, $port, $url) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $pids = ($conn | Select-Object -ExpandProperty OwningProcess -Unique) -join ", "
        Write-Host "  [AKTIF] $name (Port $port) [PID: $pids]" -ForegroundColor Green
        Write-Host "          URL: $url" -ForegroundColor Cyan
        return $true
    } else {
        Write-Host "  [MATI]  $name (Port $port)" -ForegroundColor Red
        return $false
    }
}

$backendActive = Check-ServiceStatus "FastAPI Backend " 8000 "http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/api/docs)"
Write-Host ""
$frontendActive = Check-ServiceStatus "Frontend Vite   " 5173 "http://localhost:5173"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
$rootDir = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $rootDir "logs"
Write-Host "  File Log:" -ForegroundColor Gray
Write-Host "  - Backend : $logDir\api.log" -ForegroundColor Gray
Write-Host "  - Frontend: $logDir\web.log" -ForegroundColor Gray
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

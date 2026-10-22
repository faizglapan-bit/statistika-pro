# Skrip untuk menghentikan API dan Frontend background service
$ErrorActionPreference = "SilentlyContinue"

Write-Host "Menghentikan layanan Statistika Pro (port 8000 & 5173)..." -ForegroundColor Yellow

$ports = @(8000, 5173)
$killedCount = 0

foreach ($port in $ports) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($connections) {
            $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($p in $pids) {
                if ($p -gt 0) {
                    Write-Host "  Menghentikan proses PID $p di port $port..." -ForegroundColor Gray
                    Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
                    $killedCount++
                }
            }
        }
    } catch {
        # abaikan jika sudah tertutup
    }
}

Start-Sleep -Seconds 1
Write-Host "  [OK] Layanan Statistika Pro berhasil dihentikan." -ForegroundColor Green

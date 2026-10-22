# Skrip untuk mencabut Statistika Pro dari Windows Startup
$ErrorActionPreference = "SilentlyContinue"

$startupFolder = [System.Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupFolder "StatistikaPro-Background.lnk"

if (Test-Path $shortcutPath) {
    Remove-Item -Path $shortcutPath -Force
    Write-Host ""
    Write-Host "✅ Shortcut Statistika Pro berhasil dicabut dari Windows Startup." -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ℹ️ Shortcut Statistika Pro tidak ditemukan di Windows Startup." -ForegroundColor Yellow
    Write-Host ""
}

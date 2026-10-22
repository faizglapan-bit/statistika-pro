# Skrip untuk mendaftarkan Statistika Pro ke Windows Startup (Auto-Run saat boot/login)
$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $PSScriptRoot
$vbsPath = Join-Path $rootDir "scripts\run-silent.vbs"

$startupFolder = [System.Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupFolder "StatistikaPro-Background.lnk"

$wshShell = New-Object -ComObject WScript.Shell
$shortcut = $wshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsPath`""
$shortcut.WorkingDirectory = $rootDir
$shortcut.Description = "Statistika Pro Background Service (FastAPI & Vite)"
$shortcut.Save()

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  [OK] Berhasil didaftarkan ke Windows Startup!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  Lokasi Shortcut: $shortcutPath" -ForegroundColor Gray
Write-Host "  Mulai sekarang, API & Frontend akan otomatis berjalan" -ForegroundColor White
Write-Host "  di latar belakang setiap kali Anda login ke Windows." -ForegroundColor White
Write-Host ""

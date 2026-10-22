# Skrip untuk menjalankan API dan Frontend di latar belakang (Background Service)
$ErrorActionPreference = "SilentlyContinue"

$rootDir = Split-Path -Parent $PSScriptRoot
$vbsPath = Join-Path $rootDir "scripts\run-silent.vbs"

Write-Host "Menjalankan API dan Frontend di latar belakang..." -ForegroundColor Yellow
& wscript.exe "$vbsPath"

Start-Sleep -Seconds 3

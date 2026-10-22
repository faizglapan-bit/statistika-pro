@echo off
title Statistika Pro - Starting Background Service
cd /d "%~dp0"
echo Menjalankan Statistika Pro (FastAPI & Vite) di latar belakang...
wscript.exe "%~dp0scripts\run-silent.vbs"
timeout /t 3 /nobreak > nul
powershell.exe -ExecutionPolicy Bypass -File "%~dp0scripts\status-background.ps1"
pause

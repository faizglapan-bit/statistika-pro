@echo off
title Statistika Pro - Restart Service
cd /d "%~dp0"
echo Merestart layanan Statistika Pro...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0scripts\stop-background.ps1"
timeout /t 2 /nobreak > nul
wscript.exe "%~dp0scripts\run-silent.vbs"
timeout /t 3 /nobreak > nul
powershell.exe -ExecutionPolicy Bypass -File "%~dp0scripts\status-background.ps1"
pause

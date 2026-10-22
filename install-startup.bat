@echo off
title Statistika Pro - Install Windows Startup
cd /d "%~dp0"
powershell.exe -ExecutionPolicy Bypass -File "%~dp0scripts\install-startup.ps1"
pause

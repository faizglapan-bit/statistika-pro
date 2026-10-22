@echo off
title Statistika Pro - Uninstall Windows Startup
cd /d "%~dp0"
powershell.exe -ExecutionPolicy Bypass -File "%~dp0scripts\uninstall-startup.ps1"
pause

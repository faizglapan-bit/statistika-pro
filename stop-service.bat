@echo off
title Statistika Pro - Stop Service
cd /d "%~dp0"
powershell.exe -ExecutionPolicy Bypass -File "%~dp0scripts\stop-background.ps1"
pause

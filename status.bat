@echo off
title Statistika Pro - Status Service
cd /d "%~dp0"
powershell.exe -ExecutionPolicy Bypass -File "%~dp0scripts\status-background.ps1"
pause

@echo off
cd /d "%~dp0..\apps\web"
if not exist "%~dp0..\logs" mkdir "%~dp0..\logs"
cmd.exe /c npm run dev >> "%~dp0..\logs\web.log" 2>&1

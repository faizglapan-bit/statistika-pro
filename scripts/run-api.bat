@echo off
cd /d "%~dp0..\apps\api"
if not exist "%~dp0..\logs" mkdir "%~dp0..\logs"
"%~dp0..\apps\api\.venv\Scripts\python.exe" -m uvicorn main:app --reload --host 127.0.0.1 --port 8000 >> "%~dp0..\logs\api.log" 2>&1

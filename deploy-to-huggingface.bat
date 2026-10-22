@echo off
title Deploy Backend ke Hugging Face Spaces
cd /d "%~dp0"

echo ======================================================================
echo    STATISTIKA PRO — Deploy Backend ke Hugging Face Spaces (16GB RAM)
echo ======================================================================
echo.
echo Pastikan Anda sudah membuat Space baru di:
echo https://huggingface.co/new-space
echo (Pilih Space SDK: Docker / Blank)
echo.
echo Masukkan Git Clone URL Space Anda:
echo Contoh: https://huggingface.co/spaces/username-anda/statistika-pro-api
echo.
set /p HF_URL="Git URL Space: "

if "%HF_URL%"=="" (
    echo [ERROR] URL tidak boleh kosong!
    pause
    exit /b 1
)

echo.
echo Mengunggah backend apps/api ke Hugging Face Spaces...
git subtree push --prefix apps/api %HF_URL% main

echo.
echo ======================================================================
echo  Proses selesai! Cek status build di halaman Space Hugging Face Anda.
echo ======================================================================
pause

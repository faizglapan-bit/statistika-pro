# ==============================================================================
# Dockerfile for Statistika Pro Backend API (FastAPI)
# Kompatibel dengan: Hugging Face Spaces (Port 7860) & Render/Cloud (Port dinamis)
# ==============================================================================

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860

WORKDIR /app

# Upgrade pip untuk menjamin dukungan binary wheels modern
RUN pip install --no-cache-dir --upgrade pip

# Salin dan install dependensi terlebih dahulu
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Buat pengguna non-root (standar wajib keamanan Hugging Face Spaces UID 1000)
RUN useradd -m -u 1000 user && \
    mkdir -p /app/data && \
    chown -R user:user /app

# Salin kode aplikasi dengan hak milik pengguna user
COPY --chown=user:user . .

USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Expose port (7860 untuk Hugging Face, 8000 untuk lokal)
EXPOSE 7860 8000

# Jalankan server FastAPI dengan uvicorn (fallback port 7860)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}"]

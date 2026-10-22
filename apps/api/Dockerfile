# ==============================================================================
# Dockerfile for Statistika Pro Backend API (FastAPI)
# Base: Python 3.11 slim (official Debian-based image with full wheel support)
# ==============================================================================

FROM python:3.11-slim

# Mencegah pembuatan file .pyc dan memastikan output log langsung terlihat
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Upgrade pip untuk menjamin dukungan binary wheels modern
RUN pip install --no-cache-dir --upgrade pip

# Salin dan install dependensi terlebih dahulu (memanfaatkan Docker cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Salin seluruh kode backend
COPY . .

# Expose port API
EXPOSE 8000

# Jalankan uvicorn server dengan binding port dinamis dari cloud ($PORT)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]

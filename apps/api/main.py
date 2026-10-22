"""
Statistika Pro — Backend API
FastAPI application untuk layanan analisis statistik.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Dict, AsyncIterator
import logging

from config import settings
from routers.datasets import router as datasets_router
from routers.analysis import router as analysis_router
from routers.outputs import router as outputs_router
from routers.transformations import router as transformations_router
from routers.cases import router as cases_router
from routers.reports import router as reports_router
from routers.advanced_analysis import router as advanced_analysis_router
from routers.projects import router as projects_router
import shutil
import os

# Setup logging
logging.basicConfig(
    level=logging.DEBUG if settings.is_development else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("statistika_pro")


# ============================================================
# Lifespan (Startup / Shutdown)
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Mengelola siklus hidup aplikasi (startup dan shutdown)."""
    # --- Startup ---
    runtime_info = settings.validate_runtime()
    logger.info(f"🚀 {settings.app_name} v{settings.app_version} dimulai")
    logger.info(f"   Environment : {settings.app_env}")
    logger.info(f"   Host        : {settings.api_host}:{settings.api_port}")
    logger.info(f"   Data Dir    : {runtime_info['data_dir']}")
    logger.info(f"   CORS origins: {settings.cors_origins_list}")
    if settings.is_development:
        logger.info(f"   API Docs    : http://{settings.api_host}:{settings.api_port}/api/docs")

    yield  # Aplikasi berjalan

    # --- Shutdown ---
    logger.info(f"🔴 {settings.app_name} dihentikan")


# ============================================================
# Inisialisasi Aplikasi
# ============================================================

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API backend untuk Statistika Pro — Platform analisis statistik profesional.",
    docs_url="/api/docs" if settings.is_development else None,
    redoc_url="/api/redoc" if settings.is_development else None,
    openapi_url="/api/openapi.json" if settings.is_development else None,
    lifespan=lifespan,
)


# ============================================================
# Middleware CORS
# ============================================================

origins = settings.cors_origins_list
logger.info(f"CORS origins diizinkan: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https://.*\.netlify\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# ============================================================
# Exception Handler Global
# ============================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Tangani semua error yang tidak tertangkap secara terpusat."""
    logger.error(f"Unhandled error pada {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "Terjadi kesalahan internal pada server.",
            "path": str(request.url.path),
        },
    )


# ============================================================
# Routes
# ============================================================

app.include_router(datasets_router)
app.include_router(analysis_router)
app.include_router(outputs_router)
app.include_router(transformations_router)
app.include_router(cases_router)
app.include_router(reports_router)
app.include_router(advanced_analysis_router)
app.include_router(projects_router)

@app.get(
    "/api/health",
    summary="Health Check",
    description="Memeriksa status layanan API, integritas penyimpanan, dan kapasitas disk.",
    tags=["System"],
    response_model=Dict[str, Any],
)
async def health_check() -> Dict[str, Any]:
    """
    Endpoint health check.

    Mengembalikan status layanan, versi aplikasi, status disk, dan timestamp saat ini.
    """
    storage_status = "healthy"
    disk_info = {}
    try:
        data_path = settings.get_absolute_path(settings.data_dir)
        os.makedirs(data_path, exist_ok=True)
        total, used, free = shutil.disk_usage(data_path)
        disk_info = {
            "total_gb": round(total / (1024**3), 2),
            "free_gb": round(free / (1024**3), 2),
            "used_percent": round((used / total) * 100, 1),
        }
    except Exception as e:
        storage_status = f"warning: {str(e)}"

    return {
        "status": "ok",
        "version": settings.app_version,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": settings.app_env,
        "services": {
            "api": "healthy",
            "storage": storage_status,
        },
        "disk": disk_info,
    }


@app.get(
    "/",
    include_in_schema=False,
)
async def root() -> Dict[str, str]:
    """Root endpoint — informasi API."""
    return {
        "message": f"Selamat datang di {settings.app_name}",
        "version": settings.app_version,
        "docs": "/api/docs",
        "health": "/api/health",
    }

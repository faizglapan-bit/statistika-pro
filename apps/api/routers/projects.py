from fastapi import APIRouter, HTTPException, UploadFile, File, Response, Query
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any, Optional
import urllib.parse
import re

from schemas.project import (
    ProjectMetadata,
    ProjectCreate,
    ProjectUpdate,
    ProjectDetail,
)
from services.project_service import ProjectService
from config import settings

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectMetadata], summary="Ambil daftar seluruh proyek tersimpan")
async def get_projects() -> List[ProjectMetadata]:
    return ProjectService.list_projects()


@router.post("", response_model=ProjectDetail, summary="Buat proyek baru")
async def create_project(payload: ProjectCreate) -> ProjectDetail:
    try:
        return ProjectService.create_project(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membuat proyek: {str(e)}")


@router.get("/{project_id}", response_model=ProjectDetail, summary="Ambil detail proyek berdasarkan ID")
async def get_project(project_id: str) -> ProjectDetail:
    proj = ProjectService.get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail=f"Proyek dengan ID '{project_id}' tidak ditemukan")
    return proj


@router.put("/{project_id}", response_model=ProjectDetail, summary="Simpan atau perbarui proyek dan datasetnya")
async def save_project(project_id: str, payload: ProjectUpdate) -> ProjectDetail:
    updated = ProjectService.save_project(project_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Proyek dengan ID '{project_id}' tidak ditemukan")
    return updated


@router.post("/{project_id}/duplicate", response_model=ProjectDetail, summary="Gandakan / buat salinan proyek")
async def duplicate_project(
    project_id: str,
    new_name: Optional[str] = Query(None, description="Nama baru untuk proyek salinan"),
) -> ProjectDetail:
    dup = ProjectService.duplicate_project(project_id, new_name=new_name)
    if not dup:
        raise HTTPException(status_code=404, detail=f"Proyek dengan ID '{project_id}' tidak ditemukan")
    return dup


@router.delete("/{project_id}", summary="Hapus proyek berdasarkan ID")
async def delete_project(project_id: str) -> Dict[str, Any]:
    success = ProjectService.delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Proyek dengan ID '{project_id}' tidak ditemukan")
    return {"success": True, "message": f"Proyek '{project_id}' berhasil dihapus"}


@router.get("/{project_id}/export", summary="Ekspor paket berkas proyek .statpro (ZIP)")
async def export_statpro(project_id: str):
    try:
        proj = ProjectService.get_project(project_id)
        if not proj:
            raise HTTPException(status_code=404, detail=f"Proyek '{project_id}' tidak ditemukan")

        zip_stream = ProjectService.export_statpro(project_id)
        safe_name = re.sub(r"[^\w\-]", "_", proj.name) or "proyek"
        filename = f"{safe_name}.statpro"
        encoded_filename = urllib.parse.quote(filename)

        return StreamingResponse(
            zip_stream,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename=\"{filename}\"; filename*=UTF-8''{encoded_filename}"},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengekspor berkas .statpro: {str(e)}")


@router.post("/import", response_model=ProjectDetail, summary="Unggah dan impor paket berkas proyek .statpro")
async def import_statpro(file: UploadFile = File(...)) -> ProjectDetail:
    # Validasi batas ukuran file upload
    max_bytes = settings.upload_max_size_mb * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Ukuran file melebihi batas maksimum yang diizinkan ({settings.upload_max_size_mb} MB)",
        )

    try:
        return ProjectService.import_statpro(content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan saat memproses berkas impor: {str(e)}")

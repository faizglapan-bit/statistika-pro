from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import Response, StreamingResponse
from typing import List, Dict, Any, Optional
import urllib.parse
import re

from schemas.dataset import (
    DatasetMetadata,
    Dataset,
    DatasetCreate,
    DatasetUpdate,
    VariableDefinition,
    ImportPreviewResponse,
    ImportCommitRequest,
)
from services.dataset_service import DatasetService

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])


@router.get("", response_model=List[DatasetMetadata], summary="Ambil daftar semua dataset tersimpan")
async def get_datasets() -> List[DatasetMetadata]:
    return DatasetService.list_datasets()


@router.post("", response_model=Dataset, summary="Buat dataset baru")
async def create_dataset(payload: DatasetCreate) -> Dataset:
    return DatasetService.create_dataset(payload)


@router.post("/demo/seed", response_model=Dataset, summary="Muat ulang atau buat DEMO DATA kuesioner")
async def seed_demo(force: bool = Query(True, description="Paksa reset dataset demo jika sudah ada")) -> Dataset:
    return DatasetService.seed_demo_data(force=force)


@router.post("/preview-import", response_model=ImportPreviewResponse, summary="Pratinjau impor file CSV atau Excel")
async def preview_import(
    file: UploadFile = File(...),
    sheet_name: Optional[str] = Form(None),
    delimiter: Optional[str] = Form(None),
    has_headers: bool = Form(True),
) -> ImportPreviewResponse:
    try:
        content = await file.read()
        return DatasetService.preview_import_file(
            content=content,
            filename=file.filename or "upload.csv",
            sheet_name=sheet_name,
            delimiter=delimiter,
            has_headers=has_headers,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan saat memproses file: {str(e)}")


@router.post("/import", response_model=Dataset, summary="Konfirmasi dan simpan hasil impor dataset")
async def commit_import(payload: ImportCommitRequest) -> Dataset:
    try:
        return DatasetService.commit_import(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal menyimpan dataset hasil impor: {str(e)}")


@router.get("/{dataset_id}", response_model=Dataset, summary="Ambil dataset berdasarkan ID")
async def get_dataset(dataset_id: str) -> Dataset:
    ds = DatasetService.get_dataset(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail=f"Dataset dengan ID '{dataset_id}' tidak ditemukan")
    return ds


@router.put("/{dataset_id}", response_model=Dataset, summary="Perbarui dataset (data baris dan variabel)")
async def update_dataset(dataset_id: str, payload: DatasetUpdate) -> Dataset:
    try:
        updated = DatasetService.update_dataset(dataset_id, payload)
        if not updated:
            raise HTTPException(status_code=404, detail=f"Dataset dengan ID '{dataset_id}' tidak ditemukan")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{dataset_id}", summary="Hapus dataset berdasarkan ID")
async def delete_dataset(dataset_id: str) -> Dict[str, Any]:
    deleted = DatasetService.delete_dataset(dataset_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Dataset dengan ID '{dataset_id}' tidak ditemukan")
    return {"success": True, "message": f"Dataset '{dataset_id}' berhasil dihapus"}


@router.post("/{dataset_id}/rows", response_model=Dataset, summary="Tambah satu baris ke dataset")
async def add_row(dataset_id: str, payload: Dict[str, Any]) -> Dataset:
    ds = DatasetService.add_row(dataset_id, payload)
    if not ds:
        raise HTTPException(status_code=404, detail=f"Dataset dengan ID '{dataset_id}' tidak ditemukan")
    return ds


@router.delete("/{dataset_id}/rows/{row_idx}", response_model=Dataset, summary="Hapus baris berdasarkan indeks")
async def delete_row(dataset_id: str, row_idx: int) -> Dataset:
    try:
        ds = DatasetService.delete_row(dataset_id, row_idx)
        if not ds:
            raise HTTPException(status_code=404, detail=f"Dataset dengan ID '{dataset_id}' tidak ditemukan")
        return ds
    except IndexError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{dataset_id}/columns", response_model=Dataset, summary="Tambah variabel kolom baru")
async def add_column(dataset_id: str, payload: VariableDefinition) -> Dataset:
    try:
        ds = DatasetService.add_column(dataset_id, payload)
        if not ds:
            raise HTTPException(status_code=404, detail=f"Dataset dengan ID '{dataset_id}' tidak ditemukan")
        return ds
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{dataset_id}/columns/{var_name}", response_model=Dataset, summary="Hapus variabel kolom berdasarkan nama")
async def delete_column(dataset_id: str, var_name: str) -> Dataset:
    try:
        ds = DatasetService.delete_column(dataset_id, var_name)
        if not ds:
            raise HTTPException(status_code=404, detail=f"Dataset dengan ID '{dataset_id}' tidak ditemukan")
        return ds
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{dataset_id}/export/csv", summary="Ekspor dataset ke file CSV")
async def export_csv(dataset_id: str):
    try:
        ds = DatasetService.get_dataset(dataset_id)
        if not ds:
            raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' tidak ditemukan")

        csv_content = DatasetService.export_csv(dataset_id)
        safe_name = re.sub(r"[^\w\-]", "_", ds.name) or "dataset"
        filename = f"{safe_name}.csv"
        encoded_filename = urllib.parse.quote(filename)

        return Response(
            content=csv_content,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f"attachment; filename=\"{filename}\"; filename*=UTF-8''{encoded_filename}"},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{dataset_id}/export/xlsx", summary="Ekspor dataset ke file Excel multi-sheet")
async def export_xlsx(dataset_id: str):
    try:
        ds = DatasetService.get_dataset(dataset_id)
        if not ds:
            raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' tidak ditemukan")

        xlsx_stream = DatasetService.export_xlsx(dataset_id)
        safe_name = re.sub(r"[^\w\-]", "_", ds.name) or "dataset"
        filename = f"{safe_name}.xlsx"
        encoded_filename = urllib.parse.quote(filename)

        return StreamingResponse(
            xlsx_stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=\"{filename}\"; filename*=UTF-8''{encoded_filename}"},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

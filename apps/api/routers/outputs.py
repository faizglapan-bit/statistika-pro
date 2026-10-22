from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from schemas.output import (
    AnalysisOutputMetadata,
    AnalysisOutputCreate,
    AnalysisOutput,
)
from services.output_service import OutputService

router = APIRouter(prefix="/api/outputs", tags=["Outputs"])


@router.get("", response_model=List[AnalysisOutputMetadata], summary="Ambil daftar riwayat analisis")
async def get_outputs(dataset_id: Optional[str] = Query(None, description="Filter riwayat berdasarkan ID dataset")) -> List[AnalysisOutputMetadata]:
    return OutputService.list_outputs(dataset_id=dataset_id)


@router.get("/{output_id}", response_model=AnalysisOutput, summary="Ambil dokumen hasil analisis lengkap")
async def get_output_by_id(output_id: str) -> AnalysisOutput:
    output = OutputService.get_output(output_id)
    if not output:
        raise HTTPException(status_code=404, detail="Hasil analisis tidak ditemukan.")
    return output


@router.post("", response_model=AnalysisOutput, summary="Simpan hasil analisis baru")
async def save_output(payload: AnalysisOutputCreate) -> AnalysisOutput:
    return OutputService.create_output(payload)


@router.delete("/{output_id}", summary="Hapus riwayat analisis")
async def delete_output(output_id: str):
    success = OutputService.delete_output(output_id)
    if not success:
        raise HTTPException(status_code=404, detail="Hasil analisis tidak ditemukan atau sudah terhapus.")
    return {"status": "success", "message": "Riwayat analisis berhasil dihapus.", "id": output_id}

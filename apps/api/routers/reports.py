from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from typing import Dict, Any

from schemas.report import (
    ReportGenerateRequest,
    AvailableSectionsResponse,
)
from report_generator import (
    ReportAggregator,
    build_pdf_report,
    build_docx_report,
    build_xlsx_report,
)

router = APIRouter(prefix="/api/reports", tags=["Report Generator"])


@router.get("/{dataset_id}/available-sections")
def get_available_sections(dataset_id: str):
    try:
        return ReportAggregator.get_available_sections(dataset_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{dataset_id}/preview")
def preview_report(dataset_id: str, payload: ReportGenerateRequest):
    try:
        data = ReportAggregator.aggregate_report_data(
            dataset_id=dataset_id,
            metadata=payload.metadata,
            selected_sections=payload.sections,
            include_history=payload.include_transformation_history,
        )
        # Sederhanakan ringkasan pratinjau agar ringan dikirim ke frontend
        return {
            "title": data["metadata"].get("title"),
            "dataset_name": data["dataset"].get("name"),
            "sample_size": len(data["dataset"].get("rows", [])),
            "variable_count": len(data["dataset"].get("variables", [])),
            "selected_sections_count": len(payload.sections),
            "included_analyses": {k: len(v) for k, v in data["analysis_map"].items() if len(v) > 0},
            "history_count": len(data["histories"]),
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


import re

def _clean_filename(raw_name: str, ext: str) -> str:
    cleaned = re.sub(r"[^\w\-_.]", "_", raw_name)
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    return f"Laporan_Statistik_{cleaned}.{ext}"


@router.post("/{dataset_id}/export/pdf")
def export_pdf_report(dataset_id: str, payload: ReportGenerateRequest):
    try:
        data = ReportAggregator.aggregate_report_data(
            dataset_id=dataset_id,
            metadata=payload.metadata,
            selected_sections=payload.sections,
            include_history=payload.include_transformation_history,
        )
        pdf_buffer = build_pdf_report(data)
        filename = _clean_filename(data["dataset"].get("name", "Dataset"), "pdf")

        return Response(
            content=pdf_buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal membuat dokumen PDF: {str(e)}")


@router.post("/{dataset_id}/export/docx")
def export_docx_report(dataset_id: str, payload: ReportGenerateRequest):
    try:
        data = ReportAggregator.aggregate_report_data(
            dataset_id=dataset_id,
            metadata=payload.metadata,
            selected_sections=payload.sections,
            include_history=payload.include_transformation_history,
        )
        docx_buffer = build_docx_report(data)
        filename = _clean_filename(data["dataset"].get("name", "Dataset"), "docx")

        return Response(
            content=docx_buffer.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal membuat dokumen DOCX: {str(e)}")


@router.post("/{dataset_id}/export/xlsx")
def export_xlsx_report(dataset_id: str, payload: ReportGenerateRequest):
    try:
        data = ReportAggregator.aggregate_report_data(
            dataset_id=dataset_id,
            metadata=payload.metadata,
            selected_sections=payload.sections,
            include_history=payload.include_transformation_history,
        )
        xlsx_buffer = build_xlsx_report(data)
        filename = _clean_filename(data["dataset"].get("name", "Dataset"), "xlsx")

        return Response(
            content=xlsx_buffer.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal membuat workbook XLSX: {str(e)}")

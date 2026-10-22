from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional

from schemas.dataset import Dataset, DatasetCreate, DatasetUpdate
from schemas.case import (
    SortCasesRequest,
    FilterCasesRequest,
    FilterCasesResponse,
    DuplicateDetectionRequest,
    DuplicateDetectionResponse,
    RemoveDuplicatesRequest,
    MissingSummaryResponse,
)
from services.dataset_service import DatasetService
from services.case_service import CaseService
from services.audit_service import AuditService

router = APIRouter(prefix="/api/cases", tags=["Case Management"])


@router.post("/{dataset_id}/sort")
def sort_dataset_cases(dataset_id: str, payload: SortCasesRequest):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")

    sorted_rows = CaseService.sort_cases(dataset.rows, payload.sort_variables)

    if payload.save_as_new_dataset:
        sort_desc = ", ".join([f"{s.name} ({'Asc' if s.ascending else 'Desc'})" for s in payload.sort_variables])
        created = DatasetService.create_dataset(
            DatasetCreate(
                name=payload.new_dataset_name or f"{dataset.name} (Sorted)",
                description=f"Dibuat dari {dataset.name} diurutkan berdasarkan {sort_desc}",
                variables=dataset.variables,
                rows=sorted_rows,
            )
        )
        return {"success": True, "message": "Dataset baru hasil pengurutan berhasil dibuat.", "new_dataset_id": created.id}

    AuditService.save_snapshot(
        dataset=dataset,
        operation_type="Sort Cases",
        description=f"Pengurutan kasus berdasarkan: {', '.join([s.name for s in payload.sort_variables])}",
        affected_rows=len(dataset.rows),
    )

    updated = DatasetService.update_dataset(dataset.id, DatasetUpdate(rows=sorted_rows))
    return {"success": True, "message": "Kasus berhasil diurutkan.", "dataset": updated}


@router.post("/{dataset_id}/filter", response_model=FilterCasesResponse)
def filter_dataset_cases(dataset_id: str, payload: FilterCasesRequest):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")

    var_names = [v.name for v in dataset.variables]
    try:
        matched_rows, matched_ids, warnings = CaseService.filter_cases(
            dataset.rows,
            var_names,
            payload.condition_expression,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    new_ds_id = None
    if payload.mode == "new_dataset":
        created = DatasetService.create_dataset(
            DatasetCreate(
                name=payload.new_dataset_name or f"{dataset.name} (Filtered)",
                description=f"Dibuat dari {dataset.name} dengan kondisi filter: {payload.condition_expression}",
                variables=dataset.variables,
                rows=matched_rows,
            )
        )
        new_ds_id = created.id

    return FilterCasesResponse(
        total_cases=len(dataset.rows),
        matched_cases=len(matched_rows),
        excluded_cases=len(dataset.rows) - len(matched_rows),
        matched_row_ids=matched_ids,
        new_dataset_id=new_ds_id,
        warnings=warnings,
    )


@router.post("/{dataset_id}/detect-duplicates", response_model=DuplicateDetectionResponse)
def detect_duplicate_cases(dataset_id: str, payload: DuplicateDetectionRequest):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")

    return CaseService.detect_duplicates(dataset.rows, payload.key_variables, keep=payload.keep)


@router.post("/{dataset_id}/remove-duplicates")
def remove_duplicate_cases(dataset_id: str, payload: RemoveDuplicatesRequest):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")

    clean_rows = CaseService.remove_duplicates(dataset.rows, payload.key_variables, keep=payload.keep)
    removed_count = len(dataset.rows) - len(clean_rows)

    if payload.save_as_new_dataset:
        created = DatasetService.create_dataset(
            DatasetCreate(
                name=payload.new_dataset_name or f"{dataset.name} (Tanpa Duplikat)",
                description=f"Dibuat dari {dataset.name} dengan menghapus {removed_count} baris duplikat",
                variables=dataset.variables,
                rows=clean_rows,
            )
        )
        return {
            "success": True,
            "message": f"Dataset baru berhasil dibuat tanpa {removed_count} baris duplikat.",
            "new_dataset_id": created.id,
            "removed_count": removed_count,
        }

    AuditService.save_snapshot(
        dataset=dataset,
        operation_type="Remove Duplicates",
        description=f"Penghapusan {removed_count} duplikasi berdasarkan kunci: {', '.join(payload.key_variables)}",
        affected_rows=removed_count,
    )

    updated = DatasetService.update_dataset(dataset.id, DatasetUpdate(rows=clean_rows))
    return {
        "success": True,
        "message": f"{removed_count} baris duplikat berhasil dihapus dari dataset aktif.",
        "removed_count": removed_count,
        "dataset": updated,
    }


@router.get("/{dataset_id}/missing-summary", response_model=MissingSummaryResponse)
def get_dataset_missing_summary(dataset_id: str):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")

    return CaseService.summarize_missing(dataset)

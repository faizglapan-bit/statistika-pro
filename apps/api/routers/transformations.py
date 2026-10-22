from fastapi import APIRouter, HTTPException, Path
from typing import List, Dict, Any, Optional
import uuid

from schemas.dataset import Dataset, DatasetCreate, DatasetUpdate, VariableDefinition
from schemas.transformation import (
    ComputeVariableRequest,
    RecodeVariableRequest,
    ReverseScoreRequest,
    CompositeScoreRequest,
    StandardizeRequest,
    CategorizeRequest,
    TransformationPreviewResponse,
    TransformationApplyResponse,
)
from services.dataset_service import DatasetService
from services.audit_service import AuditService
from transformation_engine import (
    evaluate_expression_on_rows,
    recode_series,
    reverse_score_series,
    compute_composite_score,
    standardize_series,
    categorize_series,
)

router = APIRouter(prefix="/api/transformations", tags=["Transformations"])


def _commit_or_preview_variable(
    dataset: Dataset,
    target_var_name: str,
    target_label: Optional[str],
    target_type: str,
    computed_values: List[Any],
    operation_type: str,
    description: str,
    source_vars: List[str],
    preview_only: bool,
    save_as_new: bool,
    new_dataset_name: Optional[str],
    warnings: List[str],
) -> Any:
    """Helper untuk menghasilkan respons preview atau meng-commit transformasi ke dataset."""
    valid_count = sum(1 for v in computed_values if v is not None)
    missing_count = len(computed_values) - valid_count

    if preview_only:
        preview_rows = []
        for i, row in enumerate(dataset.rows[:10]):
            preview_row = dict(row)
            preview_row[target_var_name] = computed_values[i] if i < len(computed_values) else None
            preview_rows.append(preview_row)

        return TransformationPreviewResponse(
            target_variable=target_var_name,
            preview_rows=preview_rows,
            valid_count=valid_count,
            missing_count=missing_count,
            warnings=warnings,
        )

    # 1. Simpan snapshot audit sebelum mutasi jika dataset aktif dimodifikasi
    snapshot_id = AuditService.save_snapshot(
        dataset=dataset,
        operation_type=operation_type,
        description=description,
        affected_rows=len(dataset.rows),
        source_vars=source_vars,
        target_vars=[target_var_name],
    )

    # 2. Siapkan data baru
    new_rows = []
    for i, row in enumerate(dataset.rows):
        new_row = dict(row)
        new_row[target_var_name] = computed_values[i] if i < len(computed_values) else None
        new_rows.append(new_row)

    # Siapkan definisi variabel target
    existing_vars = [v for v in dataset.variables if v.name.lower() != target_var_name.lower()]
    new_var_def = VariableDefinition(
        name=target_var_name,
        type=target_type,
        width=8,
        decimals=2 if target_type == "numeric" else 0,
        label=target_label or f"Hasil {operation_type}",
        measure="scale" if target_type == "numeric" else "nominal",
    )
    new_variables = existing_vars + [new_var_def]

    new_ds_id = None
    if save_as_new:
        ds_name = new_dataset_name or f"{dataset.name} ({target_var_name})"
        created = DatasetService.create_dataset(
            DatasetCreate(
                name=ds_name,
                description=f"Dibuat dari {dataset.name} via {operation_type}",
                variables=new_variables,
                rows=new_rows,
            )
        )
        new_ds_id = created.id
    else:
        DatasetService.update_dataset(
            dataset.id,
            DatasetUpdate(
                variables=new_variables,
                rows=new_rows,
            ),
        )

    return TransformationApplyResponse(
        success=True,
        message=f"Transformasi '{operation_type}' berhasil diterapkan.",
        operation_id=str(uuid.uuid4())[:8],
        dataset_id=dataset.id,
        version_id=snapshot_id,
        affected_rows=len(dataset.rows),
        new_variables=[target_var_name],
        warnings=warnings,
        new_dataset_id=new_ds_id,
    )


@router.post("/{dataset_id}/compute")
def compute_variable(dataset_id: str, payload: ComputeVariableRequest):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")

    var_names = [v.name for v in dataset.variables]
    try:
        results, warnings = evaluate_expression_on_rows(
            payload.expression,
            dataset.rows,
            var_names,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return _commit_or_preview_variable(
        dataset=dataset,
        target_var_name=payload.target_variable.strip(),
        target_label=payload.target_label,
        target_type="numeric",
        computed_values=results,
        operation_type="Compute Variable",
        description=f"{payload.target_variable} = {payload.expression}",
        source_vars=[],
        preview_only=payload.preview_only,
        save_as_new=payload.save_as_new_dataset,
        new_dataset_name=payload.new_dataset_name,
        warnings=warnings,
    )


@router.post("/{dataset_id}/recode")
def recode_variable(dataset_id: str, payload: RecodeVariableRequest):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")

    source_vals = [r.get(payload.source_variable) for r in dataset.rows]
    try:
        results, warnings = recode_series(
            source_vals,
            payload.rules,
            target_type=payload.target_type,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return _commit_or_preview_variable(
        dataset=dataset,
        target_var_name=payload.target_variable.strip(),
        target_label=payload.target_label,
        target_type=payload.target_type,
        computed_values=results,
        operation_type="Recode Variable",
        description=f"Recode {payload.source_variable} -> {payload.target_variable}",
        source_vars=[payload.source_variable],
        preview_only=payload.preview_only,
        save_as_new=payload.save_as_new_dataset,
        new_dataset_name=payload.new_dataset_name,
        warnings=warnings,
    )


@router.post("/{dataset_id}/reverse-score")
def reverse_score_variables(dataset_id: str, payload: ReverseScoreRequest):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")

    all_warnings = []
    computed_map: Dict[str, List[Any]] = {}

    for src_var in payload.source_variables:
        src_vals = [r.get(src_var) for r in dataset.rows]
        try:
            res, warns = reverse_score_series(src_vals, payload.scale_min, payload.scale_max)
            target_name = f"{payload.target_prefix}{src_var}"
            computed_map[target_name] = res
            all_warnings.extend(warns)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    if payload.preview_only:
        preview_rows = []
        for i, row in enumerate(dataset.rows[:10]):
            preview_row = dict(row)
            for t_name, vals in computed_map.items():
                preview_row[t_name] = vals[i] if i < len(vals) else None
            preview_rows.append(preview_row)

        first_target = list(computed_map.keys())[0] if computed_map else "REV"
        first_vals = list(computed_map.values())[0] if computed_map else []
        valid_cnt = sum(1 for v in first_vals if v is not None)
        return TransformationPreviewResponse(
            target_variable=first_target,
            preview_rows=preview_rows,
            valid_count=valid_cnt,
            missing_count=len(first_vals) - valid_cnt,
            warnings=list(set(all_warnings)),
        )

    snapshot_id = AuditService.save_snapshot(
        dataset=dataset,
        operation_type="Reverse Score",
        description=f"Pembalikan skor item: {', '.join(payload.source_variables)} (skala {payload.scale_min}-{payload.scale_max})",
        affected_rows=len(dataset.rows),
        source_vars=payload.source_variables,
        target_vars=list(computed_map.keys()),
    )

    new_rows = []
    for i, row in enumerate(dataset.rows):
        new_row = dict(row)
        for t_name, vals in computed_map.items():
            new_row[t_name] = vals[i] if i < len(vals) else None
        new_rows.append(new_row)

    new_vars = list(dataset.variables)
    for t_name in computed_map.keys():
        if not any(v.name.lower() == t_name.lower() for v in new_vars):
            new_vars.append(
                VariableDefinition(
                    name=t_name,
                    type="numeric",
                    width=8,
                    decimals=0,
                    label=f"Reverse score of {t_name.replace(payload.target_prefix, '')}",
                    measure="scale",
                )
            )

    new_ds_id = None
    if payload.save_as_new_dataset:
        created = DatasetService.create_dataset(
            DatasetCreate(
                name=payload.new_dataset_name or f"{dataset.name} (Reversed)",
                description=f"Dibuat dari {dataset.name} via Reverse Score",
                variables=new_vars,
                rows=new_rows,
            )
        )
        new_ds_id = created.id
    else:
        DatasetService.update_dataset(
            dataset.id,
            DatasetUpdate(
                variables=new_vars,
                rows=new_rows,
            ),
        )

    return TransformationApplyResponse(
        success=True,
        message="Pembalikan skor (reverse scoring) berhasil diterapkan.",
        operation_id=str(uuid.uuid4())[:8],
        dataset_id=dataset.id,
        version_id=snapshot_id,
        affected_rows=len(dataset.rows),
        new_variables=list(computed_map.keys()),
        warnings=list(set(all_warnings)),
        new_dataset_id=new_ds_id,
    )


@router.post("/{dataset_id}/composite-score")
def composite_score(dataset_id: str, payload: CompositeScoreRequest):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")

    try:
        results, warnings = compute_composite_score(
            dataset.rows,
            payload.source_variables,
            method=payload.method,
            min_valid_items=payload.min_valid_items,
            min_valid_percent=payload.min_valid_percent,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return _commit_or_preview_variable(
        dataset=dataset,
        target_var_name=payload.target_variable.strip(),
        target_label=payload.target_label,
        target_type="numeric",
        computed_values=results,
        operation_type=f"Composite Score ({payload.method.upper()})",
        description=f"{payload.target_variable} = {payload.method}({', '.join(payload.source_variables)})",
        source_vars=payload.source_variables,
        preview_only=payload.preview_only,
        save_as_new=payload.save_as_new_dataset,
        new_dataset_name=payload.new_dataset_name,
        warnings=warnings,
    )


@router.post("/{dataset_id}/standardize")
def standardize_variables(dataset_id: str, payload: StandardizeRequest):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")

    all_warnings = []
    computed_map: Dict[str, List[Any]] = {}

    for src_var in payload.source_variables:
        src_vals = [r.get(src_var) for r in dataset.rows]
        try:
            res, warns = standardize_series(src_vals)
            t_name = f"{payload.target_prefix}{src_var}"
            computed_map[t_name] = res
            all_warnings.extend(warns)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    if payload.preview_only:
        preview_rows = []
        for i, row in enumerate(dataset.rows[:10]):
            preview_row = dict(row)
            for t_name, vals in computed_map.items():
                preview_row[t_name] = vals[i] if i < len(vals) else None
            preview_rows.append(preview_row)

        first_target = list(computed_map.keys())[0] if computed_map else "Z"
        first_vals = list(computed_map.values())[0] if computed_map else []
        valid_cnt = sum(1 for v in first_vals if v is not None)
        return TransformationPreviewResponse(
            target_variable=first_target,
            preview_rows=preview_rows,
            valid_count=valid_cnt,
            missing_count=len(first_vals) - valid_cnt,
            warnings=list(set(all_warnings)),
        )

    snapshot_id = AuditService.save_snapshot(
        dataset=dataset,
        operation_type="Standardize Z-Score",
        description=f"Standardisasi Z-Score untuk: {', '.join(payload.source_variables)}",
        affected_rows=len(dataset.rows),
        source_vars=payload.source_variables,
        target_vars=list(computed_map.keys()),
    )

    new_rows = []
    for i, row in enumerate(dataset.rows):
        new_row = dict(row)
        for t_name, vals in computed_map.items():
            new_row[t_name] = vals[i] if i < len(vals) else None
        new_rows.append(new_row)

    new_vars = list(dataset.variables)
    for t_name in computed_map.keys():
        if not any(v.name.lower() == t_name.lower() for v in new_vars):
            new_vars.append(
                VariableDefinition(
                    name=t_name,
                    type="numeric",
                    width=8,
                    decimals=4,
                    label=f"Z-Score of {t_name.replace(payload.target_prefix, '')}",
                    measure="scale",
                )
            )

    new_ds_id = None
    if payload.save_as_new_dataset:
        created = DatasetService.create_dataset(
            DatasetCreate(
                name=payload.new_dataset_name or f"{dataset.name} (Z-Score)",
                description=f"Dibuat dari {dataset.name} via Standardize Z-Score",
                variables=new_vars,
                rows=new_rows,
            )
        )
        new_ds_id = created.id
    else:
        DatasetService.update_dataset(
            dataset.id,
            DatasetUpdate(
                variables=new_vars,
                rows=new_rows,
            ),
        )

    return TransformationApplyResponse(
        success=True,
        message="Standardisasi Z-score berhasil diterapkan.",
        operation_id=str(uuid.uuid4())[:8],
        dataset_id=dataset.id,
        version_id=snapshot_id,
        affected_rows=len(dataset.rows),
        new_variables=list(computed_map.keys()),
        warnings=list(set(all_warnings)),
        new_dataset_id=new_ds_id,
    )


@router.post("/{dataset_id}/categorize")
def categorize_variable(dataset_id: str, payload: CategorizeRequest):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")

    src_vals = [r.get(payload.source_variable) for r in dataset.rows]
    try:
        results, warnings = categorize_series(
            src_vals,
            method=payload.method,
            intervals_count=payload.intervals_count or 3,
            cutpoints=payload.cutpoints,
            category_labels=payload.category_labels,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return _commit_or_preview_variable(
        dataset=dataset,
        target_var_name=payload.target_variable.strip(),
        target_label=payload.target_label,
        target_type="string" if payload.category_labels else "numeric",
        computed_values=results,
        operation_type="Categorize Variable",
        description=f"Kategorisasi {payload.source_variable} -> {payload.target_variable} ({payload.method})",
        source_vars=[payload.source_variable],
        preview_only=payload.preview_only,
        save_as_new=payload.save_as_new_dataset,
        new_dataset_name=payload.new_dataset_name,
        warnings=warnings,
    )


@router.get("/{dataset_id}/history")
def get_transformation_history(dataset_id: str):
    return AuditService.list_history(dataset_id)


@router.post("/{dataset_id}/rollback/{snapshot_id}")
def rollback_transformation(dataset_id: str, snapshot_id: str):
    updated = AuditService.rollback(dataset_id, snapshot_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Snapshot tidak ditemukan atau gagal dipulihkan")
    return {"success": True, "message": "Dataset berhasil dikembalikan ke versi snapshot.", "dataset": updated}


@router.post("/{dataset_id}/undo")
def undo_transformation(dataset_id: str):
    histories = AuditService.list_history(dataset_id)
    if not histories:
        raise HTTPException(status_code=400, detail="Tidak ada riwayat transformasi untuk di-undo")

    latest_snapshot = histories[0]["snapshot_id"]
    updated = AuditService.rollback(dataset_id, latest_snapshot)
    if not updated:
        raise HTTPException(status_code=500, detail="Gagal melakukan undo ke snapshot terbaru")
    return {"success": True, "message": "Operasi terakhir berhasil di-undo.", "dataset": updated}

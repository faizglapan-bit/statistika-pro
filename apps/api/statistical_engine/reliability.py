from typing import List, Dict, Any, Optional
import math
import numpy as np
import pandas as pd

from statistical_engine.schemas import (
    StatValue,
    ReliabilityItemDeletedResult,
    ReliabilityResponse,
)
from statistical_engine.common import (
    extract_numeric_data,
    sanitize_float,
    format_stat,
)
from statistical_engine.exceptions import InsufficientDataError


def _compute_cronbach_alpha(df_items: pd.DataFrame) -> Optional[float]:
    """Helper untuk menghitung Cronbach's Alpha dari dataframe item."""
    k = df_items.shape[1]
    if k < 2 or len(df_items) < 2:
        return None

    item_vars = df_items.var(axis=0, ddof=1)
    sum_item_vars = float(item_vars.sum())
    total_score = df_items.sum(axis=1)
    total_var = float(total_score.var(ddof=1))

    if total_var == 0.0:
        return None

    alpha = (k / (k - 1)) * (1.0 - (sum_item_vars / total_var))
    return sanitize_float(alpha)


def calculate_reliability(
    dataset: Any,
    items: List[str],
) -> ReliabilityResponse:
    """
    Hitung Uji Reliabilitas Cronbach's Alpha dan tabel Item-Total Statistics.
    """
    if len(items) < 2:
        raise InsufficientDataError("Uji reliabilitas membutuhkan minimal 2 item.")

    df, meta = extract_numeric_data(dataset, items, missing_policy="listwise", min_required_rows=2)
    n_valid = len(df)
    k = len(items)
    warnings: List[str] = []

    # 1. Varians per item & Total
    item_vars_dict: Dict[str, StatValue] = {}
    for col in items:
        v = float(df[col].var(ddof=1))
        if v == 0.0:
            warnings.append(f"Item '{col}' memiliki varians 0 (nilai konstan).")
        item_vars_dict[col] = StatValue(value=sanitize_float(v), formatted=format_stat(v))

    total_score = df.sum(axis=1)
    total_var = float(total_score.var(ddof=1))
    if total_var == 0.0:
        warnings.append("Skor total memiliki varians 0. Alpha tidak dapat dihitung.")

    # 2. Nilai Cronbach's Alpha Utama
    overall_alpha = _compute_cronbach_alpha(df)
    alpha_stat = StatValue(
        value=overall_alpha,
        formatted=format_stat(overall_alpha) if overall_alpha is not None else "—",
        note="Varians total nol" if total_var == 0.0 else None,
    )

    # 3. Item-Total Statistics & Alpha if Item Deleted
    item_deleted_results: List[ReliabilityItemDeletedResult] = []

    for item_name in items:
        remaining_items = [c for c in items if c != item_name]
        df_remaining = df[remaining_items]
        remaining_total = df_remaining.sum(axis=1)

        scale_mean_del = float(remaining_total.mean())
        scale_var_del = float(remaining_total.var(ddof=1))

        # Corrected Item-Total Correlation
        if scale_var_del == 0.0 or item_vars_dict[item_name].value == 0.0:
            r_corrected = None
        else:
            r_corrected = float(df[item_name].corr(remaining_total))

        # Alpha if Item Deleted
        alpha_deleted = _compute_cronbach_alpha(df_remaining)

        item_deleted_results.append(
            ReliabilityItemDeletedResult(
                item=item_name,
                scale_mean_if_deleted=StatValue(value=sanitize_float(scale_mean_del), formatted=format_stat(scale_mean_del)),
                scale_var_if_deleted=StatValue(value=sanitize_float(scale_var_del), formatted=format_stat(scale_var_del)),
                corrected_item_total_corr=StatValue(value=sanitize_float(r_corrected), formatted=format_stat(r_corrected)),
                alpha_if_deleted=StatValue(value=sanitize_float(alpha_deleted), formatted=format_stat(alpha_deleted) if alpha_deleted is not None else "—"),
            )
        )

    # 4. Interpretasi
    if overall_alpha is not None:
        if overall_alpha >= 0.8:
            interp_qual = "sangat baik (reliabilitas tinggi)"
        elif overall_alpha >= 0.7:
            interp_qual = "cukup baik (dapat diterima)"
        elif overall_alpha >= 0.6:
            interp_qual = "moderat"
        else:
            interp_qual = "kurang memadai"
        interpretation = (
            f"Nilai Cronbach's Alpha sebesar {format_stat(overall_alpha)} mengindikasikan konsistensi internal yang {interp_qual}. "
            "Pedoman umum: Alpha >= 0.70 lazim digunakan sebagai batas kelayakan instrumen penelitian. "
            "Catatan: Nilai Alpha harus ditafsirkan sesuai konteks dan bukan merupakan bukti tunggal kualitas instrumen."
        )
    else:
        interpretation = "Nilai Alpha tidak dapat dihitung karena ketiadaan variasi pada skor instrumen."

    return ReliabilityResponse(
        dataset_id=dataset.id,
        dataset_name=dataset.name,
        cronbach_alpha=alpha_stat,
        item_count=k,
        sample_size=n_valid,
        item_variances=item_vars_dict,
        total_variance=StatValue(value=sanitize_float(total_var), formatted=format_stat(total_var)),
        item_deleted_stats=item_deleted_results,
        interpretation=interpretation,
        warnings=warnings,
    )

from typing import List, Dict, Any, Optional
import math
import numpy as np
import pandas as pd

from statistical_engine.schemas import (
    StatValue,
    ValidityItemResult,
    ValidityResponse,
)
from statistical_engine.common import (
    extract_numeric_data,
    sanitize_float,
    format_stat,
    format_p_value,
)


def calculate_validity(
    dataset: Any,
    items: List[str],
    method: str = "pearson",
    score_type: str = "sum",
) -> ValidityResponse:
    """
    Hitung Uji Validitas Item (Item-Total Correlation & Corrected Item-Total Correlation).
    """
    df, meta = extract_numeric_data(dataset, items, missing_policy="listwise", min_required_rows=3)
    n_valid = len(df)
    warnings: List[str] = []

    # Hitung total score konstruk
    if score_type == "mean":
        total_score = df.mean(axis=1)
    else:
        total_score = df.sum(axis=1)

    item_results: List[ValidityItemResult] = []

    for item_name in items:
        item_s = df[item_name]
        var_item = float(item_s.var(ddof=1))

        if var_item == 0.0:
            warnings.append(f"Item '{item_name}' memiliki varians 0 (nilai konstan).")
            item_results.append(
                ValidityItemResult(
                    item=item_name,
                    r_total=StatValue(value=None, formatted="—", note="Varians nol"),
                    r_corrected=StatValue(value=None, formatted="—", note="Varians nol"),
                    p_value=StatValue(value=None, formatted="—", note="Varians nol"),
                    n_valid=n_valid,
                    is_valid=False,
                    notes="Item konstan",
                )
            )
            continue

        # Corrected total (tanpa item ini)
        other_items = [c for c in items if c != item_name]
        if score_type == "mean":
            corrected_total = df[other_items].mean(axis=1)
        else:
            corrected_total = df[other_items].sum(axis=1)

        var_other = float(corrected_total.var(ddof=1))
        if var_other == 0.0:
            warnings.append(f"Sisa item tanpa '{item_name}' memiliki varians total 0.")
            r_corr = None
        else:
            r_corr = float(item_s.corr(corrected_total, method=method))

        r_tot = float(item_s.corr(total_score, method=method))

        # Hitung p-value 2 sisi untuk r_corrected
        # t = r * sqrt(N - 2) / sqrt(1 - r^2)
        p_val: Optional[float] = None
        if r_corr is not None and not math.isnan(r_corr):
            if abs(r_corr) >= 1.0:
                p_val = 0.0
            else:
                df_deg = n_valid - 2
                t_val = r_corr * math.sqrt(df_deg) / math.sqrt(max(1e-12, 1.0 - r_corr**2))
                try:
                    import scipy.stats as stats
                    p_val = float(2 * (1 - stats.t.cdf(abs(t_val), df=df_deg)))
                except Exception:
                    p_val = None

        is_valid = bool(r_corr is not None and r_corr > 0.3 and (p_val is not None and p_val < 0.05))

        item_results.append(
            ValidityItemResult(
                item=item_name,
                r_total=StatValue(value=sanitize_float(r_tot), formatted=format_stat(r_tot)),
                r_corrected=StatValue(value=sanitize_float(r_corr), formatted=format_stat(r_corr)),
                p_value=StatValue(value=sanitize_float(p_val), formatted=format_p_value(p_val)),
                n_valid=n_valid,
                is_valid=is_valid,
                notes="Valid (r > 0.3 & p < 0.05)" if is_valid else "Perlu ditinjau ulang",
            )
        )

    interpretation = (
        "Item dinyatakan valid jika memiliki korelasi item-total yang terkoreksi positif dan signifikan (umumnya r > 0.30 dan p < 0.05). "
        "Catatan: Korelasi item-total merupakan salah satu bukti evaluasi instrumen, bukan satu-satunya bukti validitas konstruk."
    )

    return ValidityResponse(
        dataset_id=dataset.id,
        dataset_name=dataset.name,
        method=method.capitalize(),
        score_type=score_type,
        sample_size=n_valid,
        items=item_results,
        warnings=warnings,
        interpretation=interpretation,
    )

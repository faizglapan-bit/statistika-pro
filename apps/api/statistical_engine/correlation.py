from typing import List, Dict, Any, Optional, Tuple
import math
import numpy as np
import pandas as pd

from statistical_engine.schemas import (
    StatValue,
    CorrelationCell,
    CorrelationResponse,
)
from statistical_engine.common import (
    extract_numeric_data,
    sanitize_float,
    format_stat,
    format_p_value,
)


def _compute_pair_correlation(
    s1: pd.Series,
    s2: pd.Series,
    method: str = "pearson",
) -> Tuple[Optional[float], Optional[float], int]:
    """Hitung korelasi dan p-value dua sisi untuk sepasang variabel."""
    # Complete case per pair
    mask = s1.notna() & s2.notna()
    x = s1[mask].to_numpy(dtype=float)
    y = s2[mask].to_numpy(dtype=float)
    n = len(x)

    if n < 3:
        return None, None, n

    # Cek varians
    if np.var(x, ddof=1) == 0.0 or np.var(y, ddof=1) == 0.0:
        return None, None, n

    try:
        import scipy.stats as stats
        if method == "spearman":
            res = stats.spearmanr(x, y)
            r = float(res.statistic if hasattr(res, "statistic") else res[0])
            p = float(res.pvalue if hasattr(res, "pvalue") else res[1])
        else:
            res = stats.pearsonr(x, y)
            r = float(res.statistic if hasattr(res, "statistic") else res[0])
            p = float(res.pvalue if hasattr(res, "pvalue") else res[1])
        return sanitize_float(r), sanitize_float(p), n
    except Exception:
        # Fallback perhitungan Pearson manual
        r_val = float(np.corrcoef(x, y)[0, 1])
        if math.isnan(r_val):
            return None, None, n
        df_deg = n - 2
        if abs(r_val) >= 1.0:
            p_val = 0.0
        else:
            t_val = r_val * math.sqrt(df_deg) / math.sqrt(max(1e-12, 1.0 - r_val**2))
            try:
                import scipy.stats as stats
                p_val = float(2 * (1 - stats.t.cdf(abs(t_val), df=df_deg)))
            except Exception:
                p_val = None
        return sanitize_float(r_val), sanitize_float(p_val), n


def calculate_correlation(
    dataset: Any,
    variables: List[str],
    method: str = "pearson",
    missing_policy: str = "pairwise",
) -> CorrelationResponse:
    """
    Hitung Matriks Korelasi (Pearson / Spearman) lengkap dengan p-value dua sisi dan N pasangan.
    """
    df, meta = extract_numeric_data(dataset, variables, missing_policy=missing_policy, min_required_rows=3)
    warnings: List[str] = []

    # Cek kolom konstan
    for col in variables:
        valid_series = df[col].dropna()
        if len(valid_series) >= 2 and valid_series.var(ddof=1) == 0.0:
            warnings.append(f"Variabel '{col}' memiliki varians 0 (nilai konstan).")

    matrix_cells: List[CorrelationCell] = []

    for v1 in variables:
        for v2 in variables:
            if v1 == v2:
                # Diagonal
                n_single = int(df[v1].dropna().count())
                matrix_cells.append(
                    CorrelationCell(
                        var1=v1,
                        var2=v2,
                        correlation=StatValue(value=1.0, formatted="1.000"),
                        p_value=StatValue(value=None, formatted="—"),
                        n_pairs=n_single,
                        significance_star="",
                    )
                )
            else:
                r, p, n_pairs = _compute_pair_correlation(df[v1], df[v2], method=method)
                star = ""
                if p is not None:
                    if p < 0.01:
                        star = "**"
                    elif p < 0.05:
                        star = "*"

                corr_note = "Varians 0 atau data tidak cukup" if r is None else None
                matrix_cells.append(
                    CorrelationCell(
                        var1=v1,
                        var2=v2,
                        correlation=StatValue(value=r, formatted=format_stat(r), note=corr_note),
                        p_value=StatValue(value=p, formatted=format_p_value(p)),
                        n_pairs=n_pairs,
                        significance_star=star,
                    )
                )

    return CorrelationResponse(
        dataset_id=dataset.id,
        dataset_name=dataset.name,
        method=method.capitalize(),
        missing_policy=missing_policy,
        variables=variables,
        matrix=matrix_cells,
        warnings=warnings,
    )

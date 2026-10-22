from typing import List, Dict, Any, Tuple, Optional
import math
import numpy as np


def compute_composite_score(
    rows: List[Dict[str, Any]],
    source_variables: List[str],
    method: str = "mean",  # 'mean' atau 'sum'
    min_valid_items: Optional[int] = None,
    min_valid_percent: Optional[float] = None,
) -> Tuple[List[Any], List[str]]:
    """Menghitung skor komposit (mean atau sum) dengan aturan ambang batas minimum item valid."""
    if not source_variables:
        raise ValueError("Paling sedikit satu variabel sumber harus dipilih")

    total_items = len(source_variables)
    
    # Hitung batas minimum valid
    required_valid = 1
    if min_valid_items is not None:
        required_valid = max(1, min(total_items, int(min_valid_items)))
    elif min_valid_percent is not None:
        pct = max(0.0, min(100.0, float(min_valid_percent)))
        required_valid = max(1, math.ceil((pct / 100.0) * total_items))

    warnings: List[str] = []
    results: List[Any] = []
    insufficient_valid_count = 0

    lower_vars = [v.lower() for v in source_variables]

    for row in rows:
        row_lower = {k.lower(): v for k, v in row.items()}
        valid_vals = []

        for v_name in lower_vars:
            val = row_lower.get(v_name)
            if val is not None and not (isinstance(val, float) and math.isnan(val)):
                try:
                    num = float(val)
                    valid_vals.append(num)
                except (ValueError, TypeError):
                    pass

        if len(valid_vals) < required_valid:
            results.append(None)
            insufficient_valid_count += 1
            continue

        if method.lower() == "sum":
            res = float(np.sum(valid_vals))
            if res.is_integer():
                res = int(res)
        else:
            res = round(float(np.mean(valid_vals)), 4)

        results.append(res)

    if insufficient_valid_count > 0:
        warnings.append(
            f"{insufficient_valid_count} baris diatur menjadi missing karena tidak memenuhi batas minimum {required_valid} item valid."
        )

    return results, warnings

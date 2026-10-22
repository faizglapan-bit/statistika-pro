from typing import List, Any, Tuple
import math


def reverse_score_series(
    values: List[Any],
    scale_min: float,
    scale_max: float,
) -> Tuple[List[Any], List[str]]:
    """Membalikkan skor instrumen menggunakan formula: skor_baru = min + max - skor_lama."""
    if scale_min >= scale_max:
        raise ValueError(f"Batas minimum skala ({scale_min}) harus lebih kecil dari maksimum ({scale_max})")

    warnings: List[str] = []
    results: List[Any] = []
    out_of_bounds_count = 0

    constant_sum = scale_min + scale_max

    for val in values:
        if val is None or (isinstance(val, float) and math.isnan(val)) or (isinstance(val, str) and val.strip() == ""):
            results.append(None)
            continue

        try:
            num = float(val)
        except (ValueError, TypeError):
            results.append(None)
            continue

        if num < scale_min or num > scale_max:
            out_of_bounds_count += 1

        rev = constant_sum - num
        if rev.is_integer():
            rev = int(rev)
        results.append(rev)

    if out_of_bounds_count > 0:
        warnings.append(
            f"Ditemukan {out_of_bounds_count} nilai di luar rentang skala [{scale_min}, {scale_max}]. Nilai tetap dibalikkan menggunakan rumus matematis."
        )

    return results, warnings

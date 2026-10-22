from typing import List, Any, Tuple, Optional
import math
import numpy as np


def categorize_series(
    values: List[Any],
    method: str = "cutpoints",
    intervals_count: int = 3,
    cutpoints: Optional[List[float]] = None,
    category_labels: Optional[List[str]] = None,
) -> Tuple[List[Any], List[str]]:
    """Mengkategorikan variabel numerik menjadi kategori ordinal."""
    warnings: List[str] = []
    
    valid_nums = []
    for v in values:
        if v is not None and not (isinstance(v, float) and math.isnan(v)):
            try:
                valid_nums.append(float(v))
            except (ValueError, TypeError):
                pass

    if not valid_nums:
        return [None] * len(values), ["Tidak ada nilai numerik valid untuk dikategorikan."]

    cuts: List[float] = []

    if method == "cutpoints":
        if not cutpoints:
            raise ValueError("Titik potong (cutpoints) harus ditentukan")
        cuts = sorted(list(set(cutpoints)))

    elif method == "equal_intervals":
        n_int = max(2, int(intervals_count))
        min_v, max_v = float(min(valid_nums)), float(max(valid_nums))
        if min_v == max_v:
            cuts = [min_v]
        else:
            step = (max_v - min_v) / n_int
            cuts = [round(min_v + step * i, 4) for i in range(1, n_int)]

    elif method == "percentiles":
        n_int = max(2, int(intervals_count))
        percentiles = [100.0 * i / n_int for i in range(1, n_int)]
        cuts = [round(float(np.percentile(valid_nums, p)), 4) for p in percentiles]
        cuts = sorted(list(set(cuts)))

    else:
        raise ValueError(f"Metode kategorisasi tidak dikenal: '{method}'")

    results: List[Any] = []
    for v in values:
        if v is None or (isinstance(v, float) and math.isnan(v)):
            results.append(None)
            continue
        try:
            num = float(v)
        except (ValueError, TypeError):
            results.append(None)
            continue

        # Tentukan nomor kategori (1-indexed)
        cat_idx = 1
        for cp in cuts:
            if num > cp:
                cat_idx += 1
            else:
                break

        if category_labels and 1 <= cat_idx <= len(category_labels):
            results.append(category_labels[cat_idx - 1])
        else:
            results.append(cat_idx)

    return results, warnings

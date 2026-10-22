from typing import List, Any, Tuple
import math
import numpy as np


def standardize_series(values: List[Any]) -> Tuple[List[Any], List[str]]:
    """Menghitung Z-score untuk suatu seri nilai numerik: Z = (X - mean) / SD."""
    warnings: List[str] = []
    
    # Kumpulkan nilai valid
    valid_nums = []
    valid_indices = []
    for idx, v in enumerate(values):
        if v is not None and not (isinstance(v, float) and math.isnan(v)):
            try:
                valid_nums.append(float(v))
                valid_indices.append(idx)
            except (ValueError, TypeError):
                pass

    results: List[Any] = [None] * len(values)

    if len(valid_nums) < 2:
        warnings.append("Jumlah nilai valid kurang dari 2, standardisasi Z-score tidak dapat dihitung.")
        return results, warnings

    mean_val = float(np.mean(valid_nums))
    # Gunakan sample standard deviation (ddof=1)
    std_val = float(np.std(valid_nums, ddof=1))

    if std_val == 0.0 or math.isnan(std_val):
        warnings.append("Standar deviasi variabel bernilai nol (variabel konstan). Semua nilai Z diatur menjadi 0.0.")
        for idx in valid_indices:
            results[idx] = 0.0
        return results, warnings

    for idx, num in zip(valid_indices, valid_nums):
        z = (num - mean_val) / std_val
        results[idx] = round(float(z), 4)

    return results, warnings

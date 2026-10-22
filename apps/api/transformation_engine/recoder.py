from typing import List, Dict, Any, Tuple, Optional
import math
from schemas.transformation import RecodeRule


def recode_series(
    values: List[Any],
    rules: List[RecodeRule],
    target_type: str = "numeric",
) -> Tuple[List[Any], List[str]]:
    """Menerapkan sekumpulan aturan recode ke daftar nilai sumber."""
    warnings: List[str] = []
    results: List[Any] = []

    # Validasi konflik aturan rentang
    ranges: List[Tuple[float, float]] = []
    for r in rules:
        if r.rule_type == "range" and r.range_min is not None and r.range_max is not None:
            if r.range_min > r.range_max:
                raise ValueError(f"Rentang tidak valid: batas bawah ({r.range_min}) lebih besar dari batas atas ({r.range_max})")
            for ex_min, ex_max in ranges:
                if not (r.range_max < ex_min or r.range_min > ex_max):
                    warnings.append(f"Peringatan: Potensi rentang tumpang tindih antara [{r.range_min}, {r.range_max}] dan [{ex_min}, {ex_max}]")
            ranges.append((r.range_min, r.range_max))

    for val in values:
        is_val_missing = (
            val is None
            or (isinstance(val, float) and math.isnan(val))
            or (isinstance(val, str) and val.strip() == "")
        )

        matched = False
        new_val = None

        for rule in rules:
            if rule.is_missing and is_val_missing:
                new_val = rule.new_value
                matched = True
                break

            if is_val_missing:
                continue

            if rule.rule_type == "single":
                # Bandingkan tipe numerik jika keduanya numerik
                try:
                    if float(val) == float(rule.old_value):
                        new_val = rule.new_value
                        matched = True
                        break
                except (ValueError, TypeError):
                    if str(val).strip() == str(rule.old_value).strip():
                        new_val = rule.new_value
                        matched = True
                        break

            elif rule.rule_type == "range":
                try:
                    num_val = float(val)
                    if rule.range_min is not None and rule.range_max is not None:
                        if rule.range_min <= num_val <= rule.range_max:
                            new_val = rule.new_value
                            matched = True
                            break
                except (ValueError, TypeError):
                    pass

            elif rule.rule_type == "lowest_thru":
                try:
                    num_val = float(val)
                    if rule.range_max is not None and num_val <= rule.range_max:
                        new_val = rule.new_value
                        matched = True
                        break
                except (ValueError, TypeError):
                    pass

            elif rule.rule_type == "thru_highest":
                try:
                    num_val = float(val)
                    if rule.range_min is not None and num_val >= rule.range_min:
                        new_val = rule.new_value
                        matched = True
                        break
                except (ValueError, TypeError):
                    pass

            elif rule.rule_type == "else":
                new_val = rule.new_value
                matched = True
                break

        if not matched:
            # Jika tidak ada aturan yang cocok, pertahankan nilai asli jika tidak missing
            new_val = None if is_val_missing else val

        # Konversi tipe target
        if new_val is not None:
            if target_type == "numeric":
                try:
                    new_val = float(new_val)
                    if new_val.is_integer():
                        new_val = int(new_val)
                except (ValueError, TypeError):
                    new_val = None
            else:
                new_val = str(new_val)

        results.append(new_val)

    return results, list(set(warnings))

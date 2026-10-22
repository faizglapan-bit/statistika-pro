import math
from typing import List, Dict, Any, Optional, Tuple, Set
import numpy as np
import pandas as pd

from statistical_engine.exceptions import (
    VariableNotFoundError,
    NonNumericDataError,
    InsufficientDataError,
)


def sanitize_float(val: Any) -> Optional[float]:
    """Konversi nilai numerik ke float native Python atau None jika NaN/Inf."""
    if val is None:
        return None
    try:
        if hasattr(val, "item"):
            val = val.item()
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (ValueError, TypeError):
        return None


def format_p_value(p: Optional[float]) -> str:
    """Format p-value ala SPSS standar: jika p < 0.001 tampilkan '< 0.001'."""
    if p is None:
        return "—"
    f = sanitize_float(p)
    if f is None:
        return "—"
    if f < 0.001:
        return "< 0.001"
    return f"{f:.3f}"


def format_stat(val: Optional[float], decimals: int = 3) -> str:
    """Format angka statistik dengan pembulatan standar."""
    if val is None:
        return "—"
    f = sanitize_float(val)
    if f is None:
        return "—"
    return f"{f:.{decimals}f}"


def extract_numeric_data(
    dataset: Any,
    variable_names: List[str],
    missing_policy: str = "listwise",
    min_required_rows: int = 1,
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Ekstrak data numerik dari dataset dengan penanganan missing values eksplisit.
    
    Args:
        dataset: Object Dataset (memiliki atribut variables dan rows)
        variable_names: Daftar nama variabel yang ingin dianalisis
        missing_policy: "listwise" (hapus baris jika ada missing) atau "pairwise" (pertahankan NaN)
        min_required_rows: Minimal baris observasi yang diperlukan
        
    Returns:
        Tuple (df_cleaned, metadata_dict)
    """
    var_map = {v.name: v for v in dataset.variables}
    
    # 1. Validasi keberadaan variabel
    for v_name in variable_names:
        if v_name not in var_map:
            raise VariableNotFoundError(v_name)

    # 2. Ambil user-defined missing codes per variabel
    missing_codes: Dict[str, Set[str]] = {}
    for v_name in variable_names:
        missing_codes[v_name] = set(str(m).strip() for m in (var_map[v_name].missing or []))

    # 3. Bentuk DataFrame awal
    raw_records = []
    for r in dataset.rows:
        row_dict = {}
        for v_name in variable_names:
            raw_val = r.get(v_name)
            # Periksa missing values (None, string kosong, null, atau kode missing khusus)
            if raw_val is None or str(raw_val).strip() == "" or str(raw_val).lower() in ("nan", "none", "null"):
                row_dict[v_name] = np.nan
            elif str(raw_val).strip() in missing_codes[v_name]:
                row_dict[v_name] = np.nan
            else:
                row_dict[v_name] = raw_val
        raw_records.append(row_dict)

    df = pd.DataFrame(raw_records, columns=variable_names)
    total_cases = len(df)

    # 4. Konversi ke tipe numerik
    for col in variable_names:
        try:
            df[col] = pd.to_numeric(df[col])
        except Exception:
            raise NonNumericDataError(col)

    # 5. Terapkan missing policy
    if missing_policy == "listwise":
        df_clean = df.dropna()
        effective_cases = len(df_clean)
        dropped_cases = total_cases - effective_cases
    else:  # pairwise
        df_clean = df
        effective_cases = int(df.notna().all(axis=1).sum())
        dropped_cases = total_cases - effective_cases

    if len(df_clean) < min_required_rows:
        raise InsufficientDataError(
            f"Jumlah observasi valid ({len(df_clean)}) tidak mencukupi batas minimum ({min_required_rows})."
        )

    metadata = {
        "total_cases": total_cases,
        "effective_cases": effective_cases,
        "dropped_cases": dropped_cases,
        "missing_policy": missing_policy,
        "variables": variable_names,
    }

    return df_clean, metadata

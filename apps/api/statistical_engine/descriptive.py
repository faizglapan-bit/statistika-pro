import math
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd

from statistical_engine.schemas import (
    StatValue,
    DescriptiveVariableResult,
    DescriptiveResponse,
)
from statistical_engine.common import (
    extract_numeric_data,
    sanitize_float,
    format_stat,
)


def calculate_descriptive(dataset: Any, variables: List[str]) -> DescriptiveResponse:
    """
    Hitung statistik deskriptif komprehensif untuk daftar variabel numerik.
    Menggunakan definisi varians dan standar deviasi sampel (ddof=1) secara konsisten.
    """
    results: List[DescriptiveVariableResult] = []
    global_warnings: List[str] = []

    for v_name in variables:
        var_warnings: List[str] = []
        df, meta = extract_numeric_data(dataset, [v_name], missing_policy="pairwise", min_required_rows=0)
        s = df[v_name].dropna()
        n_valid = len(s)
        n_missing = meta["total_cases"] - n_valid

        if n_valid == 0:
            var_warnings.append("Tidak ada observasi valid (seluruh data kosong atau missing).")
            na_val = StatValue(value=None, formatted="—", note="Tidak ada data valid")
            results.append(
                DescriptiveVariableResult(
                    name=v_name,
                    n_valid=0,
                    n_missing=n_missing,
                    mean=na_val,
                    median=na_val,
                    mode=na_val,
                    min=na_val,
                    max=na_val,
                    range=na_val,
                    variance=na_val,
                    std_dev=na_val,
                    sem=na_val,
                    skewness=na_val,
                    kurtosis=na_val,
                    warnings=var_warnings,
                )
            )
            continue

        # Statistik Dasar
        mean_val = float(s.mean())
        median_val = float(s.median())
        min_val = float(s.min())
        max_val = float(s.max())
        range_val = max_val - min_val

        # Mode
        mode_series = s.mode()
        if len(mode_series) > 0 and len(mode_series) < n_valid:
            mode_val = float(mode_series.iloc[0])
            mode_stat = StatValue(value=mode_val, formatted=format_stat(mode_val))
        else:
            mode_stat = StatValue(value=None, formatted="—", note="Tidak ada modus tunggal")

        # Varians & Standar Deviasi Sampel (ddof=1)
        if n_valid >= 2:
            var_val = float(s.var(ddof=1))
            std_val = float(s.std(ddof=1))
            sem_val = float(std_val / math.sqrt(n_valid))
            var_stat = StatValue(value=var_val, formatted=format_stat(var_val))
            std_stat = StatValue(value=std_val, formatted=format_stat(std_val))
            sem_stat = StatValue(value=sem_val, formatted=format_stat(sem_val))
        else:
            var_stat = StatValue(value=None, formatted="—", note="N < 2")
            std_stat = StatValue(value=None, formatted="—", note="N < 2")
            sem_stat = StatValue(value=None, formatted="—", note="N < 2")
            var_warnings.append("Ukuran sampel N=1, varians sampel tidak terdefinisi.")

        # Skewness & Kurtosis
        # Cek kolom konstan
        if n_valid >= 2 and var_stat.value == 0.0:
            var_warnings.append("Variabel memiliki nilai konstan (varians = 0).")
            skew_stat = StatValue(value=None, formatted="—", note="Varians nol")
            kurt_stat = StatValue(value=None, formatted="—", note="Varians nol")
        else:
            # Skewness tak bias (SPSS standar)
            if n_valid >= 3:
                try:
                    import scipy.stats as stats
                    skew_val = float(stats.skew(s, bias=False))
                    skew_stat = StatValue(value=skew_val, formatted=format_stat(skew_val))
                except Exception:
                    # Rumus manual tak bias jika scipy belum siap
                    m = s - mean_val
                    m2 = (m**2).sum()
                    m3 = (m**3).sum()
                    skew_val = (math.sqrt(n_valid * (n_valid - 1)) / (n_valid - 2)) * (m3 / (m2 ** 1.5)) if m2 > 0 else 0.0
                    skew_stat = StatValue(value=skew_val, formatted=format_stat(skew_val))
            else:
                skew_stat = StatValue(value=None, formatted="—", note="N < 3")

            # Kurtosis ekses tak bias (SPSS standar)
            if n_valid >= 4:
                try:
                    import scipy.stats as stats
                    kurt_val = float(stats.kurtosis(s, bias=False))
                    kurt_stat = StatValue(value=kurt_val, formatted=format_stat(kurt_val))
                except Exception:
                    kurt_stat = StatValue(value=None, formatted="—", note="N < 4")
            else:
                kurt_stat = StatValue(value=None, formatted="—", note="N < 4")

        results.append(
            DescriptiveVariableResult(
                name=v_name,
                n_valid=n_valid,
                n_missing=n_missing,
                mean=StatValue(value=mean_val, formatted=format_stat(mean_val)),
                median=StatValue(value=median_val, formatted=format_stat(median_val)),
                mode=mode_stat,
                min=StatValue(value=min_val, formatted=format_stat(min_val)),
                max=StatValue(value=max_val, formatted=format_stat(max_val)),
                range=StatValue(value=range_val, formatted=format_stat(range_val)),
                variance=var_stat,
                std_dev=std_stat,
                sem=sem_stat,
                skewness=skew_stat,
                kurtosis=kurt_stat,
                warnings=var_warnings,
            )
        )

    return DescriptiveResponse(
        dataset_id=dataset.id,
        dataset_name=dataset.name,
        sample_size=len(dataset.rows),
        results=results,
        warnings=global_warnings,
    )

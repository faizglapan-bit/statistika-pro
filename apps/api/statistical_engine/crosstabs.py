"""
Modul Tabulasi Silang & Uji Chi-Square (Crosstabs) — Statistika Pro
Mendukung:
1. Tabel Kontingensi (Frekuensi Observasi & Ekspektasi, Row %, Col %, Total %)
2. Pearson Chi-Square
3. Continuity Correction (Koreksi Kontinuitas Yates untuk tabel 2x2)
4. Likelihood Ratio Chi-Square
5. Fisher's Exact Test (untuk tabel 2x2)
6. Ukuran Asosiasi: Phi (φ), Cramér's V, dan Koefisien Kontingensi (C)
7. Peringatan asumsi sel dengan frekuensi ekspektasi kecil (E < 5).
"""

from typing import Dict, Any, List, Optional
import math
import numpy as np
import pandas as pd
from scipy import stats

from statistical_engine.common import (
    sanitize_float,
    format_p_value,
    format_stat,
)
from statistical_engine.exceptions import (
    VariableNotFoundError,
    InsufficientDataError,
)


def crosstabs_analysis(
    dataset: Any,
    row_variable: str,
    column_variable: str,
) -> Dict[str, Any]:
    """
    Analisis Crosstabs dan Uji Asosiasi Chi-Square.
    """
    var_map = {v.name: v for v in dataset.variables}
    if row_variable not in var_map:
        raise VariableNotFoundError(row_variable)
    if column_variable not in var_map:
        raise VariableNotFoundError(column_variable)

    missing_row = set(str(m).strip() for m in (var_map[row_variable].missing or []))
    missing_col = set(str(m).strip() for m in (var_map[column_variable].missing or []))

    valid_pairs = []
    for r in dataset.rows:
        rv = r.get(row_variable)
        cv = r.get(column_variable)
        if rv is None or str(rv).strip() == "" or str(rv).lower() in ("nan", "none", "null"):
            continue
        if cv is None or str(cv).strip() == "" or str(cv).lower() in ("nan", "none", "null"):
            continue
        if str(rv).strip() in missing_row or str(cv).strip() in missing_col:
            continue
        valid_pairs.append((str(rv).strip(), str(cv).strip()))

    n_total = len(valid_pairs)
    if n_total < 4:
        raise InsufficientDataError(f"Jumlah sampel valid ({n_total}) terlalu sedikit untuk analisis Crosstabs.")

    df_pairs = pd.DataFrame(valid_pairs, columns=["row_val", "col_val"])
    row_categories = sorted(df_pairs["row_val"].unique().tolist())
    col_categories = sorted(df_pairs["col_val"].unique().tolist())

    n_rows = len(row_categories)
    n_cols = len(col_categories)

    if n_rows < 2 or n_cols < 2:
        raise InsufficientDataError(
            f"Tabel kontingensi membutuhkan minimal 2 kategori per variabel (Baris: {n_rows}, Kolom: {n_cols})."
        )

    # 1. Matriks Frekuensi Observasi (O)
    obs_matrix = pd.crosstab(df_pairs["row_val"], df_pairs["col_val"]).reindex(
        index=row_categories, columns=col_categories, fill_value=0
    ).to_numpy()

    # Frekuensi marginal
    row_sums = obs_matrix.sum(axis=1)
    col_sums = obs_matrix.sum(axis=0)

    # 2. Matriks Frekuensi Ekspektasi (E)
    exp_matrix = np.outer(row_sums, col_sums) / float(n_total)

    # Peringatan sel dengan E < 5
    cells_below_5 = int(np.sum(exp_matrix < 5))
    total_cells = n_rows * n_cols
    pct_below_5 = (cells_below_5 / total_cells) * 100.0
    min_exp = float(np.min(exp_matrix))

    warnings: List[str] = []
    if pct_below_5 > 20.0 or min_exp < 1.0:
        warnings.append(
            f"{cells_below_5} sel ({pct_below_5:.1f}%) memiliki frekuensi ekspektasi kurang dari 5. "
            f"Nilai ekspektasi minimum adalah {min_exp:.2f}. Asumsi Chi-Square berpotensi terlanggar."
        )

    # 3. Bentuk Tabel Silang Terperinci
    crosstab_table_rows = []
    for i, r_cat in enumerate(row_categories):
        r_sum = row_sums[i]
        # Baris Count
        row_count = {"Variabel Baris": r_cat, "Statistik": "Frekuensi Observasi"}
        row_exp = {"Variabel Baris": r_cat, "Statistik": "Frekuensi Ekspektasi"}
        row_pct_row = {"Variabel Baris": r_cat, "Statistik": "% dalam Baris"}
        row_pct_col = {"Variabel Baris": r_cat, "Statistik": "% dalam Kolom"}
        row_pct_tot = {"Variabel Baris": r_cat, "Statistik": "% dari Total"}

        for j, c_cat in enumerate(col_categories):
            o_ij = obs_matrix[i, j]
            e_ij = exp_matrix[i, j]
            c_sum = col_sums[j]

            row_count[c_cat] = int(o_ij)
            row_exp[c_cat] = f"{e_ij:.2f}"
            row_pct_row[c_cat] = f"{(o_ij / r_sum * 100):.1f}%" if r_sum > 0 else "0.0%"
            row_pct_col[c_cat] = f"{(o_ij / c_sum * 100):.1f}%" if c_sum > 0 else "0.0%"
            row_pct_tot[c_cat] = f"{(o_ij / n_total * 100):.1f}%"

        # Kolom Total
        row_count["Total"] = int(r_sum)
        row_exp["Total"] = f"{float(r_sum):.2f}"
        row_pct_row["Total"] = "100.0%"
        row_pct_col["Total"] = f"{(r_sum / n_total * 100):.1f}%"
        row_pct_tot["Total"] = f"{(r_sum / n_total * 100):.1f}%"

        crosstab_table_rows.extend([row_count, row_exp, row_pct_row, row_pct_col, row_pct_tot])

    # Baris Total Keseluruhan
    tot_count = {"Variabel Baris": "Total", "Statistik": "Frekuensi Observasi"}
    tot_exp = {"Variabel Baris": "Total", "Statistik": "Frekuensi Ekspektasi"}
    tot_pct_row = {"Variabel Baris": "Total", "Statistik": "% dalam Baris"}
    tot_pct_col = {"Variabel Baris": "Total", "Statistik": "% dalam Kolom"}
    tot_pct_tot = {"Variabel Baris": "Total", "Statistik": "% dari Total"}

    for j, c_cat in enumerate(col_categories):
        c_sum = col_sums[j]
        tot_count[c_cat] = int(c_sum)
        tot_exp[c_cat] = f"{float(c_sum):.2f}"
        tot_pct_row[c_cat] = f"{(c_sum / n_total * 100):.1f}%"
        tot_pct_col[c_cat] = "100.0%"
        tot_pct_tot[c_cat] = f"{(c_sum / n_total * 100):.1f}%"

    tot_count["Total"] = int(n_total)
    tot_exp["Total"] = f"{float(n_total):.2f}"
    tot_pct_row["Total"] = "100.0%"
    tot_pct_col["Total"] = "100.0%"
    tot_pct_tot["Total"] = "100.0%"
    crosstab_table_rows.extend([tot_count, tot_exp, tot_pct_row, tot_pct_col, tot_pct_tot])

    tbl_crosstab = {
        "title": f"Tabel Silang: {row_variable} × {column_variable}",
        "rows": crosstab_table_rows,
    }

    # 4. Uji Chi-Square & Koreksi
    chi2_val, p_val, df_val, _ = stats.chi2_contingency(obs_matrix, correction=False)
    chi2_val = float(chi2_val)
    p_val = float(p_val)

    # Likelihood Ratio Chi-Square
    with np.errstate(divide="ignore", invalid="ignore"):
        lr_terms = np.where(obs_matrix > 0, obs_matrix * np.log(obs_matrix / exp_matrix), 0.0)
    lr_stat = float(2.0 * np.sum(lr_terms))
    p_lr = float(1.0 - stats.chi2.cdf(lr_stat, df=df_val))

    chi_test_rows = [
        {
            "Uji": "Pearson Chi-Square",
            "Nilai": sanitize_float(chi2_val),
            "df": df_val,
            "Asymp. Sig. (2-tailed)": format_p_value(p_val),
        },
        {
            "Uji": "Likelihood Ratio",
            "Nilai": sanitize_float(lr_stat),
            "df": df_val,
            "Asymp. Sig. (2-tailed)": format_p_value(p_lr),
        },
    ]

    # Khusus tabel 2x2: Tambahkan Yates' Continuity Correction & Fisher's Exact Test
    fisher_p = None
    if n_rows == 2 and n_cols == 2:
        chi2_yates, p_yates, _, _ = stats.chi2_contingency(obs_matrix, correction=True)
        chi_test_rows.append({
            "Uji": "Continuity Correction (Yates)",
            "Nilai": sanitize_float(float(chi2_yates)),
            "df": 1,
            "Asymp. Sig. (2-tailed)": format_p_value(float(p_yates)),
        })
        # Fisher's Exact Test
        try:
            _, fisher_p = stats.fisher_exact(obs_matrix, alternative="two-sided")
            fisher_p = float(fisher_p)
            chi_test_rows.append({
                "Uji": "Fisher's Exact Test",
                "Nilai": "-",
                "df": "-",
                "Exact Sig. (2-tailed)": format_p_value(fisher_p),
            })
        except Exception:
            pass

    chi_test_rows.append({
        "Uji": "Jumlah Kasus Valid (N)",
        "Nilai": n_total,
        "df": "-",
        "Asymp. Sig. (2-tailed)": "-",
    })

    tbl_chi = {
        "title": "Uji Chi-Square (Chi-Square Tests)",
        "rows": chi_test_rows,
    }

    # 5. Ukuran Asosiasi (Symmetric Measures)
    min_dim = min(n_rows - 1, n_cols - 1)
    phi_val = math.sqrt(chi2_val / n_total) if n_total > 0 else 0.0
    cramer_v = math.sqrt(chi2_val / (n_total * min_dim)) if (n_total * min_dim) > 0 else 0.0
    contingency_coeff = math.sqrt(chi2_val / (chi2_val + n_total)) if (chi2_val + n_total) > 0 else 0.0

    tbl_symmetric = {
        "title": "Ukuran Asosiasi Simetris (Symmetric Measures)",
        "rows": [
            {
                "Ukuran": "Phi (φ)",
                "Nilai": sanitize_float(phi_val),
                "Approx. Sig.": format_p_value(p_val),
            },
            {
                "Ukuran": "Cramér's V",
                "Nilai": sanitize_float(cramer_v),
                "Approx. Sig.": format_p_value(p_val),
            },
            {
                "Ukuran": "Koefisien Kontingensi (C)",
                "Nilai": sanitize_float(contingency_coeff),
                "Approx. Sig.": format_p_value(p_val),
            },
        ],
    }

    # 6. Interpretasi
    sig_text = "hubungan/asosiasi yang signifikan secara statistik" if p_val < 0.05 else "tidak ada hubungan yang signifikan secara statistik"
    decision = "menolak hipotesis independensi (H0)" if p_val < 0.05 else "gagal menolak hipotesis independensi (H0)"

    interp = (
        f"Analisis tabulasi silang dilakukan antara {row_variable} ({n_rows} kategori) "
        f"dan {column_variable} ({n_cols} kategori) dengan total N = {n_total}. "
        f"Uji Pearson Chi-Square menghasilkan χ²({df_val}) = {chi2_val:.2f}, p = {p_val:.4f}, "
        f"yang mengindikasikan adanya {sig_text} antara kedua variabel. "
        f"Kekuatan asosiasi diukur dengan Cramér's V = {cramer_v:.3f} (Koefisien Kontingensi C = {contingency_coeff:.3f}). "
        f"Berdasarkan taraf signifikansi alpha = 0.05, peneliti {decision}. "
    )
    if fisher_p is not None:
        interp += f"Pada tabel 2x2, Uji Fisher's Exact Test menghasilkan p = {fisher_p:.4f}."

    return {
        "title": f"Crosstabs: {row_variable} × {column_variable}",
        "summary": {
            "row_variable": row_variable,
            "column_variable": column_variable,
            "n_total": n_total,
            "chi2": sanitize_float(chi2_val),
            "df": df_val,
            "p_value": sanitize_float(p_val),
            "cramer_v": sanitize_float(cramer_v),
            "cells_below_5": cells_below_5,
            "pct_below_5": sanitize_float(pct_below_5),
        },
        "tables": [tbl_crosstab, tbl_chi, tbl_symmetric],
        "interpretation": interp,
        "warnings": warnings,
    }

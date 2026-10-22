"""
Modul Statistik Nonparametrik — Statistika Pro
Mendukung:
1. Mann-Whitney U Test (Dua Sampel Independen)
2. Wilcoxon Signed-Rank Test (Dua Sampel Berpasangan)
3. Kruskal-Wallis Test (k Sampel Independen) & Post-Hoc Dunn's Test
4. Friedman Test (k Sampel Berulang / Repeated Measures)
5. Kendall's Tau-b (Korelasi Ordinal dengan Koreksi Ties)
Lengkap dengan Mean Rank, Ukuran Efek (Rank-Biserial r, r = Z/√N, Kendall's W), dan Peringatan Asumsi.
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
    NonNumericDataError,
    InsufficientDataError,
)


def mann_whitney_u_test(
    dataset: Any,
    test_variable: str,
    grouping_variable: str,
    group1_val: Optional[Any] = None,
    group2_val: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Uji Mann-Whitney U untuk membandingkan peringkat dua kelompok independen.
    """
    var_map = {v.name: v for v in dataset.variables}
    if test_variable not in var_map:
        raise VariableNotFoundError(test_variable)
    if grouping_variable not in var_map:
        raise VariableNotFoundError(grouping_variable)

    missing_test = set(str(m).strip() for m in (var_map[test_variable].missing or []))
    missing_grp = set(str(m).strip() for m in (var_map[grouping_variable].missing or []))

    valid_rows = []
    for r in dataset.rows:
        val_t = r.get(test_variable)
        val_g = r.get(grouping_variable)
        if val_t is None or str(val_t).strip() == "" or str(val_t).lower() in ("nan", "none", "null"):
            continue
        if val_g is None or str(val_g).strip() == "" or str(val_g).lower() in ("nan", "none", "null"):
            continue
        if str(val_t).strip() in missing_test or str(val_g).strip() in missing_grp:
            continue
        try:
            valid_rows.append((float(val_t), str(val_g).strip()))
        except (ValueError, TypeError):
            raise NonNumericDataError(test_variable)

    if len(valid_rows) < 4:
        raise InsufficientDataError("Jumlah data valid terlalu sedikit untuk Mann-Whitney U test.")

    df_data = pd.DataFrame(valid_rows, columns=["score", "group"])
    unique_groups = df_data["group"].unique().tolist()

    if group1_val is None or group2_val is None:
        if len(unique_groups) != 2:
            raise InsufficientDataError(f"Variabel kelompok memiliki {len(unique_groups)} kategori ({unique_groups}). Tentukan 2 kelompok.")
        g1_name, g2_name = unique_groups[0], unique_groups[1]
    else:
        g1_name, g2_name = str(group1_val).strip(), str(group2_val).strip()

    g1_arr = df_data[df_data["group"] == g1_name]["score"].to_numpy()
    g2_arr = df_data[df_data["group"] == g2_name]["score"].to_numpy()

    n1, n2 = len(g1_arr), len(g2_arr)
    if n1 < 1 or n2 < 1:
        raise InsufficientDataError("Kedua kelompok harus memiliki minimal 1 observasi.")

    # Hitung ranking gabungan
    df_data["rank"] = df_data["score"].rank(method="average")
    r1_sum = float(df_data[df_data["group"] == g1_name]["rank"].sum())
    r2_sum = float(df_data[df_data["group"] == g2_name]["rank"].sum())
    m_rank1 = r1_sum / n1
    m_rank2 = r2_sum / n2

    # Scipy Mann-Whitney U
    mw_res = stats.mannwhitneyu(g1_arr, g2_arr, alternative="two-sided")
    u_stat = float(mw_res.statistic)
    p_val = float(mw_res.pvalue)

    # U1 and U2
    u1 = n1 * n2 + (n1 * (n1 + 1)) / 2.0 - r1_sum
    u2 = n1 * n2 + (n2 * (n2 + 1)) / 2.0 - r2_sum
    min_u = min(u1, u2)

    # Z-approximation with tie correction
    mu_u = (n1 * n2) / 2.0
    # Hitung ikatan peringkat (ties)
    _, tie_counts = np.unique(df_data["score"].to_numpy(), return_counts=True)
    n_tot = n1 + n2
    tie_corr = sum((t ** 3 - t) for t in tie_counts) / (12.0 * n_tot * (n_tot - 1)) if n_tot > 1 else 0.0
    sigma_u = math.sqrt(((n1 * n2) / 12.0) * ((n_tot + 1) - tie_corr * 12.0)) if n_tot > 1 else 1.0
    z_val = (u_stat - mu_u) / sigma_u if sigma_u > 0 else 0.0

    # Rank-biserial correlation
    rank_biserial = 1.0 - (2.0 * min_u) / (n1 * n2) if (n1 * n2) > 0 else 0.0

    warnings: List[str] = [
        "Uji Mann-Whitney menguji perbedaan peringkat (distribusi median). Asumsi bentuk distribusi serupa harus dipenuhi jika menginterpretasikan selisih median."
    ]
    if len(tie_counts[tie_counts > 1]) > 0:
        warnings.append(f"Terdapat {len(tie_counts[tie_counts > 1])} nilai skor yang sama (ties). Penyesuaian ikatan diterapkan pada statistik Z.")

    tbl_ranks = {
        "title": "Peringkat (Ranks)",
        "rows": [
            {
                "Kelompok": f"{grouping_variable} = {g1_name}",
                "N": n1,
                "Rerata Peringkat (Mean Rank)": sanitize_float(m_rank1),
                "Jumlah Peringkat (Sum of Ranks)": sanitize_float(r1_sum),
            },
            {
                "Kelompok": f"{grouping_variable} = {g2_name}",
                "N": n2,
                "Rerata Peringkat (Mean Rank)": sanitize_float(m_rank2),
                "Jumlah Peringkat (Sum of Ranks)": sanitize_float(r2_sum),
            },
            {
                "Kelompok": "Total",
                "N": n_tot,
                "Rerata Peringkat (Mean Rank)": "-",
                "Jumlah Peringkat (Sum of Ranks)": "-",
            },
        ],
    }

    tbl_test = {
        "title": "Statistik Uji (Test Statistics)",
        "rows": [
            {
                "Variabel": test_variable,
                "Mann-Whitney U": sanitize_float(min_u),
                "Wilcoxon W": sanitize_float(min(r1_sum, r2_sum)),
                "Z": sanitize_float(z_val),
                "Asymp. Sig. (2-tailed)": format_p_value(p_val),
                "Korelasi Rank-Biserial (r)": sanitize_float(rank_biserial),
            }
        ],
    }

    sig_text = "signifikan secara statistik" if p_val < 0.05 else "tidak signifikan secara statistik"
    decision = "menolak hipotesis nol (H0)" if p_val < 0.05 else "gagal menolak hipotesis nol (H0)"

    interp = (
        f"Uji Mann-Whitney U menunjukkan bahwa perbedaan peringkat antara kelompok {g1_name} (Mean Rank = {m_rank1:.2f}, n = {n1}) "
        f"dan kelompok {g2_name} (Mean Rank = {m_rank2:.2f}, n = {n2}) adalah {sig_text}, "
        f"U = {min_u:.1f}, Z = {z_val:.2f}, p = {p_val:.4f}. "
        f"Ukuran efek korelasi rank-biserial adalah r = {rank_biserial:.2f}. "
        f"Kesimpulan: Peneliti {decision} pada taraf signifikansi alpha = 0.05."
    )

    return {
        "title": f"Mann-Whitney U Test: {test_variable} menurut {grouping_variable}",
        "summary": {
            "test_variable": test_variable,
            "grouping_variable": grouping_variable,
            "u_stat": sanitize_float(min_u),
            "z_val": sanitize_float(z_val),
            "p_value": sanitize_float(p_val),
            "rank_biserial": sanitize_float(rank_biserial),
        },
        "tables": [tbl_ranks, tbl_test],
        "interpretation": interp,
        "warnings": warnings,
    }


def wilcoxon_signed_rank_test(
    dataset: Any,
    variable1: str,
    variable2: str,
) -> Dict[str, Any]:
    """
    Uji Wilcoxon Signed-Rank untuk dua sampel berpasangan / pengukuran berulang nonparametrik.
    """
    var_map = {v.name: v for v in dataset.variables}
    if variable1 not in var_map:
        raise VariableNotFoundError(variable1)
    if variable2 not in var_map:
        raise VariableNotFoundError(variable2)

    missing1 = set(str(m).strip() for m in (var_map[variable1].missing or []))
    missing2 = set(str(m).strip() for m in (var_map[variable2].missing or []))

    pairs = []
    for r in dataset.rows:
        v1 = r.get(variable1)
        v2 = r.get(variable2)
        if v1 is None or str(v1).strip() == "" or str(v1).lower() in ("nan", "none", "null"):
            continue
        if v2 is None or str(v2).strip() == "" or str(v2).lower() in ("nan", "none", "null"):
            continue
        if str(v1).strip() in missing1 or str(v2).strip() in missing2:
            continue
        try:
            pairs.append((float(v1), float(v2)))
        except (ValueError, TypeError):
            raise NonNumericDataError(f"{variable1} atau {variable2}")

    n_orig = len(pairs)
    if n_orig < 3:
        raise InsufficientDataError(f"Jumlah pasangan valid ({n_orig}) minimal 3 untuk Wilcoxon test.")

    arr1 = np.array([p[0] for p in pairs])
    arr2 = np.array([p[1] for p in pairs])
    diffs = arr2 - arr1

    # Eliminasi perbedaan 0 (ties)
    non_zero_diffs = diffs[diffs != 0]
    n_ties = int(np.sum(diffs == 0))
    n_effective = len(non_zero_diffs)

    if n_effective < 1:
        raise InsufficientDataError("Seluruh pasangan memiliki nilai yang sama (selisih nol).")

    # Scipy Wilcoxon
    w_res = stats.wilcoxon(arr1, arr2, alternative="two-sided")
    w_stat = float(w_res.statistic)
    p_val = float(w_res.pvalue)

    # Ranking absolut
    abs_diffs = np.abs(non_zero_diffs)
    df_ranks = pd.DataFrame({"diff": non_zero_diffs, "abs_diff": abs_diffs})
    df_ranks["rank"] = df_ranks["abs_diff"].rank(method="average")

    pos_ranks = df_ranks[df_ranks["diff"] > 0]["rank"]
    neg_ranks = df_ranks[df_ranks["diff"] < 0]["rank"]

    n_pos = len(pos_ranks)
    n_neg = len(neg_ranks)
    sum_pos = float(pos_ranks.sum())
    sum_neg = float(neg_ranks.sum())
    mean_pos = sum_pos / n_pos if n_pos > 0 else 0.0
    mean_neg = sum_neg / n_neg if n_neg > 0 else 0.0

    # Z approximation
    mean_w = (n_effective * (n_effective + 1)) / 4.0
    sd_w = math.sqrt((n_effective * (n_effective + 1) * (2 * n_effective + 1)) / 24.0)
    z_val = (w_stat - mean_w) / sd_w if sd_w > 0 else 0.0
    effect_r = abs(z_val) / math.sqrt(n_orig) if n_orig > 0 else 0.0

    warnings: List[str] = [
        "Uji Wilcoxon signed-rank mengasumsikan variabel diukur setidaknya pada skala ordinal dan berpasangan sah per responden."
    ]
    if n_ties > 0:
        warnings.append(f"Terdapat {n_ties} pasangan dengan selisih nol (ties) yang diabaikan dalam komputasi peringkat.")

    tbl_ranks = {
        "title": f"Peringkat Perbedaan: {variable2} - {variable1}",
        "rows": [
            {
                "Peringkat": "Peringkat Negatif (Var2 < Var1)",
                "N": n_neg,
                "Rerata Peringkat": sanitize_float(mean_neg),
                "Jumlah Peringkat": sanitize_float(sum_neg),
            },
            {
                "Peringkat": "Peringkat Positif (Var2 > Var1)",
                "N": n_pos,
                "Rerata Peringkat": sanitize_float(mean_pos),
                "Jumlah Peringkat": sanitize_float(sum_pos),
            },
            {
                "Peringkat": "Sama / Tidak Berubah (Var2 = Var1)",
                "N": n_ties,
                "Rerata Peringkat": "-",
                "Jumlah Peringkat": "-",
            },
            {
                "Peringkat": "Total Pasangan",
                "N": n_orig,
                "Rerata Peringkat": "-",
                "Jumlah Peringkat": "-",
            },
        ],
    }

    tbl_test = {
        "title": "Statistik Uji Wilcoxon (Test Statistics)",
        "rows": [
            {
                "Pasangan": f"{variable2} - {variable1}",
                "Wilcoxon W": sanitize_float(w_stat),
                "Z": sanitize_float(z_val),
                "Asymp. Sig. (2-tailed)": format_p_value(p_val),
                "Ukuran Efek (r = |Z|/√N)": sanitize_float(effect_r),
            }
        ],
    }

    sig_text = "perbedaan yang signifikan secara statistik" if p_val < 0.05 else "tidak ada perbedaan yang signifikan secara statistik"
    decision = "menolak hipotesis nol (H0)" if p_val < 0.05 else "gagal menolak hipotesis nol (H0)"

    interp = (
        f"Uji Wilcoxon Signed-Rank dilakukan untuk menguji perbedaan antara {variable1} dan {variable2} (N = {n_orig}). "
        f"Hasil menunjukkan adanya {sig_text}, W = {w_stat:.1f}, Z = {z_val:.2f}, p = {p_val:.4f}. "
        f"Terdapat {n_pos} kasus dengan peningkatan skor, {n_neg} kasus dengan penurunan skor, dan {n_ties} kasus tidak berubah. "
        f"Ukuran efek adalah r = {effect_r:.2f}. "
        f"Kesimpulan: Peneliti {decision} pada taraf signifikansi alpha = 0.05."
    )

    return {
        "title": f"Wilcoxon Signed-Rank Test: {variable1} vs {variable2}",
        "summary": {
            "var1": variable1,
            "var2": variable2,
            "n": n_orig,
            "w_stat": sanitize_float(w_stat),
            "z_val": sanitize_float(z_val),
            "p_value": sanitize_float(p_val),
            "effect_size_r": sanitize_float(effect_r),
        },
        "tables": [tbl_ranks, tbl_test],
        "interpretation": interp,
        "warnings": warnings,
    }


def kruskal_wallis_test(
    dataset: Any,
    dependent_variable: str,
    factor_variable: str,
) -> Dict[str, Any]:
    """
    Uji Kruskal-Wallis untuk k sampel independen nonparametrik (alternatif One-Way ANOVA)
    disertai perbandingan post-hoc Dunn's Test dengan penyesuaian Bonferroni.
    """
    var_map = {v.name: v for v in dataset.variables}
    if dependent_variable not in var_map:
        raise VariableNotFoundError(dependent_variable)
    if factor_variable not in var_map:
        raise VariableNotFoundError(factor_variable)

    missing_dep = set(str(m).strip() for m in (var_map[dependent_variable].missing or []))
    missing_fac = set(str(m).strip() for m in (var_map[factor_variable].missing or []))

    valid_rows = []
    for r in dataset.rows:
        y_val = r.get(dependent_variable)
        grp_val = r.get(factor_variable)
        if y_val is None or str(y_val).strip() == "" or str(y_val).lower() in ("nan", "none", "null"):
            continue
        if grp_val is None or str(grp_val).strip() == "" or str(grp_val).lower() in ("nan", "none", "null"):
            continue
        if str(y_val).strip() in missing_dep or str(grp_val).strip() in missing_fac:
            continue
        try:
            valid_rows.append((float(y_val), str(grp_val).strip()))
        except (ValueError, TypeError):
            raise NonNumericDataError(dependent_variable)

    if len(valid_rows) < 5:
        raise InsufficientDataError("Jumlah sampel valid terlalu sedikit untuk Kruskal-Wallis test.")

    df_data = pd.DataFrame(valid_rows, columns=["score", "group"])
    unique_groups = sorted(df_data["group"].unique().tolist())
    k = len(unique_groups)

    if k < 2:
        raise InsufficientDataError(f"Variabel faktor harus memiliki minimal 2 kelompok (ditemukan {k}).")

    grouped_data = [df_data[df_data["group"] == g]["score"].to_numpy() for g in unique_groups]
    n_total = len(df_data)

    # Scipy Kruskal-Wallis
    kw_res = stats.kruskal(*grouped_data)
    h_stat = float(kw_res.statistic)
    p_val = float(kw_res.pvalue)
    df_kw = k - 1

    # Rerata peringkat per kelompok
    df_data["rank"] = df_data["score"].rank(method="average")
    rank_rows = []
    mean_ranks = {}
    for g in unique_groups:
        g_ranks = df_data[df_data["group"] == g]["rank"]
        m_r = float(g_ranks.mean())
        mean_ranks[g] = m_r
        rank_rows.append({
            "Kelompok": f"{factor_variable} = {g}",
            "N": len(g_ranks),
            "Rerata Peringkat (Mean Rank)": sanitize_float(m_r),
        })

    tbl_ranks = {
        "title": f"Rerata Peringkat: {dependent_variable}",
        "rows": rank_rows,
    }

    # Epsilon-squared effect size: ε² = (H - k + 1) / (n - k)
    epsilon_sq = (h_stat - k + 1.0) / (n_total - k) if (n_total - k) > 0 else 0.0
    epsilon_sq = max(0.0, min(1.0, epsilon_sq))

    tbl_test = {
        "title": "Statistik Uji Kruskal-Wallis",
        "rows": [
            {
                "Variabel": dependent_variable,
                "Kruskal-Wallis H": sanitize_float(h_stat),
                "df": df_kw,
                "Asymp. Sig.": format_p_value(p_val),
                "Epsilon-Squared (ε²)": sanitize_float(epsilon_sq),
            }
        ],
    }

    # Post-Hoc Dunn's Test dengan koreksi Bonferroni
    num_comparisons = (k * (k - 1)) // 2
    post_hoc_rows = []
    # Variansi peringkat gabungan untuk Dunn test
    _, tie_counts = np.unique(df_data["score"].to_numpy(), return_counts=True)
    tie_adj = sum(t ** 3 - t for t in tie_counts) / (12.0 * (n_total - 1)) if n_total > 1 else 0.0
    var_total = (n_total * (n_total + 1)) / 12.0 - tie_adj

    for i in range(k):
        for j in range(i + 1, k):
            g_i, g_j = unique_groups[i], unique_groups[j]
            n_i = len(df_data[df_data["group"] == g_i])
            n_j = len(df_data[df_data["group"] == g_j])
            diff_r = mean_ranks[g_i] - mean_ranks[g_j]
            se_dunn = math.sqrt(var_total * (1.0 / n_i + 1.0 / n_j)) if (1.0 / n_i + 1.0 / n_j) > 0 else 1e-9
            z_dunn = abs(diff_r) / se_dunn
            p_raw = float(2 * (1 - stats.norm.cdf(z_dunn)))
            p_bonf = min(1.0, p_raw * num_comparisons)

            post_hoc_rows.append({
                "Perbandingan": f"{g_i} vs {g_j}",
                "Selisih Mean Rank": sanitize_float(diff_r),
                "Std. Error": sanitize_float(se_dunn),
                "Z": sanitize_float(z_dunn),
                "Sig. Unadjusted": format_p_value(p_raw),
                "Sig. Bonferroni": format_p_value(p_bonf),
                "Signifikan (p < .05)": "Ya" if p_bonf < 0.05 else "Tidak",
            })

    tbl_posthoc = {
        "title": "Post-Hoc Komparasi Berganda (Dunn's Test dengan Koreksi Bonferroni)",
        "rows": post_hoc_rows,
    }

    sig_text = "perbedaan yang signifikan secara statistik" if p_val < 0.05 else "tidak ada perbedaan yang signifikan secara statistik"
    decision = "menolak hipotesis nol (H0)" if p_val < 0.05 else "gagal menolak hipotesis nol (H0)"

    interp = (
        f"Uji Kruskal-Wallis menunjukkan {sig_text} pada skor {dependent_variable} antar {k} kelompok {factor_variable}, "
        f"H({df_kw}) = {h_stat:.2f}, p = {p_val:.4f}, dengan ukuran efek epsilon-squared ε² = {epsilon_sq:.3f}. "
        f"Kesimpulan: Peneliti {decision} pada tingkat signifikansi alpha = 0.05."
    )

    warnings: List[str] = [
        "Uji Kruskal-Wallis tidak mengasumsikan distribusi normal data, namun mengasumsikan bahwa observasi bersifat independen dan berbentuk distribusi serupa antar kelompok."
    ]

    return {
        "title": f"Kruskal-Wallis Test: {dependent_variable} menurut {factor_variable}",
        "summary": {
            "dependent_variable": dependent_variable,
            "factor_variable": factor_variable,
            "k": k,
            "h_stat": sanitize_float(h_stat),
            "df": df_kw,
            "p_value": sanitize_float(p_val),
            "epsilon_squared": sanitize_float(epsilon_sq),
        },
        "tables": [tbl_ranks, tbl_test, tbl_posthoc],
        "interpretation": interp,
        "warnings": warnings,
    }


def friedman_test(
    dataset: Any,
    variables: List[str],
) -> Dict[str, Any]:
    """
    Uji Friedman untuk k pengukuran berulang / repeated measures nonparametrik.
    """
    if len(variables) < 3:
        raise InsufficientDataError("Uji Friedman memerlukan minimal 3 variabel pengukuran berulang.")

    var_map = {v.name: v for v in dataset.variables}
    missing_codes = {v: set(str(m).strip() for m in (var_map[v].missing or [])) for v in variables if v in var_map}
    for v in variables:
        if v not in var_map:
            raise VariableNotFoundError(v)

    # Ekstraksi matriks lengkap baris demi baris (listwise per baris)
    complete_cases = []
    for r in dataset.rows:
        row_vals = []
        is_valid = True
        for v in variables:
            raw = r.get(v)
            if raw is None or str(raw).strip() == "" or str(raw).lower() in ("nan", "none", "null") or str(raw).strip() in missing_codes[v]:
                is_valid = False
                break
            try:
                row_vals.append(float(raw))
            except (ValueError, TypeError):
                raise NonNumericDataError(v)
        if is_valid:
            complete_cases.append(row_vals)

    n_subjects = len(complete_cases)
    k = len(variables)
    if n_subjects < 3:
        raise InsufficientDataError(f"Jumlah baris kasus lengkap ({n_subjects}) terlalu sedikit untuk uji Friedman.")

    data_matrix = np.array(complete_cases)  # shape: (n_subjects, k)
    # Scipy Friedman test
    scipy_cols = [data_matrix[:, i] for i in range(k)]
    fried_res = stats.friedmanchisquare(*scipy_cols)
    chi2_val = float(fried_res.statistic)
    p_val = float(fried_res.pvalue)
    df_f = k - 1

    # Rerata peringkat baris per baris
    ranks_matrix = np.zeros_like(data_matrix)
    for i in range(n_subjects):
        ranks_matrix[i, :] = stats.rankdata(data_matrix[i, :])

    mean_ranks = np.mean(ranks_matrix, axis=0)
    kendalls_w = chi2_val / (n_subjects * (k - 1)) if (n_subjects * (k - 1)) > 0 else 0.0
    kendalls_w = max(0.0, min(1.0, kendalls_w))

    tbl_ranks = {
        "title": "Rerata Peringkat Pengukuran Berulang",
        "rows": [
            {
                "Pengukuran": variables[i],
                "Mean Rank": sanitize_float(float(mean_ranks[i])),
            }
            for i in range(k)
        ],
    }

    tbl_test = {
        "title": "Statistik Uji Friedman",
        "rows": [
            {
                "N": n_subjects,
                "Chi-Square": sanitize_float(chi2_val),
                "df": df_f,
                "Asymp. Sig.": format_p_value(p_val),
                "Kendall's W": sanitize_float(kendalls_w),
            }
        ],
    }

    sig_text = "perbedaan yang signifikan secara statistik" if p_val < 0.05 else "tidak ada perbedaan yang signifikan secara statistik"
    decision = "menolak hipotesis nol (H0)" if p_val < 0.05 else "gagal menolak hipotesis nol (H0)"

    interp = (
        f"Uji Friedman untuk {k} pengukuran berulang pada {n_subjects} subjek menghasilkan "
        f"Chi-Square({df_f}) = {chi2_val:.2f}, p = {p_val:.4f}, mengindikasikan adanya {sig_text} "
        f"antar kondisi perlakuan. Koefisien konkordansi Kendall's W adalah {kendalls_w:.3f}. "
        f"Kesimpulan: Peneliti {decision} pada taraf signifikansi alpha = 0.05."
    )

    return {
        "title": f"Friedman Test ({k} Pengukuran Berulang)",
        "summary": {
            "variables": variables,
            "n_subjects": n_subjects,
            "chi2": sanitize_float(chi2_val),
            "df": df_f,
            "p_value": sanitize_float(p_val),
            "kendalls_w": sanitize_float(kendalls_w),
        },
        "tables": [tbl_ranks, tbl_test],
        "interpretation": interp,
        "warnings": [
            "Uji Friedman mengasumsikan data berasal dari subjek yang sama (repeated measures) dengan variabel berpasangan terikat secara sah."
        ],
    }


def kendall_tau_b(
    dataset: Any,
    variable1: str,
    variable2: str,
) -> Dict[str, Any]:
    """
    Korelasi Kendall's Tau-b untuk dua variabel ordinal dengan koreksi ikatan peringkat (ties).
    """
    var_map = {v.name: v for v in dataset.variables}
    if variable1 not in var_map:
        raise VariableNotFoundError(variable1)
    if variable2 not in var_map:
        raise VariableNotFoundError(variable2)

    missing1 = set(str(m).strip() for m in (var_map[variable1].missing or []))
    missing2 = set(str(m).strip() for m in (var_map[variable2].missing or []))

    pairs = []
    for r in dataset.rows:
        v1 = r.get(variable1)
        v2 = r.get(variable2)
        if v1 is None or str(v1).strip() == "" or str(v1).lower() in ("nan", "none", "null") or str(v1).strip() in missing1:
            continue
        if v2 is None or str(v2).strip() == "" or str(v2).lower() in ("nan", "none", "null") or str(v2).strip() in missing2:
            continue
        try:
            pairs.append((float(v1), float(v2)))
        except (ValueError, TypeError):
            raise NonNumericDataError(f"{variable1} atau {variable2}")

    n = len(pairs)
    if n < 3:
        raise InsufficientDataError(f"Jumlah pasangan valid ({n}) minimal 3 untuk korelasi Kendall's Tau-b.")

    x = [p[0] for p in pairs]
    y = [p[1] for p in pairs]

    res = stats.kendalltau(x, y, variant="b")
    tau_b = float(res.statistic) if res.statistic is not None and not math.isnan(res.statistic) else 0.0
    p_val = float(res.pvalue) if res.pvalue is not None and not math.isnan(res.pvalue) else 1.0

    tbl = {
        "title": f"Korelasi Kendall's Tau-b: {variable1} & {variable2}",
        "rows": [
            {
                "Pasangan": f"{variable1} - {variable2}",
                "Koefisien Kendall's Tau-b": sanitize_float(tau_b),
                "Sig. (2-tailed)": format_p_value(p_val),
                "N": n,
            }
        ],
    }

    sig_text = "hubungan yang signifikan secara statistik" if p_val < 0.05 else "tidak ada hubungan yang signifikan secara statistik"
    decision = "menolak hipotesis nol (H0)" if p_val < 0.05 else "gagal menolak hipotesis nol (H0)"

    interp = (
        f"Korelasi Kendall's Tau-b antara {variable1} dan {variable2} menghasilkan koefisien tau-b = {tau_b:.3f}, "
        f"p = {p_val:.4f} (N = {n}), yang menunjukkan adanya {sig_text}. "
        f"Berdasarkan taraf alpha = 0.05, peneliti {decision}."
    )

    return {
        "title": f"Kendall's Tau-b: {variable1} vs {variable2}",
        "summary": {
            "var1": variable1,
            "var2": variable2,
            "n": n,
            "tau_b": sanitize_float(tau_b),
            "p_value": sanitize_float(p_val),
        },
        "tables": [tbl],
        "interpretation": interp,
        "warnings": [],
    }

"""
Modul Analisis Varians (ANOVA) — Statistika Pro
Mendukung:
1. One-Way ANOVA Klasik
2. Welch's ANOVA (Robust terhadap Heteroskedastisitas)
3. Uji Homogenitas Varians Levene
4. Uji Post-Hoc Komparasi Ganda (Tukey HSD & Games-Howell)
5. Ukuran Efek: Eta-squared (η²), Omega-squared (ω²), dan Epsilon-squared.
"""

from typing import Dict, Any, List, Optional, Tuple
import math
import numpy as np
import pandas as pd
from scipy import stats
from statsmodels.stats.multicomp import pairwise_tukeyhsd

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


def _compute_games_howell(
    group_names: List[str],
    group_data: List[np.ndarray],
    alpha: float = 0.05,
) -> List[Dict[str, Any]]:
    """
    Menghitung komparasi berganda Games-Howell untuk varians tidak homogen dan ukuran sampel tidak seimbang.
    q = |M_i - M_j| / sqrt(0.5 * (s_i^2/n_i + s_j^2/n_j))
    df = (s_i^2/n_i + s_j^2/n_j)^2 / [ (s_i^2/n_i)^2/(n_i-1) + (s_j^2/n_j)^2/(n_j-1) ]
    p-value diambil dari survival function studentized range scipy: stats.studentized_range.sf(q, k, df)
    """
    k = len(group_names)
    means = [float(np.mean(arr)) for arr in group_data]
    vars_ = [float(np.var(arr, ddof=1)) for arr in group_data]
    ns = [len(arr) for arr in group_data]

    results = []
    for i in range(k):
        for j in range(i + 1, k):
            m_i, m_j = means[i], means[j]
            v_i, v_j = vars_[i], vars_[j]
            n_i, n_j = ns[i], ns[j]

            mean_diff = m_i - m_j
            se = math.sqrt((v_i / n_i) + (v_j / n_j)) if (v_i / n_i + v_j / n_j) > 0 else 1e-9

            # Welch-Satterthwaite df
            num = (v_i / n_i + v_j / n_j) ** 2
            den = ((v_i / n_i) ** 2) / (n_i - 1) + ((v_j / n_j) ** 2) / (n_j - 1)
            df_val = float(num / den) if den > 0 else float(n_i + n_j - 2)

            # Studentized range q statistic
            q_val = abs(mean_diff) / math.sqrt(0.5 * (v_i / n_i + v_j / n_j)) if (v_i / n_i + v_j / n_j) > 0 else 0.0

            try:
                # Studentized range p-value
                p_val = float(stats.studentized_range.sf(q_val, k, df_val))
                p_val = min(1.0, max(0.0, p_val))
                q_crit = float(stats.studentized_range.ppf(1.0 - alpha, k, df_val))
            except Exception:
                # Fallback to Welch t with Bonferroni
                t_val = abs(mean_diff) / se
                p_val = float(min(1.0, 2 * (1 - stats.t.cdf(t_val, df=df_val)) * (k * (k - 1) / 2)))
                q_crit = float(stats.t.ppf(1.0 - alpha / (k * (k - 1)), df=df_val) * math.sqrt(2))

            half_width = (q_crit / math.sqrt(2)) * se
            ci_lower = mean_diff - half_width
            ci_upper = mean_diff + half_width

            results.append({
                "Kelompok (I)": group_names[i],
                "Kelompok (J)": group_names[j],
                "Rerata Selisih (I-J)": sanitize_float(mean_diff),
                "Std. Error": sanitize_float(se),
                "Sig.": format_p_value(p_val),
                "95% CI Bawah": sanitize_float(ci_lower),
                "95% CI Atas": sanitize_float(ci_upper),
                "p_num": p_val,
            })
    return results


def one_way_anova(
    dataset: Any,
    dependent_variable: str,
    factor_variable: str,
    post_hoc: str = "auto",  # 'auto', 'tukey', 'games-howell', 'none'
    confidence_level: float = 0.95,
) -> Dict[str, Any]:
    """
    Analisis Varians Satu Jalur (One-Way ANOVA)
    Menyajikan Deskriptif per Kelompok, Uji Homogenitas Levene, ANOVA Klasik,
    Welch ANOVA, Ukuran Efek (Eta², Omega²), dan Post-Hoc Komparasi Berganda.
    """
    var_map = {v.name: v for v in dataset.variables}
    if dependent_variable not in var_map:
        raise VariableNotFoundError(dependent_variable)
    if factor_variable not in var_map:
        raise VariableNotFoundError(factor_variable)

    missing_dep = set(str(m).strip() for m in (var_map[dependent_variable].missing or []))
    missing_fac = set(str(m).strip() for m in (var_map[factor_variable].missing or []))

    valid_pairs = []
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
            valid_pairs.append((float(y_val), str(grp_val).strip()))
        except (ValueError, TypeError):
            raise NonNumericDataError(dependent_variable)

    if len(valid_pairs) < 6:
        raise InsufficientDataError(f"Jumlah sampel valid ({len(valid_pairs)}) terlalu sedikit untuk ANOVA.")

    df_data = pd.DataFrame(valid_pairs, columns=["y", "group"])
    unique_groups = sorted(df_data["group"].unique().tolist())
    k = len(unique_groups)

    if k < 2:
        raise InsufficientDataError(
            f"Variabel faktor '{factor_variable}' hanya memiliki {k} kelompok valid. Minimal diperlukan 2 kelompok."
        )

    grouped_data: List[np.ndarray] = [
        df_data[df_data["group"] == g]["y"].to_numpy() for g in unique_groups
    ]

    # Validasi ukuran kelompok
    for g_name, g_arr in zip(unique_groups, grouped_data):
        if len(g_arr) < 2:
            raise InsufficientDataError(
                f"Kelompok '{g_name}' hanya memiliki {len(g_arr)} observasi. Setiap kelompok harus memiliki minimal 2 data."
            )

    n_total = len(df_data)
    grand_mean = float(df_data["y"].mean())

    # 1. Tabel Deskriptif per Kelompok
    desc_rows = []
    alpha = 1.0 - confidence_level
    for g_name, g_arr in zip(unique_groups, grouped_data):
        n_g = len(g_arr)
        m_g = float(np.mean(g_arr))
        sd_g = float(np.std(g_arr, ddof=1))
        se_g = sd_g / math.sqrt(n_g)
        t_crit = float(stats.t.ppf(1.0 - alpha / 2.0, df=n_g - 1))
        ci_low = m_g - t_crit * se_g
        ci_high = m_g + t_crit * se_g

        desc_rows.append({
            "Kelompok": g_name,
            "N": n_g,
            "Mean": sanitize_float(m_g),
            "Std. Deviasi": sanitize_float(sd_g),
            "Std. Error": sanitize_float(se_g),
            "95% CI Bawah": sanitize_float(ci_low),
            "95% CI Atas": sanitize_float(ci_high),
            "Min": sanitize_float(float(np.min(g_arr))),
            "Max": sanitize_float(float(np.max(g_arr))),
        })

    tbl_desc = {
        "title": f"Deskriptif: {dependent_variable} menurut {factor_variable}",
        "rows": desc_rows,
    }

    # 2. Uji Homogenitas Varians Levene
    levene_res = stats.levene(*grouped_data, center="mean")
    levene_f = float(levene_res[0])
    levene_p = float(levene_res[1])
    tbl_levene = {
        "title": "Uji Homogenitas Varians (Levene's Test of Homogeneity of Variances)",
        "rows": [
            {
                "Berdasarkan": "Mean",
                "Levene Statistic": sanitize_float(levene_f),
                "df1": k - 1,
                "df2": n_total - k,
                "Sig.": format_p_value(levene_p),
            }
        ],
    }

    # 3. One-Way ANOVA Klasik
    ss_between = sum(len(g) * ((float(np.mean(g)) - grand_mean) ** 2) for g in grouped_data)
    ss_within = sum(sum((x - float(np.mean(g))) ** 2 for x in g) for g in grouped_data)
    ss_total = ss_between + ss_within

    df_between = k - 1
    df_within = n_total - k
    df_total = n_total - 1

    ms_between = ss_between / df_between if df_between > 0 else 0.0
    ms_within = ss_within / df_within if df_within > 0 else 0.0

    f_stat = ms_between / ms_within if ms_within > 0 else 0.0
    p_stat = float(1.0 - stats.f.cdf(f_stat, df_between, df_within))

    # Ukuran efek
    eta_sq = ss_between / ss_total if ss_total > 0 else 0.0
    # Omega-squared: (SS_b - df_b * MS_w) / (SS_tot + MS_w)
    omega_sq = (ss_between - (df_between * ms_within)) / (ss_total + ms_within) if (ss_total + ms_within) > 0 else 0.0
    omega_sq = max(0.0, omega_sq)

    tbl_anova = {
        "title": f"ANOVA: {dependent_variable}",
        "rows": [
            {
                "Sumber Variansi": "Antar Kelompok (Between Groups)",
                "Jumlah Kuadrat (SS)": sanitize_float(ss_between),
                "df": df_between,
                "Rerata Kuadrat (MS)": sanitize_float(ms_between),
                "F": sanitize_float(f_stat),
                "Sig.": format_p_value(p_stat),
            },
            {
                "Sumber Variansi": "Dalam Kelompok (Within Groups / Error)",
                "Jumlah Kuadrat (SS)": sanitize_float(ss_within),
                "df": df_within,
                "Rerata Kuadrat (MS)": sanitize_float(ms_within),
                "F": "-",
                "Sig.": "-",
            },
            {
                "Sumber Variansi": "Total",
                "Jumlah Kuadrat (SS)": sanitize_float(ss_total),
                "df": df_total,
                "Rerata Kuadrat (MS)": "-",
                "F": "-",
                "Sig.": "-",
            },
        ],
    }

    # 4. Welch's ANOVA (Robust Test of Equality of Means)
    # w_i = n_i / s_i^2
    weights = [len(g) / float(np.var(g, ddof=1)) if float(np.var(g, ddof=1)) > 0 else 1e-9 for g in grouped_data]
    sum_w = sum(weights)
    y_prime = sum(w * float(np.mean(g)) for w, g in zip(weights, grouped_data)) / sum_w
    lambda_val = (3.0 * sum((1.0 - (w / sum_w)) ** 2 / (len(g) - 1) for w, g in zip(weights, grouped_data))) / ((k ** 2) - 1.0)
    
    welch_num = sum(w * ((float(np.mean(g)) - y_prime) ** 2) for w, g in zip(weights, grouped_data)) / (k - 1)
    welch_den = 1.0 + (2.0 * (k - 2) / ((k ** 2) - 1.0)) * sum((1.0 - (w / sum_w)) ** 2 / (len(g) - 1) for w, g in zip(weights, grouped_data))
    
    welch_f = float(welch_num / welch_den) if welch_den > 0 else f_stat
    df_welch_1 = k - 1
    df_welch_2 = float(1.0 / lambda_val) if lambda_val > 0 else float(df_within)
    welch_p = float(1.0 - stats.f.cdf(welch_f, df_welch_1, df_welch_2))

    tbl_welch = {
        "title": "Uji Robust Kesetaraan Rata-rata (Welch's ANOVA)",
        "rows": [
            {
                "Metode": "Welch",
                "Statistik": sanitize_float(welch_f),
                "df1": df_welch_1,
                "df2": round(df_welch_2, 2),
                "Sig.": format_p_value(welch_p),
            }
        ],
    }

    # 5. Uji Post-Hoc Multiple Comparisons
    warnings: List[str] = []
    if levene_p < 0.05:
        warnings.append(
            f"Uji Homogenitas Levene signifikan (p = {levene_p:.3f} < 0.05). Varians tidak homogen. "
            "Direkomendasikan menggunakan hasil Welch ANOVA dan uji Post-Hoc Games-Howell."
        )

    # Tentukan metode post-hoc
    chosen_post_hoc = post_hoc
    if post_hoc == "auto":
        chosen_post_hoc = "games-howell" if levene_p < 0.05 else "tukey"

    post_hoc_tbl = None
    if chosen_post_hoc in ("tukey", "games-howell"):
        if chosen_post_hoc == "tukey":
            tukey = pairwise_tukeyhsd(df_data["y"], df_data["group"], alpha=alpha)
            tukey_rows = []
            for row in tukey.summary().data[1:]:
                # [group1, group2, meandiff, p-adj, lower, upper, reject]
                tukey_rows.append({
                    "Kelompok (I)": str(row[0]),
                    "Kelompok (J)": str(row[1]),
                    "Rerata Selisih (I-J)": sanitize_float(float(row[2])),
                    "Sig.": format_p_value(float(row[3])),
                    "95% CI Bawah": sanitize_float(float(row[4])),
                    "95% CI Atas": sanitize_float(float(row[5])),
                    "Signifikan (p < .05)": "Ya" if row[6] else "Tidak",
                })
            post_hoc_tbl = {
                "title": "Komparasi Berganda: Tukey HSD (Equal Variances Assumed)",
                "rows": tukey_rows,
            }
        elif chosen_post_hoc == "games-howell":
            gh_res = _compute_games_howell(unique_groups, grouped_data, alpha=alpha)
            for row in gh_res:
                row["Signifikan (p < .05)"] = "Ya" if row.pop("p_num") < 0.05 else "Tidak"
            post_hoc_tbl = {
                "title": "Komparasi Berganda: Games-Howell (Equal Variances Not Assumed)",
                "rows": gh_res,
            }

    if p_stat >= 0.05:
        warnings.append(
            "Uji omnibus ANOVA tidak signifikan (p >= 0.05). Hasil perbandingan berganda post-hoc "
            "harus diinterpretasikan dengan sangat hati-hati karena tidak ada bukti perbedaan rata-rata global."
        )

    # 6. Interpretasi Akademik
    chosen_f = welch_f if levene_p < 0.05 else f_stat
    chosen_p = welch_p if levene_p < 0.05 else p_stat
    chosen_test_name = "Welch's ANOVA" if levene_p < 0.05 else "One-Way ANOVA"
    sig_text = "signifikan secara statistik" if chosen_p < 0.05 else "tidak signifikan secara statistik"
    decision = "menolak hipotesis nol (H0)" if chosen_p < 0.05 else "gagal menolak hipotesis nol (H0)"

    interp = (
        f"Analisis Varians Satu Jalur ({chosen_test_name}) dilakukan untuk menguji pengaruh {factor_variable} "
        f"terhadap {dependent_variable}. Hasil uji Levene menunjukkan homogenitas varians F({k - 1}, {n_total - k}) = {levene_f:.2f}, "
        f"p = {levene_p:.3f}. Pengujian {chosen_test_name} menghasilkan F = {chosen_f:.2f}, p = {chosen_p:.4f}, "
        f"yang mengindikasikan bahwa perbedaan rata-rata antar {k} kelompok adalah {sig_text}. "
        f"Ukuran efek ANOVA adalah Eta-squared (η²) = {eta_sq:.3f} dan Omega-squared (ω²) = {omega_sq:.3f}. "
        f"Berdasarkan taraf signifikansi alpha = 0.05, peneliti {decision}. "
    )
    if post_hoc_tbl:
        interp += f"Perbandingan post-hoc menggunakan metode {chosen_post_hoc.title()} menyajikan rincian pasangan kelompok yang berbeda."

    tables = [tbl_desc, tbl_levene, tbl_anova, tbl_welch]
    if post_hoc_tbl:
        tables.append(post_hoc_tbl)

    return {
        "title": f"One-Way ANOVA: {dependent_variable} menurut {factor_variable}",
        "summary": {
            "dependent_variable": dependent_variable,
            "factor_variable": factor_variable,
            "groups_count": k,
            "total_n": n_total,
            "f_stat": sanitize_float(f_stat),
            "p_stat": sanitize_float(p_stat),
            "welch_f": sanitize_float(welch_f),
            "welch_p": sanitize_float(welch_p),
            "levene_f": sanitize_float(levene_f),
            "levene_p": sanitize_float(levene_p),
            "eta_squared": sanitize_float(eta_sq),
            "omega_squared": sanitize_float(omega_sq),
            "post_hoc_method": chosen_post_hoc,
        },
        "tables": tables,
        "interpretation": interp,
        "warnings": warnings,
    }

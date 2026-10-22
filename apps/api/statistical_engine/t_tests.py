"""
Modul Analisis Uji Beda (t-test) — Statistika Pro
Mendukung:
1. One-Sample t-test
2. Independent Samples t-test (Student's t, Welch's t, dan Levene's test)
3. Paired Samples t-test (format berpasangan per baris)
Lengkap dengan ukuran efek (Cohen's d, Hedges' g, Glass's delta) dan interpretasi standar APA.
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


def one_sample_t_test(
    dataset: Any,
    variable: str,
    test_value: float = 0.0,
    confidence_level: float = 0.95,
) -> Dict[str, Any]:
    """
    Uji t Satu Sampel (One-Sample t-test) untuk menguji apakah rata-rata populasi
    berbeda secara signifikan dari nilai acuan/hipotesis tertentu.
    """
    var_map = {v.name: v for v in dataset.variables}
    if variable not in var_map:
        raise VariableNotFoundError(variable)

    missing_codes = set(str(m).strip() for m in (var_map[variable].missing or []))
    
    # Ekstraksi data
    vals = []
    for r in dataset.rows:
        raw = r.get(variable)
        if raw is None or str(raw).strip() == "" or str(raw).lower() in ("nan", "none", "null"):
            continue
        if str(raw).strip() in missing_codes:
            continue
        try:
            vals.append(float(raw))
        except (ValueError, TypeError):
            raise NonNumericDataError(variable)

    n = len(vals)
    if n < 2:
        raise InsufficientDataError(f"Jumlah sampel valid ({n}) minimal 2 untuk One-Sample t-test.")

    arr = np.array(vals)
    mean_val = float(np.mean(arr))
    sd_val = float(np.std(arr, ddof=1))
    
    if sd_val == 0.0:
        raise InsufficientDataError(f"Variabel '{variable}' memiliki varians nol (seluruh nilai identik).")

    se_val = sd_val / math.sqrt(n)
    mean_diff = mean_val - test_value
    df = n - 1
    t_stat = mean_diff / se_val

    # p-value dua sisi
    p_val = float(2 * (1 - stats.t.cdf(abs(t_stat), df=df)))

    # Confidence Interval dari selisih
    alpha = 1.0 - confidence_level
    t_crit = float(stats.t.ppf(1.0 - alpha / 2.0, df=df))
    ci_lower = mean_diff - t_crit * se_val
    ci_upper = mean_diff + t_crit * se_val

    # Effect Size: Cohen's d & Hedges' g
    cohens_d = mean_diff / sd_val
    # Koreksi sampel kecil Hedges
    j_factor = 1.0 - (3.0 / (4.0 * df - 1.0)) if df > 1 else 1.0
    hedges_g = cohens_d * j_factor

    # Uji Asumsi Normalitas (Shapiro-Wilk jika N >= 3 dan N <= 5000)
    warnings: List[str] = []
    if n < 30:
        warnings.append(f"Ukuran sampel kecil (N = {n} < 30). Disarankan memeriksa asumsi normalitas.")
    if 3 <= n <= 5000:
        shapiro_stat, shapiro_p = stats.shapiro(arr)
        if shapiro_p < 0.05:
            warnings.append(
                f"Uji Normalitas Shapiro-Wilk signifikan (W = {shapiro_stat:.3f}, p = {shapiro_p:.3f} < 0.05), "
                "mengindikasikan data berpotensi tidak berdistribusi normal."
            )

    # Tabel 1: Statistik Satu Sampel
    tbl_stats = {
        "title": "Statistik Satu Sampel",
        "rows": [
            {
                "Variabel": variable,
                "N": n,
                "Mean": sanitize_float(mean_val),
                "Std. Deviasi": sanitize_float(sd_val),
                "Std. Error Mean": sanitize_float(se_val),
            }
        ],
    }

    # Tabel 2: Uji Satu Sampel
    ci_pct = int(confidence_level * 100)
    tbl_test = {
        "title": f"Uji Satu Sampel (Nilai Uji = {test_value})",
        "rows": [
            {
                "Variabel": variable,
                "t": sanitize_float(t_stat),
                "df": df,
                "Sig. (2-tailed)": format_p_value(p_val),
                "Rerata Selisih": sanitize_float(mean_diff),
                f"{ci_pct}% CI Bawah": sanitize_float(ci_lower),
                f"{ci_pct}% CI Atas": sanitize_float(ci_upper),
                "Cohen's d": sanitize_float(cohens_d),
                "Hedges' g": sanitize_float(hedges_g),
            }
        ],
    }

    # Interpretasi Naratif
    sig_text = "signifikan secara statistik" if p_val < 0.05 else "tidak signifikan secara statistik"
    decision = "menolak hipotesis nol (H0)" if p_val < 0.05 else "gagal menolak hipotesis nol (H0)"
    dir_text = "lebih tinggi" if mean_diff > 0 else "lebih rendah"

    interp = (
        f"Uji One-Sample t-test menunjukkan bahwa rata-rata {variable} (M = {mean_val:.2f}, SD = {sd_val:.2f}) "
        f"{sig_text} berbeda dari nilai acuan {test_value}, t({df}) = {t_stat:.2f}, p = {p_val:.4f}. "
        f"Rata-rata sampel secara empiris {dir_text} sebesar {abs(mean_diff):.2f} poin "
        f"(95% CI [{ci_lower:.2f}, {ci_upper:.2f}]) dengan ukuran efek Cohen's d = {cohens_d:.2f}. "
        f"Berdasarkan taraf signifikansi alpha = 0.05, peneliti {decision}."
    )

    return {
        "title": f"One-Sample t-test: {variable} (Nilai Acuan = {test_value})",
        "summary": {
            "variable": variable,
            "test_value": test_value,
            "n": n,
            "mean": sanitize_float(mean_val),
            "sd": sanitize_float(sd_val),
            "t": sanitize_float(t_stat),
            "df": df,
            "p_value": sanitize_float(p_val),
            "cohens_d": sanitize_float(cohens_d),
        },
        "tables": [tbl_stats, tbl_test],
        "interpretation": interp,
        "warnings": warnings,
    }


def independent_t_test(
    dataset: Any,
    test_variable: str,
    grouping_variable: str,
    group1_val: Optional[Any] = None,
    group2_val: Optional[Any] = None,
    confidence_level: float = 0.95,
) -> Dict[str, Any]:
    """
    Uji t Dua Sampel Independen (Independent Samples t-test)
    Menyajikan Student's t-test, Welch's t-test, Uji Homogenitas Levene, dan ukuran efek.
    """
    var_map = {v.name: v for v in dataset.variables}
    if test_variable not in var_map:
        raise VariableNotFoundError(test_variable)
    if grouping_variable not in var_map:
        raise VariableNotFoundError(grouping_variable)

    missing_test = set(str(m).strip() for m in (var_map[test_variable].missing or []))
    missing_grp = set(str(m).strip() for m in (var_map[grouping_variable].missing or []))

    # Ekstraksi data berpasangan
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
            num_t = float(val_t)
            valid_rows.append((num_t, str(val_g).strip()))
        except (ValueError, TypeError):
            raise NonNumericDataError(test_variable)

    if len(valid_rows) < 4:
        raise InsufficientDataError(f"Jumlah sampel valid ({len(valid_rows)}) terlalu sedikit untuk uji t independen.")

    df_data = pd.DataFrame(valid_rows, columns=["score", "group"])
    unique_groups = df_data["group"].unique().tolist()

    if group1_val is None or group2_val is None:
        if len(unique_groups) != 2:
            raise InsufficientDataError(
                f"Variabel pengelompok '{grouping_variable}' memiliki {len(unique_groups)} kategori ({unique_groups}). "
                "Tentukan secara spesifik dua kelompok yang ingin dibandingkan."
            )
        g1_name, g2_name = unique_groups[0], unique_groups[1]
    else:
        g1_name, g2_name = str(group1_val).strip(), str(group2_val).strip()
        if g1_name not in unique_groups or g2_name not in unique_groups:
            raise InsufficientDataError(
                f"Kelompok '{g1_name}' atau '{g2_name}' tidak ditemukan pada variabel '{grouping_variable}'."
            )

    g1_arr = df_data[df_data["group"] == g1_name]["score"].to_numpy()
    g2_arr = df_data[df_data["group"] == g2_name]["score"].to_numpy()

    n1, n2 = len(g1_arr), len(g2_arr)
    if n1 < 2 or n2 < 2:
        raise InsufficientDataError(f"Setiap kelompok harus memiliki minimal 2 observasi valid (G1={n1}, G2={n2}).")

    m1, m2 = float(np.mean(g1_arr)), float(np.mean(g2_arr))
    sd1, sd2 = float(np.std(g1_arr, ddof=1)), float(np.std(g2_arr, ddof=1))
    se1, se2 = sd1 / math.sqrt(n1), sd2 / math.sqrt(n2)
    mean_diff = m1 - m2

    if sd1 == 0 and sd2 == 0:
        raise InsufficientDataError("Kedua kelompok memiliki varians nol.")

    # 1. Levene's Test for Equality of Variances (based on median as in brown-forsythe / mean in standard)
    levene_stat, levene_p = stats.levene(g1_arr, g2_arr, center="mean")
    levene_f = float(levene_stat)
    levene_p_val = float(levene_p)

    # 2. Student's t-test (Equal variances assumed)
    df_student = n1 + n2 - 2
    # Pooled variance
    s_pooled_sq = (((n1 - 1) * (sd1 ** 2)) + ((n2 - 1) * (sd2 ** 2))) / max(1, df_student)
    s_pooled = math.sqrt(max(0.0, s_pooled_sq))
    se_diff_student = s_pooled * math.sqrt(1.0 / n1 + 1.0 / n2)
    t_student = mean_diff / se_diff_student if se_diff_student > 0 else 0.0
    p_student = float(2 * (1 - stats.t.cdf(abs(t_student), df=df_student)))

    alpha = 1.0 - confidence_level
    t_crit_student = float(stats.t.ppf(1.0 - alpha / 2.0, df=df_student))
    ci_lower_student = mean_diff - t_crit_student * se_diff_student
    ci_upper_student = mean_diff + t_crit_student * se_diff_student

    # 3. Welch's t-test (Equal variances not assumed)
    se_diff_welch = math.sqrt((sd1 ** 2) / n1 + (sd2 ** 2) / n2)
    t_welch = mean_diff / se_diff_welch if se_diff_welch > 0 else 0.0
    
    # Welch-Satterthwaite df
    num_df = ((sd1 ** 2) / n1 + (sd2 ** 2) / n2) ** 2
    den_df = (((sd1 ** 2) / n1) ** 2) / (n1 - 1) + (((sd2 ** 2) / n2) ** 2) / (n2 - 1)
    df_welch = float(num_df / den_df) if den_df > 0 else float(df_student)
    p_welch = float(2 * (1 - stats.t.cdf(abs(t_welch), df=df_welch)))

    t_crit_welch = float(stats.t.ppf(1.0 - alpha / 2.0, df=df_welch))
    ci_lower_welch = mean_diff - t_crit_welch * se_diff_welch
    ci_upper_welch = mean_diff + t_crit_welch * se_diff_welch

    # Effect size: Cohen's d, Hedges' g, Glass's delta
    cohens_d = mean_diff / s_pooled if s_pooled > 0 else 0.0
    j_factor = 1.0 - (3.0 / (4.0 * df_student - 1.0)) if df_student > 1 else 1.0
    hedges_g = cohens_d * j_factor
    glass_delta = mean_diff / sd2 if sd2 > 0 else 0.0

    warnings: List[str] = []
    if levene_p_val < 0.05:
        warnings.append(
            f"Uji Homogenitas Levene signifikan (F = {levene_f:.3f}, p = {levene_p_val:.3f} < 0.05), "
            "yang menunjukkan bahwa varians kedua kelompok tidak homogen. "
            "Disarankan menggunakan baris 'Equal variances not assumed' (Welch's t-test)."
        )

    # Tabel 1: Statistik Kelompok
    tbl_group = {
        "title": "Statistik Kelompok",
        "rows": [
            {
                "Kelompok": f"{grouping_variable} = {g1_name}",
                "N": n1,
                "Mean": sanitize_float(m1),
                "Std. Deviasi": sanitize_float(sd1),
                "Std. Error Mean": sanitize_float(se1),
            },
            {
                "Kelompok": f"{grouping_variable} = {g2_name}",
                "N": n2,
                "Mean": sanitize_float(m2),
                "Std. Deviasi": sanitize_float(sd2),
                "Std. Error Mean": sanitize_float(se2),
            },
        ],
    }

    ci_pct = int(confidence_level * 100)
    # Tabel 2: Uji Sampel Independen (Levene & t-test)
    tbl_test = {
        "title": "Uji Sampel Independen (Independent Samples Test)",
        "rows": [
            {
                "Asumsi Varians": "Equal variances assumed (Student)",
                "Levene F": sanitize_float(levene_f),
                "Levene Sig.": format_p_value(levene_p_val),
                "t": sanitize_float(t_student),
                "df": df_student,
                "Sig. (2-tailed)": format_p_value(p_student),
                "Rerata Selisih": sanitize_float(mean_diff),
                "SE Selisih": sanitize_float(se_diff_student),
                f"{ci_pct}% CI Bawah": sanitize_float(ci_lower_student),
                f"{ci_pct}% CI Atas": sanitize_float(ci_upper_student),
            },
            {
                "Asumsi Varians": "Equal variances not assumed (Welch)",
                "Levene F": "-",
                "Levene Sig.": "-",
                "t": sanitize_float(t_welch),
                "df": round(df_welch, 2),
                "Sig. (2-tailed)": format_p_value(p_welch),
                "Rerata Selisih": sanitize_float(mean_diff),
                "SE Selisih": sanitize_float(se_diff_welch),
                f"{ci_pct}% CI Bawah": sanitize_float(ci_lower_welch),
                f"{ci_pct}% CI Atas": sanitize_float(ci_upper_welch),
            },
        ],
    }

    # Interpretasi
    if levene_p_val >= 0.05:
        chosen_method = "Student's t-test (Equal variances assumed)"
        chosen_t, chosen_df, chosen_p = t_student, df_student, p_student
        chosen_ci = (ci_lower_student, ci_upper_student)
    else:
        chosen_method = "Welch's t-test (Equal variances not assumed)"
        chosen_t, chosen_df, chosen_p = t_welch, df_welch, p_welch
        chosen_ci = (ci_lower_welch, ci_upper_welch)

    sig_text = "terdapat perbedaan rata-rata yang signifikan secara statistik" if chosen_p < 0.05 else "tidak terdapat perbedaan rata-rata yang signifikan secara statistik"
    decision = "menolak hipotesis nol (H0)" if chosen_p < 0.05 else "gagal menolak hipotesis nol (H0)"

    df_display = f"{chosen_df:.1f}" if isinstance(chosen_df, float) else str(chosen_df)
    interp = (
        f"Uji homogenitas Levene menghasilkan F = {levene_f:.2f}, p = {levene_p_val:.3f}. "
        f"Berdasarkan hasil tersebut, digunakan {chosen_method}. "
        f"Hasil uji menunjukkan bahwa {sig_text} antara kelompok {g1_name} (M = {m1:.2f}, SD = {sd1:.2f}) "
        f"dan kelompok {g2_name} (M = {m2:.2f}, SD = {sd2:.2f}), "
        f"t({df_display}) = {chosen_t:.2f}, p = {chosen_p:.4f}. "
        f"Selisih rata-rata kedua kelompok adalah {mean_diff:.2f} poin (95% CI [{chosen_ci[0]:.2f}, {chosen_ci[1]:.2f}]) "
        f"dengan ukuran efek Cohen's d = {cohens_d:.2f} (Hedges' g = {hedges_g:.2f}). "
        f"Kesimpulan: Peneliti {decision} pada tingkat signifikansi alpha = 0.05."
    )

    return {
        "title": f"Independent Samples t-test: {test_variable} menurut {grouping_variable}",
        "summary": {
            "test_variable": test_variable,
            "grouping_variable": grouping_variable,
            "group1": g1_name,
            "group2": g2_name,
            "n1": n1,
            "n2": n2,
            "m1": sanitize_float(m1),
            "m2": sanitize_float(m2),
            "levene_f": sanitize_float(levene_f),
            "levene_p": sanitize_float(levene_p_val),
            "t_student": sanitize_float(t_student),
            "p_student": sanitize_float(p_student),
            "t_welch": sanitize_float(t_welch),
            "p_welch": sanitize_float(p_welch),
            "cohens_d": sanitize_float(cohens_d),
            "hedges_g": sanitize_float(hedges_g),
        },
        "tables": [tbl_group, tbl_test],
        "interpretation": interp,
        "warnings": warnings,
    }


def paired_t_test(
    dataset: Any,
    variable1: str,
    variable2: str,
    confidence_level: float = 0.95,
) -> Dict[str, Any]:
    """
    Uji t Sampel Berpasangan (Paired Samples t-test)
    Membandingkan dua pengukuran berulang atau variabel berpasangan pada subjek/baris yang sama.
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

    n = len(pairs)
    if n < 2:
        raise InsufficientDataError(f"Jumlah pasangan valid ({n}) minimal 2 untuk Paired Samples t-test.")

    arr1 = np.array([p[0] for p in pairs])
    arr2 = np.array([p[1] for p in pairs])

    m1, m2 = float(np.mean(arr1)), float(np.mean(arr2))
    sd1, sd2 = float(np.std(arr1, ddof=1)), float(np.std(arr2, ddof=1))
    se1, se2 = sd1 / math.sqrt(n), sd2 / math.sqrt(n)

    # Korelasi antar pasangan
    corr_res = stats.pearsonr(arr1, arr2)
    r_corr = float(corr_res[0])
    p_corr = float(corr_res[1])

    # Perbedaan berpasangan (Diff = Var1 - Var2)
    diff = arr1 - arr2
    m_diff = float(np.mean(diff))
    sd_diff = float(np.std(diff, ddof=1))
    
    if sd_diff == 0.0:
        raise InsufficientDataError("Selisih antar pasangan memiliki varians nol (selisih konstan).")

    se_diff = sd_diff / math.sqrt(n)
    df = n - 1
    t_stat = m_diff / se_diff
    p_val = float(2 * (1 - stats.t.cdf(abs(t_stat), df=df)))

    alpha = 1.0 - confidence_level
    t_crit = float(stats.t.ppf(1.0 - alpha / 2.0, df=df))
    ci_lower = m_diff - t_crit * se_diff
    ci_upper = m_diff + t_crit * se_diff

    # Ukuran efek: Cohen's d_z = M_diff / SD_diff
    cohens_dz = m_diff / sd_diff

    warnings: List[str] = []
    if n < 30:
        warnings.append(f"Ukuran sampel kecil (N = {n} pasangan). Perhatikan asumsi normalitas selisih perbedaan.")

    # Tabel 1: Statistik Sampel Berpasangan
    tbl_stats = {
        "title": "Statistik Sampel Berpasangan",
        "rows": [
            {
                "Pasangan": f"Pair 1 - {variable1}",
                "Mean": sanitize_float(m1),
                "N": n,
                "Std. Deviasi": sanitize_float(sd1),
                "Std. Error Mean": sanitize_float(se1),
            },
            {
                "Pasangan": f"Pair 1 - {variable2}",
                "Mean": sanitize_float(m2),
                "N": n,
                "Std. Deviasi": sanitize_float(sd2),
                "Std. Error Mean": sanitize_float(se2),
            },
        ],
    }

    # Tabel 2: Korelasi Sampel Berpasangan
    tbl_corr = {
        "title": "Korelasi Sampel Berpasangan",
        "rows": [
            {
                "Pasangan": f"{variable1} & {variable2}",
                "N": n,
                "Korelasi": sanitize_float(r_corr),
                "Sig.": format_p_value(p_corr),
            }
        ],
    }

    # Tabel 3: Uji Sampel Berpasangan
    ci_pct = int(confidence_level * 100)
    tbl_test = {
        "title": "Uji Sampel Berpasangan (Paired Differences)",
        "rows": [
            {
                "Pasangan": f"{variable1} - {variable2}",
                "Rerata Selisih": sanitize_float(m_diff),
                "Std. Deviasi": sanitize_float(sd_diff),
                "Std. Error Mean": sanitize_float(se_diff),
                f"{ci_pct}% CI Bawah": sanitize_float(ci_lower),
                f"{ci_pct}% CI Atas": sanitize_float(ci_upper),
                "t": sanitize_float(t_stat),
                "df": df,
                "Sig. (2-tailed)": format_p_value(p_val),
                "Cohen's dz": sanitize_float(cohens_dz),
            }
        ],
    }

    sig_text = "perbedaan yang signifikan secara statistik" if p_val < 0.05 else "tidak ada perbedaan yang signifikan secara statistik"
    decision = "menolak hipotesis nol (H0)" if p_val < 0.05 else "gagal menolak hipotesis nol (H0)"

    interp = (
        f"Uji Paired Samples t-test menunjukkan adanya {sig_text} antara {variable1} (M = {m1:.2f}, SD = {sd1:.2f}) "
        f"dan {variable2} (M = {m2:.2f}, SD = {sd2:.2f}), t({df}) = {t_stat:.2f}, p = {p_val:.4f}. "
        f"Rerata selisih perbedaan adalah {m_diff:.2f} poin (95% CI [{ci_lower:.2f}, {ci_upper:.2f}]) "
        f"dengan ukuran efek Cohen's dz = {cohens_dz:.2f}. "
        f"Kedua pengukuran memiliki korelasi r = {r_corr:.3f} (p = {p_corr:.3f}). "
        f"Kesimpulan: Peneliti {decision} pada taraf signifikansi alpha = 0.05."
    )

    return {
        "title": f"Paired Samples t-test: {variable1} vs {variable2}",
        "summary": {
            "var1": variable1,
            "var2": variable2,
            "n": n,
            "m1": sanitize_float(m1),
            "m2": sanitize_float(m2),
            "mean_diff": sanitize_float(m_diff),
            "sd_diff": sanitize_float(sd_diff),
            "r_corr": sanitize_float(r_corr),
            "t": sanitize_float(t_stat),
            "df": df,
            "p_value": sanitize_float(p_val),
            "cohens_dz": sanitize_float(cohens_dz),
        },
        "tables": [tbl_stats, tbl_corr, tbl_test],
        "interpretation": interp,
        "warnings": warnings,
    }

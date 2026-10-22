"""
Modul Regresi Logistik Biner (Binary Logistic Regression) — Statistika Pro
Mendukung:
1. Variabel dependen biner (validasi 2 kelompok terdefinisi).
2. Prediktor numerik & kategorikal (dummy encoding dengan referensi 'pertama' atau 'terakhir').
3. Koefisien B, Standard Error, Uji Wald, p-value, Odds Ratio Exp(B) dan 95% CI.
4. Omnibus Tests of Model Coefficients (Chi-Square, df, Sig).
5. Ringkasan Model: -2 Log-Likelihood, Cox & Snell R², Nagelkerke R², McFadden R², AIC, BIC.
6. Uji Hosmer-Lemeshow Goodness-of-Fit.
7. Tabel Klasifikasi (Confusion Matrix) dengan ambang batas (cutoff) yang dapat diatur.
8. Pemeriksaan konvergensi dan separasi data (quasi/complete separation).
"""

from typing import Dict, Any, List, Optional, Tuple
import math
import numpy as np
import pandas as pd
import statsmodels.api as sm
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


def _compute_hosmer_lemeshow(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    g: int = 10,
) -> Tuple[Optional[float], int, Optional[float]]:
    """
    Menghitung uji kesesuaian model Hosmer-Lemeshow.
    Membagi prediksi probabilitas menjadi g kelompok (default 10 desil).
    H-L statistic = sum( (O_1k - E_1k)^2 / (N_k * pi_k * (1 - pi_k)) )
    df = g - 2
    """
    try:
        df_hl = pd.DataFrame({"y": y_true, "prob": y_prob})
        # Rank probabilitas untuk membentuk deciles
        try:
            df_hl["group"] = pd.qcut(df_hl["prob"], q=g, duplicates="drop")
        except Exception:
            return None, 8, None

        grouped = df_hl.groupby("group", observed=False)
        hl_stat = 0.0
        actual_g = len(grouped)
        if actual_g <= 2:
            return None, max(1, actual_g - 2), None

        for _, grp in grouped:
            n_k = len(grp)
            if n_k == 0:
                continue
            o_1 = float(grp["y"].sum())
            o_0 = n_k - o_1
            p_mean = float(grp["prob"].mean())
            e_1 = n_k * p_mean
            e_0 = n_k * (1.0 - p_mean)

            term1 = ((o_1 - e_1) ** 2) / e_1 if e_1 > 0 else 0.0
            term0 = ((o_0 - e_0) ** 2) / e_0 if e_0 > 0 else 0.0
            hl_stat += (term1 + term0)

        df_val = max(1, actual_g - 2)
        p_val = float(1.0 - stats.chi2.cdf(hl_stat, df=df_val))
        return float(hl_stat), df_val, p_val
    except Exception:
        return None, 8, None


def binary_logistic_regression(
    dataset: Any,
    dependent_variable: str,
    independent_variables: List[str],
    categorical_variables: Optional[List[str]] = None,
    reference_category: str = "last",  # 'first' or 'last'
    cutoff: float = 0.5,
) -> Dict[str, Any]:
    """
    Eksekusi Regresi Logistik Biner lengkap ala SPSS.
    """
    if not independent_variables:
        raise InsufficientDataError("Pilih minimal satu variabel prediktor (independen).")

    all_vars = [dependent_variable] + independent_variables
    var_map = {v.name: v for v in dataset.variables}
    for v in all_vars:
        if v not in var_map:
            raise VariableNotFoundError(v)

    missing_codes = {v: set(str(m).strip() for m in (var_map[v].missing or [])) for v in all_vars}
    cat_vars = set(categorical_variables or [])

    # Ekstraksi baris valid
    valid_rows = []
    for r in dataset.rows:
        row_dict = {}
        is_valid = True
        for v in all_vars:
            raw = r.get(v)
            if raw is None or str(raw).strip() == "" or str(raw).lower() in ("nan", "none", "null") or str(raw).strip() in missing_codes[v]:
                is_valid = False
                break
            # Jika variabel prediktor numerik kontinu, validasi float
            if v != dependent_variable and v not in cat_vars:
                try:
                    row_dict[v] = float(raw)
                except (ValueError, TypeError):
                    raise NonNumericDataError(v)
            else:
                row_dict[v] = str(raw).strip()
        if is_valid:
            valid_rows.append(row_dict)

    n_total = len(valid_rows)
    if n_total < 10:
        raise InsufficientDataError(f"Jumlah sampel valid ({n_total}) terlalu sedikit untuk regresi logistik (minimal 10).")

    df_data = pd.DataFrame(valid_rows)

    # 1. Validasi Variabel Dependen Biner
    dep_series = df_data[dependent_variable]
    dep_categories = sorted(dep_series.unique().tolist())
    if len(dep_categories) != 2:
        raise InsufficientDataError(
            f"Variabel dependen '{dependent_variable}' harus memiliki tepat 2 kategori (ditemukan {len(dep_categories)}: {dep_categories})."
        )

    # Encode dependen: Kategori kedua menjadi 1 (Target Event), kategori pertama menjadi 0 (Baseline)
    cat_0, cat_1 = dep_categories[0], dep_categories[1]
    y_vec = np.where(dep_series == cat_1, 1, 0)
    n_cat0 = int(np.sum(y_vec == 0))
    n_cat1 = int(np.sum(y_vec == 1))

    if min(n_cat0, n_cat1) < 2:
        raise InsufficientDataError(
            f"Frekuensi kategori dependen terlalu timpang ({cat_0}: {n_cat0}, {cat_1}: {n_cat1})."
        )

    # 2. Penyusunan Matriks Desain Prediktor (X) dengan Dummy Encoding
    design_df = pd.DataFrame(index=df_data.index)
    var_param_mapping = []

    for v in independent_variables:
        if v in cat_vars:
            cats = sorted(df_data[v].unique().tolist())
            if len(cats) < 2:
                raise InsufficientDataError(f"Prediktor kategorikal '{v}' harus memiliki minimal 2 kategori.")
            ref_cat = cats[0] if reference_category == "first" else cats[-1]
            non_ref_cats = [c for c in cats if c != ref_cat]

            for c in non_ref_cats:
                col_name = f"{v}_{c}"
                design_df[col_name] = (df_data[v] == c).astype(float)
                var_param_mapping.append((col_name, f"{v}({c})"))
        else:
            design_df[v] = df_data[v].astype(float)
            var_param_mapping.append((v, v))

    # Tambahkan konstanta intersep
    design_df_with_const = sm.add_constant(design_df, has_constant="add")

    # 3. Fitting Model Regresi Logistik Biner
    warnings: List[str] = []
    try:
        model = sm.Logit(y_vec, design_df_with_const)
        res = model.fit(disp=False, maxiter=100)
    except Exception as e:
        raise InsufficientDataError(f"Model regresi logistik gagal konvergen atau data mengalami perfect separation: {str(e)}")

    # Periksa nilai SE ekstrem yang mengindikasikan quasi/complete separation
    b_params = res.params
    se_params = res.bse
    for name, se_val in se_params.items():
        if math.isnan(se_val) or se_val > 50.0:
            warnings.append(
                f"Prediktor '{name}' memiliki Standard Error sangat besar (SE = {se_val:.1f}), "
                "mengindikasikan terjadinya pemisahan data kuasi/sempurna (quasi-complete separation)."
            )

    # 4. Ringkasan Model & Pseudo R²
    ll_model = float(res.llf)
    ll_null = float(res.llnull)
    lr_stat = float(2.0 * (ll_model - ll_null))
    df_lr = len(b_params) - 1
    p_lr = float(1.0 - stats.chi2.cdf(lr_stat, df=df_lr)) if df_lr > 0 else 1.0

    # Cox & Snell R²: 1 - exp(2(LL_null - LL_model) / N)
    cox_snell = 1.0 - math.exp((2.0 / n_total) * (ll_null - ll_model)) if n_total > 0 else 0.0
    cox_snell = max(0.0, min(1.0, cox_snell))

    # Nagelkerke R²: Cox_Snell / (1 - exp(2 * LL_null / N))
    max_cox_snell = 1.0 - math.exp((2.0 / n_total) * ll_null) if n_total > 0 else 1.0
    nagelkerke = cox_snell / max_cox_snell if max_cox_snell > 0 else cox_snell
    nagelkerke = max(0.0, min(1.0, nagelkerke))

    # McFadden R²: 1 - (LL_model / LL_null)
    mcfadden = 1.0 - (ll_model / ll_null) if ll_null != 0 else 0.0
    mcfadden = max(0.0, min(1.0, mcfadden))

    aic_val = float(res.aic)
    bic_val = float(res.bic)

    tbl_omnibus = {
        "title": "Uji Omnibus Koefisien Model (Omnibus Tests of Model Coefficients)",
        "rows": [
            {
                "Komponen": "Model (Chi-Square)",
                "Chi-Square": sanitize_float(lr_stat),
                "df": df_lr,
                "Sig.": format_p_value(p_lr),
            }
        ],
    }

    tbl_summary = {
        "title": "Ringkasan Model (Model Summary)",
        "rows": [
            {
                "-2 Log-Likelihood": sanitize_float(-2.0 * ll_model),
                "Cox & Snell R²": sanitize_float(cox_snell),
                "Nagelkerke R²": sanitize_float(nagelkerke),
                "McFadden R²": sanitize_float(mcfadden),
                "AIC": sanitize_float(aic_val),
                "BIC": sanitize_float(bic_val),
            }
        ],
    }

    # 5. Uji Hosmer-Lemeshow
    pred_probs = res.predict(design_df_with_const)
    hl_stat, hl_df, hl_p = _compute_hosmer_lemeshow(y_vec, pred_probs, g=10)
    tbl_hl = None
    if hl_stat is not None:
        tbl_hl = {
            "title": "Uji Hosmer-Lemeshow (Goodness-of-Fit Test)",
            "rows": [
                {
                    "Chi-Square": sanitize_float(hl_stat),
                    "df": hl_df,
                    "Sig.": format_p_value(hl_p),
                }
            ],
        }
        if hl_p < 0.05:
            warnings.append(
                f"Uji Hosmer-Lemeshow signifikan (Chi-Square = {hl_stat:.2f}, p = {hl_p:.3f} < 0.05), "
                "mengindikasikan bahwa model kurang fit terhadap data observasi."
            )

    # 6. Tabel Klasifikasi (Confusion Matrix)
    pred_binary = (pred_probs >= cutoff).astype(int)
    c00 = int(np.sum((y_vec == 0) & (pred_binary == 0)))
    c01 = int(np.sum((y_vec == 0) & (pred_binary == 1)))
    c10 = int(np.sum((y_vec == 1) & (pred_binary == 0)))
    c11 = int(np.sum((y_vec == 1) & (pred_binary == 1)))

    pct_c0 = (c00 / n_cat0 * 100.0) if n_cat0 > 0 else 0.0
    pct_c1 = (c11 / n_cat1 * 100.0) if n_cat1 > 0 else 0.0
    pct_overall = ((c00 + c11) / n_total * 100.0) if n_total > 0 else 0.0

    tbl_classification = {
        "title": f"Tabel Klasifikasi (Ambang Batas / Cutoff = {cutoff})",
        "rows": [
            {
                "Observasi": f"{dependent_variable} = {cat_0}",
                f"Prediksi: {cat_0}": c00,
                f"Prediksi: {cat_1}": c01,
                "Persentase Benar": f"{pct_c0:.1f}%",
            },
            {
                "Observasi": f"{dependent_variable} = {cat_1}",
                f"Prediksi: {cat_0}": c10,
                f"Prediksi: {cat_1}": c11,
                "Persentase Benar": f"{pct_c1:.1f}%",
            },
            {
                "Observasi": "Persentase Keseluruhan",
                f"Prediksi: {cat_0}": "-",
                f"Prediksi: {cat_1}": "-",
                "Persentase Benar": f"{pct_overall:.1f}%",
            },
        ],
    }

    # 7. Tabel Variabel dalam Persamaan (Variables in the Equation)
    var_rows = []
    pvalues = res.pvalues
    conf_int = res.conf_int()

    for col_key, display_label in [("const", "Konstanta (Constant)")] + var_param_mapping:
        if col_key not in b_params:
            continue
        b_val = float(b_params[col_key])
        se_val = float(se_params[col_key]) if not math.isnan(se_params[col_key]) else 0.0
        wald_stat = (b_val / se_val) ** 2 if se_val > 0 else 0.0
        p_val = float(pvalues[col_key]) if not math.isnan(pvalues[col_key]) else 1.0

        # Odds Ratio = Exp(B)
        try:
            exp_b = math.exp(b_val)
        except OverflowError:
            exp_b = float("inf")

        # 95% CI untuk Exp(B)
        ci_lower_b = float(conf_int.loc[col_key, 0])
        ci_upper_b = float(conf_int.loc[col_key, 1])
        try:
            exp_ci_lower = math.exp(ci_lower_b)
        except OverflowError:
            exp_ci_lower = 0.0
        try:
            exp_ci_upper = math.exp(ci_upper_b)
        except OverflowError:
            exp_ci_upper = float("inf")

        var_rows.append({
            "Variabel": display_label,
            "B": sanitize_float(b_val),
            "S.E.": sanitize_float(se_val),
            "Wald": sanitize_float(wald_stat),
            "df": 1,
            "Sig.": format_p_value(p_val),
            "Exp(B) / Odds Ratio": sanitize_float(exp_b),
            "95% CI Bawah": sanitize_float(exp_ci_lower),
            "95% CI Atas": sanitize_float(exp_ci_upper),
        })

    tbl_variables = {
        "title": "Variabel dalam Persamaan (Variables in the Equation)",
        "rows": var_rows,
    }

    # 8. Interpretasi
    sig_omnibus = "signifikan secara statistik" if p_lr < 0.05 else "tidak signifikan secara statistik"
    decision = "menolak hipotesis nol (H0)" if p_lr < 0.05 else "gagal menolak hipotesis nol (H0)"

    interp = (
        f"Regresi Logistik Biner dilakukan untuk memprediksi probabilitas {dependent_variable} = '{cat_1}' "
        f"berdasarkan {len(independent_variables)} variabel prediktor (N = {n_total}). "
        f"Uji Omnibus koefisien model menunjukkan bahwa model secara keseluruhan {sig_omnibus}, "
        f"χ²({df_lr}) = {lr_stat:.2f}, p = {p_lr:.4f}. Peneliti {decision}. "
        f"Kekuatan asosiasi model dijelaskan oleh Cox & Snell R² = {cox_snell:.3f} dan Nagelkerke R² = {nagelkerke:.3f} "
        f"(McFadden R² = {mcfadden:.3f}). "
        f"Model berhasil mengklasifikasikan data dengan akurasi keseluruhan sebesar {pct_overall:.1f}%. "
        f"Perhatikan nilai Exp(B) pada tabel untuk melihat rasio odds (Odds Ratio) masing-masing prediktor."
    )

    tables = [tbl_omnibus, tbl_summary]
    if tbl_hl:
        tables.append(tbl_hl)
    tables.extend([tbl_classification, tbl_variables])

    return {
        "title": f"Regresi Logistik Biner: {dependent_variable}",
        "summary": {
            "dependent_variable": dependent_variable,
            "target_category": cat_1,
            "reference_category": cat_0,
            "n_total": n_total,
            "chi2_omnibus": sanitize_float(lr_stat),
            "p_omnibus": sanitize_float(p_lr),
            "cox_snell": sanitize_float(cox_snell),
            "nagelkerke": sanitize_float(nagelkerke),
            "mcfadden": sanitize_float(mcfadden),
            "accuracy": sanitize_float(pct_overall),
            "cutoff": cutoff,
        },
        "tables": tables,
        "interpretation": interp,
        "warnings": warnings,
    }

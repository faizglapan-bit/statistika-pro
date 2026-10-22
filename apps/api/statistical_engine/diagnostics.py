from typing import List, Dict, Any, Optional
import math
import numpy as np
import pandas as pd

from statistical_engine.schemas import (
    StatValue,
    DiagnosticsSummary,
)
from statistical_engine.common import (
    sanitize_float,
    format_stat,
    format_p_value,
)


def compute_diagnostics(
    y: np.ndarray,
    X: pd.DataFrame,
    residuals: np.ndarray,
    predictor_names: List[str],
) -> DiagnosticsSummary:
    """
    Hitung Uji Asumsi Klasik / Diagnostik Regresi:
    1. Normalitas Residual (Shapiro-Wilk & Jarque-Bera)
    2. Multikolinearitas (VIF & Tolerance)
    3. Heteroskedastisitas (Breusch-Pagan & Uji Glejser)
    4. Autokorelasi (Durbin-Watson)
    """
    warnings: List[str] = []
    n = len(residuals)

    # ========================================================================
    # 1. Normalitas Residual
    # ========================================================================
    shapiro_dict: Dict[str, StatValue] = {}
    try:
        import scipy.stats as stats
        if 3 <= n <= 5000:
            sw_stat, sw_p = stats.shapiro(residuals)
            shapiro_dict["statistic"] = StatValue(value=sanitize_float(sw_stat), formatted=format_stat(sw_stat))
            shapiro_dict["p_value"] = StatValue(value=sanitize_float(sw_p), formatted=format_p_value(sw_p))
            shapiro_dict["test_name"] = StatValue(formatted="Shapiro-Wilk")
        else:
            # Jarque-Bera untuk N besar
            jb_stat, jb_p = stats.jarque_bera(residuals)
            shapiro_dict["statistic"] = StatValue(value=sanitize_float(jb_stat), formatted=format_stat(jb_stat))
            shapiro_dict["p_value"] = StatValue(value=sanitize_float(jb_p), formatted=format_p_value(jb_p))
            shapiro_dict["test_name"] = StatValue(formatted="Jarque-Bera (N > 5000)")
    except Exception as e:
        shapiro_dict["statistic"] = StatValue(value=None, formatted="—", note=str(e))
        shapiro_dict["p_value"] = StatValue(value=None, formatted="—")

    # ========================================================================
    # 2. Multikolinearitas (VIF & Tolerance)
    # ========================================================================
    vif_dict: Dict[str, StatValue] = {}
    if len(predictor_names) > 1:
        for pred in predictor_names:
            # Regresikan prediktor terhadap sisa prediktor lainnya
            other_preds = [p for p in predictor_names if p != pred]
            try:
                import statsmodels.api as sm
                X_aux = sm.add_constant(X[other_preds])
                aux_model = sm.OLS(X[pred], X_aux).fit()
                r2_aux = float(aux_model.rsquared)
                if r2_aux >= 1.0 - 1e-12:
                    vif_val = None
                    tol_val = 0.0
                    warnings.append(f"Prediktor '{pred}' kolinear sempurna dengan prediktor lain.")
                else:
                    vif_val = float(1.0 / (1.0 - r2_aux))
                    tol_val = float(1.0 - r2_aux)

                vif_dict[pred] = StatValue(
                    value=sanitize_float(vif_val),
                    formatted=format_stat(vif_val) if vif_val is not None else "Inf",
                    note=f"Tolerance = {format_stat(tol_val)}",
                )
            except Exception:
                vif_dict[pred] = StatValue(value=None, formatted="—", note="Tidak dapat dihitung")
    else:
        vif_dict[predictor_names[0]] = StatValue(
            value=1.0,
            formatted="1.000",
            note="Tolerance = 1.000 (Regresi sederhana)",
        )

    # ========================================================================
    # 3. Heteroskedastisitas (Breusch-Pagan & Uji Glejser)
    # ========================================================================
    bp_dict: Dict[str, StatValue] = {}
    try:
        import statsmodels.api as sm
        from statsmodels.stats.diagnostic import het_breuschpagan
        X_with_const = sm.add_constant(X[predictor_names])
        bp_test = het_breuschpagan(residuals, X_with_const)
        # bp_test returns (lm_statistic, lm_pvalue, fvalue, f_pvalue)
        bp_dict["lm_stat"] = StatValue(value=sanitize_float(bp_test[0]), formatted=format_stat(bp_test[0]))
        bp_dict["p_value"] = StatValue(value=sanitize_float(bp_test[1]), formatted=format_p_value(bp_test[1]))
    except Exception as e:
        bp_dict["lm_stat"] = StatValue(value=None, formatted="—", note=str(e))
        bp_dict["p_value"] = StatValue(value=None, formatted="—")

    # Uji Glejser: OLS |e_i| terhadap tiap prediktor
    glejser_results: List[Dict[str, Any]] = []
    abs_res = np.abs(residuals)
    for pred in predictor_names:
        try:
            import statsmodels.api as sm
            X_glej = sm.add_constant(X[[pred]])
            glej_model = sm.OLS(abs_res, X_glej).fit()
            p_coef = float(glej_model.pvalues[pred])
            glejser_results.append({
                "variable": pred,
                "t_statistic": format_stat(float(glej_model.tvalues[pred])),
                "p_value": format_p_value(p_coef),
                "is_heteroskedastic": bool(p_coef < 0.05),
            })
        except Exception:
            glejser_results.append({
                "variable": pred,
                "t_statistic": "—",
                "p_value": "—",
                "is_heteroskedastic": False,
            })

    # ========================================================================
    # 4. Autokorelasi (Durbin-Watson)
    # ========================================================================
    try:
        from statsmodels.stats.stattools import durbin_watson
        dw_val = float(durbin_watson(residuals))
        dw_stat = StatValue(
            value=sanitize_float(dw_val),
            formatted=format_stat(dw_val),
            note="Nilai mendekati 2.0 mengindikasikan tidak adanya autokorelasi urutan pertama.",
        )
    except Exception:
        dw_stat = StatValue(value=None, formatted="—")

    # Interpretasi Terpadu
    interpretation = (
        "Diagnostik model mengevaluasi asumsi OLS: "
        "1. Normalitas Residual: p-value > 0.05 menunjukkan residual berdistribusi normal. "
        "2. Multikolinearitas: VIF < 10 (atau Tolerance > 0.10) mengindikasikan bebas multikolinearitas. "
        "3. Heteroskedastisitas: p-value Breusch-Pagan / Glejser > 0.05 menandakan varians residual homogen. "
        "4. Autokorelasi: Nilai Durbin-Watson sekitar 2 mengindikasikan residual saling bebas. "
        "Catatan: Jangan menyatakan model pasti baik hanya karena satu uji memenuhi syarat. "
        "Evaluasi keseluruhan spesifikasi model secara terpadu."
    )

    return DiagnosticsSummary(
        shapiro_wilk=shapiro_dict,
        breusch_pagan=bp_dict,
        glejser=glejser_results,
        vif=vif_dict,
        durbin_watson=dw_stat,
        warnings=warnings,
        interpretation=interpretation,
    )

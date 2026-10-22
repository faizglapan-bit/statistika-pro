from typing import List, Dict, Any, Optional
import math
import numpy as np
import pandas as pd

from statistical_engine.schemas import (
    StatValue,
    RegressionCoefficient,
    AnovaRow,
    RegressionResponse,
)
from statistical_engine.common import (
    extract_numeric_data,
    sanitize_float,
    format_stat,
    format_p_value,
)
from statistical_engine.exceptions import (
    InsufficientDataError,
    CollinearPredictorsError,
    ConstantColumnError,
)
from statistical_engine.diagnostics import compute_diagnostics


def calculate_regression(
    dataset: Any,
    dependent_var: str,
    independent_vars: List[str],
    include_intercept: bool = True,
    include_diagnostics: bool = True,
    confidence_level: float = 0.95,
    robust_se: Optional[str] = None,
) -> RegressionResponse:
    """
    Hitung Regresi Linear OLS (Sederhana dan Berganda), ANOVA, Koefisien, dan Diagnostik Asumsi.
    """
    all_vars = [dependent_var] + independent_vars
    df, meta = extract_numeric_data(dataset, all_vars, missing_policy="listwise", min_required_rows=len(independent_vars) + 2)
    n = len(df)
    k_preds = len(independent_vars)
    warnings: List[str] = []

    # Validasi varians variabel dependen
    y_series = df[dependent_var]
    if y_series.var(ddof=1) == 0.0:
        raise ConstantColumnError(dependent_var)

    # Validasi varians prediktor
    for pred in independent_vars:
        if df[pred].var(ddof=1) == 0.0:
            raise ConstantColumnError(pred)

    y = y_series.to_numpy(dtype=float)
    X_df = df[independent_vars].copy()

    # Import statsmodels
    import statsmodels.api as sm

    if include_intercept:
        X_mat = sm.add_constant(X_df)
    else:
        X_mat = X_df

    # Cek rank matriks untuk deteksi multikolinearitas sempurna
    rank = np.linalg.matrix_rank(X_mat)
    expected_rank = X_mat.shape[1]
    if rank < expected_rank:
        raise CollinearPredictorsError(
            f"Matriks prediktor mengalami kolinearitas sempurna (Rank: {rank} < {expected_rank}). "
            "Satu atau lebih variabel merupakan kombinasi linier sempurna dari variabel lain."
        )

    # Fit Model OLS
    try:
        model_init = sm.OLS(y, X_mat)
        if robust_se:
            fit_res = model_init.fit(cov_type=robust_se)
            warnings.append(f"Model diestimasi menggunakan Heteroskedasticity-Consistent Standard Errors ({robust_se}).")
        else:
            fit_res = model_init.fit()
    except Exception as e:
        raise InsufficientDataError(f"Gagal mengestimasi model regresi OLS: {str(e)}")

    # 1. Model Summary Metrics
    r_squared = float(fit_res.rsquared)
    adj_r_squared = float(fit_res.rsquared_adj)
    r_mult = math.sqrt(max(0.0, r_squared))
    # Residual standard error = sqrt(scale)
    se_estimate = float(math.sqrt(fit_res.scale))
    f_stat = float(fit_res.fvalue) if hasattr(fit_res, "fvalue") and fit_res.fvalue is not None else None
    p_model = float(fit_res.f_pvalue) if hasattr(fit_res, "f_pvalue") and fit_res.f_pvalue is not None else None

    # 2. ANOVA Table
    # SS Total = sum((y - y_mean)^2)
    y_mean = float(np.mean(y))
    ss_total = float(np.sum((y - y_mean) ** 2))
    ss_resid = float(fit_res.ssr)
    ss_reg = max(0.0, ss_total - ss_resid)

    df_reg = k_preds
    df_resid = n - (k_preds + 1 if include_intercept else k_preds)
    df_total = n - 1

    ms_reg = ss_reg / df_reg if df_reg > 0 else 0.0
    ms_resid = ss_resid / df_resid if df_resid > 0 else 0.0

    anova_table = [
        AnovaRow(
            source="Regression",
            sum_of_squares=StatValue(value=sanitize_float(ss_reg), formatted=format_stat(ss_reg)),
            df=df_reg,
            mean_square=StatValue(value=sanitize_float(ms_reg), formatted=format_stat(ms_reg)),
            f=StatValue(value=sanitize_float(f_stat), formatted=format_stat(f_stat)),
            p_value=StatValue(value=sanitize_float(p_model), formatted=format_p_value(p_model)),
        ),
        AnovaRow(
            source="Residual",
            sum_of_squares=StatValue(value=sanitize_float(ss_resid), formatted=format_stat(ss_resid)),
            df=df_resid,
            mean_square=StatValue(value=sanitize_float(ms_resid), formatted=format_stat(ms_resid)),
            f=StatValue(value=None, formatted="—"),
            p_value=StatValue(value=None, formatted="—"),
        ),
        AnovaRow(
            source="Total",
            sum_of_squares=StatValue(value=sanitize_float(ss_total), formatted=format_stat(ss_total)),
            df=df_total,
            mean_square=StatValue(value=None, formatted="—"),
            f=StatValue(value=None, formatted="—"),
            p_value=StatValue(value=None, formatted="—"),
        ),
    ]

    # 3. Coefficients Table (B, SE, Beta, t, p, CI)
    sy = float(y_series.std(ddof=1))
    ci = fit_res.conf_int(alpha=1.0 - confidence_level)
    coeffs: List[RegressionCoefficient] = []

    equation_parts = []
    intercept_val = 0.0

    for col in X_mat.columns:
        b_val = float(fit_res.params[col])
        se_val = float(fit_res.bse[col])
        t_val = float(fit_res.tvalues[col])
        p_val = float(fit_res.pvalues[col])
        ci_low = float(ci.loc[col, 0])
        ci_up = float(ci.loc[col, 1])

        if col == "const":
            var_label = "(Constant)"
            beta_stat = StatValue(value=None, formatted="—", note="Konstanta tidak memiliki Beta")
            intercept_val = b_val
        else:
            var_label = col
            # Hitung Standardized Beta: Beta = B * (sx / sy)
            sx = float(df[col].std(ddof=1))
            beta_val = b_val * (sx / sy) if sy > 0 else 0.0
            beta_stat = StatValue(value=sanitize_float(beta_val), formatted=format_stat(beta_val))

            sign = "+" if b_val >= 0 else "-"
            equation_parts.append(f"{sign} {abs(b_val):.3f}*{col}")

        coeffs.append(
            RegressionCoefficient(
                variable=var_label,
                b=StatValue(value=sanitize_float(b_val), formatted=format_stat(b_val)),
                std_error=StatValue(value=sanitize_float(se_val), formatted=format_stat(se_val)),
                beta=beta_stat,
                t=StatValue(value=sanitize_float(t_val), formatted=format_stat(t_val)),
                p_value=StatValue(value=sanitize_float(p_val), formatted=format_p_value(p_val)),
                ci_lower=StatValue(value=sanitize_float(ci_low), formatted=format_stat(ci_low)),
                ci_upper=StatValue(value=sanitize_float(ci_up), formatted=format_stat(ci_up)),
            )
        )

    # Susun persamaan regresi eksplisit
    eq_str = f"{dependent_var} = {intercept_val:.3f} " + " ".join(equation_parts) if equation_parts else f"{dependent_var} = {intercept_val:.3f}"

    # 4. Diagnostik Regresi
    diag_summary = None
    if include_diagnostics:
        diag_summary = compute_diagnostics(
            y=y,
            X=X_df,
            residuals=fit_res.resid,
            predictor_names=independent_vars,
        )

    # 5. Interpretasi
    sig_note = "signifikan secara simultan" if (p_model is not None and p_model < 0.05) else "tidak signifikan secara simultan"
    r2_pct = r_squared * 100.0
    interpretation = (
        f"Model regresi menghasilkan R² sebesar {format_stat(r_squared)} ({r2_pct:.1f}% variasi {dependent_var} dapat dijelaskan oleh prediktor). "
        f"Uji ANOVA menunjukkan model {sig_note} (F={format_stat(f_stat)}, p={format_p_value(p_model)}). "
        "Catatan: Regresi observasional menunjukkan hubungan prediktif statistik dan tidak boleh otomatis ditafsirkan sebagai hubungan kausalitas (sebab-akibat)."
    )

    return RegressionResponse(
        dataset_id=dataset.id,
        dataset_name=dataset.name,
        dependent_variable=dependent_var,
        independent_variables=independent_vars,
        sample_size=n,
        r=StatValue(value=sanitize_float(r_mult), formatted=format_stat(r_mult)),
        r_squared=StatValue(value=sanitize_float(r_squared), formatted=format_stat(r_squared)),
        adj_r_squared=StatValue(value=sanitize_float(adj_r_squared), formatted=format_stat(adj_r_squared)),
        std_error_estimate=StatValue(value=sanitize_float(se_estimate), formatted=format_stat(se_estimate)),
        f_stat=StatValue(value=sanitize_float(f_stat), formatted=format_stat(f_stat)),
        p_value_model=StatValue(value=sanitize_float(p_model), formatted=format_p_value(p_model)),
        equation=eq_str,
        anova=anova_table,
        coefficients=coeffs,
        diagnostics=diag_summary,
        warnings=warnings,
        interpretation=interpretation,
    )

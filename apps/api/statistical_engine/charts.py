"""
Modul Kalkulasi Data Grafik Statistik (Statistical Charts Engine) — Statistika Pro
Menghitung agregasi matematis presisi untuk visualisasi:
1. Histogram (Bins, Frekuensi, Kurva Normal Fit)
2. Boxplot (Five-number summary, Whiskers, Outliers)
3. Scatter Plot (Titik Koordinat & Garis Regresi OLS Linear)
4. Bar Chart (Rerata / Frekuensi Kategori & Error Bar 95% CI)
5. Line Chart (Tren & Simpangan Baku)
6. Heatmap Korelasi (Matriks Korelasi & Signifikansi)
7. Q-Q Plot Residual (Kuantil Teoritis vs Kuantil Sampel)
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


def compute_histogram_data(
    dataset: Any,
    variable: str,
    bins_count: int = 10,
) -> Dict[str, Any]:
    """Menghitung bin histogram dan kurva normal fit teoritis."""
    var_map = {v.name: v for v in dataset.variables}
    if variable not in var_map:
        raise VariableNotFoundError(variable)

    missing_codes = set(str(m).strip() for m in (var_map[variable].missing or []))
    vals = []
    for r in dataset.rows:
        raw = r.get(variable)
        if raw is None or str(raw).strip() == "" or str(raw).lower() in ("nan", "none", "null") or str(raw).strip() in missing_codes:
            continue
        try:
            vals.append(float(raw))
        except (ValueError, TypeError):
            raise NonNumericDataError(variable)

    if len(vals) < 3:
        raise InsufficientDataError("Minimal 3 data numerik untuk histogram.")

    arr = np.array(vals)
    n = len(arr)
    mean_val = float(np.mean(arr))
    sd_val = float(np.std(arr, ddof=1))
    min_val = float(np.min(arr))
    max_val = float(np.max(arr))

    # Bins
    b_count = max(3, min(50, bins_count))
    counts, bin_edges = np.histogram(arr, bins=b_count)

    bins_data = []
    for i in range(len(counts)):
        b_start = float(bin_edges[i])
        b_end = float(bin_edges[i + 1])
        b_mid = (b_start + b_end) / 2.0
        bins_data.append({
            "bin_index": i,
            "range_label": f"{b_start:.2f} - {b_end:.2f}",
            "start": sanitize_float(b_start),
            "end": sanitize_float(b_end),
            "mid": sanitize_float(b_mid),
            "count": int(counts[i]),
            "percent": sanitize_float((counts[i] / n) * 100.0),
        })

    # Kurva Normal Fit
    normal_curve = []
    if sd_val > 0:
        x_pts = np.linspace(min_val, max_val, 60)
        bin_width = float(bin_edges[1] - bin_edges[0])
        # Skala kurva ke tinggi frekuensi: N * bin_width * pdf(x)
        for x_val in x_pts:
            pdf_y = stats.norm.pdf(x_val, loc=mean_val, scale=sd_val)
            expected_freq = n * bin_width * pdf_y
            normal_curve.append({
                "x": sanitize_float(float(x_val)),
                "y": sanitize_float(float(expected_freq)),
            })

    return {
        "chart_type": "histogram",
        "title": f"Histogram: {variable}",
        "variable": variable,
        "n": n,
        "mean": sanitize_float(mean_val),
        "sd": sanitize_float(sd_val),
        "min": sanitize_float(min_val),
        "max": sanitize_float(max_val),
        "bins": bins_data,
        "normal_curve": normal_curve,
    }


def compute_boxplot_data(
    dataset: Any,
    variable: str,
    grouping_variable: Optional[str] = None,
) -> Dict[str, Any]:
    """Menghitung ringkasan 5 angka, batas whisker Tukey 1.5x IQR, dan outliers."""
    var_map = {v.name: v for v in dataset.variables}
    if variable not in var_map:
        raise VariableNotFoundError(variable)

    missing_var = set(str(m).strip() for m in (var_map[variable].missing or []))
    missing_grp = set(str(m).strip() for m in (var_map[grouping_variable].missing or [])) if grouping_variable and grouping_variable in var_map else set()

    records = []
    for r in dataset.rows:
        raw_v = r.get(variable)
        if raw_v is None or str(raw_v).strip() == "" or str(raw_v).lower() in ("nan", "none", "null") or str(raw_v).strip() in missing_var:
            continue
        try:
            num_v = float(raw_v)
        except (ValueError, TypeError):
            raise NonNumericDataError(variable)

        grp_name = "Semua Data"
        if grouping_variable:
            raw_g = r.get(grouping_variable)
            if raw_g is None or str(raw_g).strip() == "" or str(raw_g).lower() in ("nan", "none", "null") or str(raw_g).strip() in missing_grp:
                continue
            grp_name = str(raw_g).strip()

        records.append({"val": num_v, "group": grp_name})

    if len(records) < 4:
        raise InsufficientDataError("Data tidak mencukupi untuk boxplot.")

    df_box = pd.DataFrame(records)
    groups = df_box["group"].unique().tolist()

    boxplots = []
    for g in groups:
        sub_arr = df_box[df_box["group"] == g]["val"].to_numpy()
        if len(sub_arr) < 2:
            continue
        sub_arr_sorted = np.sort(sub_arr)
        q1 = float(np.percentile(sub_arr_sorted, 25))
        median_val = float(np.median(sub_arr_sorted))
        q3 = float(np.percentile(sub_arr_sorted, 75))
        iqr = q3 - q1
        lower_threshold = q1 - 1.5 * iqr
        upper_threshold = q3 + 1.5 * iqr

        # Whiskers
        valid_low = sub_arr_sorted[sub_arr_sorted >= lower_threshold]
        valid_high = sub_arr_sorted[sub_arr_sorted <= upper_threshold]
        whisker_low = float(valid_low[0]) if len(valid_low) > 0 else float(sub_arr_sorted[0])
        whisker_high = float(valid_high[-1]) if len(valid_high) > 0 else float(sub_arr_sorted[-1])

        # Outliers
        outliers = [float(x) for x in sub_arr_sorted if x < lower_threshold or x > upper_threshold]

        boxplots.append({
            "group": g,
            "n": len(sub_arr),
            "min": sanitize_float(float(sub_arr_sorted[0])),
            "q1": sanitize_float(q1),
            "median": sanitize_float(median_val),
            "q3": sanitize_float(q3),
            "max": sanitize_float(float(sub_arr_sorted[-1])),
            "iqr": sanitize_float(iqr),
            "whisker_low": sanitize_float(whisker_low),
            "whisker_high": sanitize_float(whisker_high),
            "outliers": outliers,
        })

    return {
        "chart_type": "boxplot",
        "title": f"Boxplot: {variable}" + (f" menurut {grouping_variable}" if grouping_variable else ""),
        "variable": variable,
        "grouping_variable": grouping_variable,
        "boxplots": boxplots,
    }


def compute_scatter_data(
    dataset: Any,
    x_variable: str,
    y_variable: str,
    include_regression_line: bool = True,
) -> Dict[str, Any]:
    """Menghitung pasangan titik koordinat (x, y) dan garis regresi OLS linear."""
    var_map = {v.name: v for v in dataset.variables}
    if x_variable not in var_map:
        raise VariableNotFoundError(x_variable)
    if y_variable not in var_map:
        raise VariableNotFoundError(y_variable)

    missing_x = set(str(m).strip() for m in (var_map[x_variable].missing or []))
    missing_y = set(str(m).strip() for m in (var_map[y_variable].missing or []))

    points = []
    for r in dataset.rows:
        raw_x = r.get(x_variable)
        raw_y = r.get(y_variable)
        if raw_x is None or str(raw_x).strip() == "" or str(raw_x).lower() in ("nan", "none", "null") or str(raw_x).strip() in missing_x:
            continue
        if raw_y is None or str(raw_y).strip() == "" or str(raw_y).lower() in ("nan", "none", "null") or str(raw_y).strip() in missing_y:
            continue
        try:
            points.append((float(raw_x), float(raw_y)))
        except (ValueError, TypeError):
            raise NonNumericDataError(f"{x_variable} atau {y_variable}")

    if len(points) < 3:
        raise InsufficientDataError("Minimal 3 titik data valid untuk scatter plot.")

    x_arr = np.array([p[0] for p in points])
    y_arr = np.array([p[1] for p in points])

    # Regresi linear
    line_data = None
    if include_regression_line:
        slope, intercept, r_val, p_val, _ = stats.linregress(x_arr, y_arr)
        x_min, x_max = float(np.min(x_arr)), float(np.max(x_arr))
        line_data = {
            "slope": sanitize_float(float(slope)),
            "intercept": sanitize_float(float(intercept)),
            "r_squared": sanitize_float(float(r_val ** 2)),
            "p_value": sanitize_float(float(p_val)),
            "formula": f"Y = {intercept:.2f} + {slope:.2f}*X",
            "start": {"x": sanitize_float(x_min), "y": sanitize_float(float(intercept + slope * x_min))},
            "end": {"x": sanitize_float(x_max), "y": sanitize_float(float(intercept + slope * x_max))},
        }

    return {
        "chart_type": "scatter",
        "title": f"Scatter Plot: {x_variable} vs {y_variable}",
        "x_variable": x_variable,
        "y_variable": y_variable,
        "n": len(points),
        "points": [{"x": sanitize_float(p[0]), "y": sanitize_float(p[1])} for p in points],
        "regression_line": line_data,
    }


def compute_bar_chart_data(
    dataset: Any,
    category_variable: str,
    numeric_variable: Optional[str] = None,
    stat_type: str = "mean",  # 'mean', 'count', 'sum'
) -> Dict[str, Any]:
    """Menghitung grafik batang (Bar Chart) frekuensi atau rata-rata per kategori dengan error bar."""
    var_map = {v.name: v for v in dataset.variables}
    if category_variable not in var_map:
        raise VariableNotFoundError(category_variable)

    missing_cat = set(str(m).strip() for m in (var_map[category_variable].missing or []))
    missing_num = set(str(m).strip() for m in (var_map[numeric_variable].missing or [])) if numeric_variable and numeric_variable in var_map else set()

    records = []
    for r in dataset.rows:
        raw_c = r.get(category_variable)
        if raw_c is None or str(raw_c).strip() == "" or str(raw_c).lower() in ("nan", "none", "null") or str(raw_c).strip() in missing_cat:
            continue
        c_str = str(raw_c).strip()

        if numeric_variable:
            raw_n = r.get(numeric_variable)
            if raw_n is None or str(raw_n).strip() == "" or str(raw_n).lower() in ("nan", "none", "null") or str(raw_n).strip() in missing_num:
                continue
            try:
                num_val = float(raw_n)
            except (ValueError, TypeError):
                raise NonNumericDataError(numeric_variable)
            records.append((c_str, num_val))
        else:
            records.append((c_str, 1.0))

    if not records:
        raise InsufficientDataError("Tidak ada data valid untuk bar chart.")

    df_bar = pd.DataFrame(records, columns=["cat", "num"])
    grouped = df_bar.groupby("cat")

    bars = []
    for cat_name, grp in grouped:
        n_c = len(grp)
        vals_c = grp["num"].to_numpy()

        if numeric_variable and stat_type == "mean":
            m_val = float(np.mean(vals_c))
            sd_val = float(np.std(vals_c, ddof=1)) if n_c > 1 else 0.0
            se_val = sd_val / math.sqrt(n_c) if n_c > 1 else 0.0
            ci_val = se_val * 1.96
            bars.append({
                "category": cat_name,
                "value": sanitize_float(m_val),
                "count": n_c,
                "error_low": sanitize_float(max(0.0, m_val - ci_val)),
                "error_high": sanitize_float(m_val + ci_val),
                "sd": sanitize_float(sd_val),
            })
        elif numeric_variable and stat_type == "sum":
            s_val = float(np.sum(vals_c))
            bars.append({
                "category": cat_name,
                "value": sanitize_float(s_val),
                "count": n_c,
            })
        else:  # count
            bars.append({
                "category": cat_name,
                "value": n_c,
                "count": n_c,
            })

    return {
        "chart_type": "bar",
        "title": f"Bar Chart: {category_variable}" + (f" ({numeric_variable} - {stat_type})" if numeric_variable else " (Frekuensi)"),
        "category_variable": category_variable,
        "numeric_variable": numeric_variable,
        "stat_type": stat_type,
        "bars": bars,
    }


def compute_correlation_heatmap_data(
    dataset: Any,
    variables: List[str],
    method: str = "pearson",
) -> Dict[str, Any]:
    """Menghitung matriks korelasi dan matriks p-value untuk visualisasi heatmap."""
    if len(variables) < 2:
        raise InsufficientDataError("Pilih minimal 2 variabel untuk matriks korelasi.")

    var_map = {v.name: v for v in dataset.variables}
    for v in variables:
        if v not in var_map:
            raise VariableNotFoundError(v)

    missing_codes = {v: set(str(m).strip() for m in (var_map[v].missing or [])) for v in variables}

    rows_data = []
    for r in dataset.rows:
        row_vals = []
        is_ok = True
        for v in variables:
            raw = r.get(v)
            if raw is None or str(raw).strip() == "" or str(raw).lower() in ("nan", "none", "null") or str(raw).strip() in missing_codes[v]:
                is_ok = False
                break
            try:
                row_vals.append(float(raw))
            except (ValueError, TypeError):
                raise NonNumericDataError(v)
        if is_ok:
            rows_data.append(row_vals)

    if len(rows_data) < 3:
        raise InsufficientDataError("Data tidak mencukupi untuk matriks korelasi.")

    df_corr = pd.DataFrame(rows_data, columns=variables)
    k = len(variables)

    matrix = []
    for i in range(k):
        row_cells = []
        for j in range(k):
            v1, v2 = variables[i], variables[j]
            if i == j:
                r_val = 1.0
                p_val = 0.0
            else:
                x = df_corr[v1].to_numpy()
                y = df_corr[v2].to_numpy()
                if method == "spearman":
                    res = stats.spearmanr(x, y)
                else:
                    res = stats.pearsonr(x, y)
                r_val = float(res[0]) if not math.isnan(res[0]) else 0.0
                p_val = float(res[1]) if not math.isnan(res[1]) else 1.0

            row_cells.append({
                "var_x": v1,
                "var_y": v2,
                "r": sanitize_float(r_val),
                "p_value": sanitize_float(p_val),
            })
        matrix.append(row_cells)

    return {
        "chart_type": "heatmap",
        "title": f"Heatmap Korelasi ({method.title()})",
        "variables": variables,
        "method": method,
        "n": len(rows_data),
        "matrix": matrix,
    }


def compute_qq_plot_data(
    dataset: Any,
    variable: str,
) -> Dict[str, Any]:
    """Menghitung kuantil teoritis normal vs kuantil sampel untuk Q-Q Plot."""
    var_map = {v.name: v for v in dataset.variables}
    if variable not in var_map:
        raise VariableNotFoundError(variable)

    missing_codes = set(str(m).strip() for m in (var_map[variable].missing or []))
    vals = []
    for r in dataset.rows:
        raw = r.get(variable)
        if raw is None or str(raw).strip() == "" or str(raw).lower() in ("nan", "none", "null") or str(raw).strip() in missing_codes:
            continue
        try:
            vals.append(float(raw))
        except (ValueError, TypeError):
            raise NonNumericDataError(variable)

    if len(vals) < 4:
        raise InsufficientDataError("Minimal 4 data untuk Q-Q plot.")

    arr = np.array(vals)
    n = len(arr)
    # Standarisasi Z-score data sampel
    m = np.mean(arr)
    s = np.std(arr, ddof=1)
    if s == 0:
        raise InsufficientDataError("Varians data bernilai nol.")

    z_sample = np.sort((arr - m) / s)
    # Kuantil teoritis normal standar: P_i = (i - 0.5) / n
    prob_pts = [(i + 0.5) / n for i in range(n)]
    z_theoretical = [float(stats.norm.ppf(p)) for p in prob_pts]

    qq_points = [
        {
            "theoretical_quantile": sanitize_float(z_theoretical[i]),
            "sample_quantile": sanitize_float(float(z_sample[i])),
        }
        for i in range(n)
    ]

    min_q = min(min(z_theoretical), float(np.min(z_sample)))
    max_q = max(max(z_theoretical), float(np.max(z_sample)))

    return {
        "chart_type": "qq_plot",
        "title": f"Normal Q-Q Plot: {variable}",
        "variable": variable,
        "n": n,
        "points": qq_points,
        "reference_line": {
            "start": {"x": sanitize_float(min_q), "y": sanitize_float(min_q)},
            "end": {"x": sanitize_float(max_q), "y": sanitize_float(max_q)},
        },
    }

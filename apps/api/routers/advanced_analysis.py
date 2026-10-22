"""
Router Modul Statistik Lanjutan (Advanced Analysis) — Statistika Pro (Tahap 6)
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List

from services.dataset_service import DatasetService
from services.output_service import OutputService
from schemas.output import AnalysisOutputCreate
from schemas.advanced_analysis import (
    OneSampleTTestRequest,
    IndependentTTestRequest,
    PairedTTestRequest,
    AnovaRequest,
    MannWhitneyRequest,
    WilcoxonSignedRankRequest,
    KruskalWallisRequest,
    FriedmanRequest,
    KendallTauRequest,
    CrosstabsRequest,
    LogisticRegressionRequest,
    ChartRequest,
)
from statistical_engine.exceptions import (
    StatisticalEngineError,
    VariableNotFoundError,
    NonNumericDataError,
    InsufficientDataError,
)
from statistical_engine.t_tests import (
    one_sample_t_test,
    independent_t_test,
    paired_t_test,
)
from statistical_engine.anova import (
    one_way_anova,
)
from statistical_engine.nonparametric import (
    mann_whitney_u_test,
    wilcoxon_signed_rank_test,
    kruskal_wallis_test,
    friedman_test,
    kendall_tau_b,
)
from statistical_engine.crosstabs import (
    crosstabs_analysis,
)
from statistical_engine.logistic_regression import (
    binary_logistic_regression,
)
from statistical_engine.charts import (
    compute_histogram_data,
    compute_boxplot_data,
    compute_scatter_data,
    compute_bar_chart_data,
    compute_correlation_heatmap_data,
    compute_qq_plot_data,
)

router = APIRouter(prefix="/api/advanced-analysis", tags=["Advanced Statistics"])


def _get_dataset_or_404(dataset_id: str):
    ds = DatasetService.get_dataset(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail=f"Dataset dengan ID '{dataset_id}' tidak ditemukan.")
    return ds


def _save_to_output_viewer(dataset, analysis_type: str, title: str, res: Dict[str, Any]) -> str:
    """Helper untuk menyimpan hasil ke Output Viewer agar langsung terarsip."""
    try:
        saved = OutputService.create_output(
            AnalysisOutputCreate(
                title=title,
                analysis_type=analysis_type,
                dataset_id=dataset.id,
                dataset_name=dataset.name,
                dataset_updated_at=dataset.updated_at,
                results=res,
                interpretation=res.get("interpretation"),
            )
        )
        return saved.id
    except Exception:
        return ""


# ============================================================
# 1. MODUL UJI BEDA (T-TESTS)
# ============================================================

@router.post("/{dataset_id}/t-test/one-sample")
def api_one_sample_t_test(dataset_id: str, payload: OneSampleTTestRequest):
    ds = _get_dataset_or_404(dataset_id)
    try:
        res = one_sample_t_test(
            dataset=ds,
            variable=payload.variable,
            test_value=payload.test_value,
            confidence_level=payload.confidence_level,
        )
        out_id = _save_to_output_viewer(ds, "t_test", res["title"], res)
        res["output_id"] = out_id
        return res
    except (StatisticalEngineError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengeksekusi One-Sample t-test: {str(e)}")


@router.post("/{dataset_id}/t-test/independent")
def api_independent_t_test(dataset_id: str, payload: IndependentTTestRequest):
    ds = _get_dataset_or_404(dataset_id)
    try:
        res = independent_t_test(
            dataset=ds,
            test_variable=payload.test_variable,
            grouping_variable=payload.grouping_variable,
            group1_val=payload.group1_val,
            group2_val=payload.group2_val,
            confidence_level=payload.confidence_level,
        )
        out_id = _save_to_output_viewer(ds, "t_test", res["title"], res)
        res["output_id"] = out_id
        return res
    except (StatisticalEngineError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengeksekusi Independent Samples t-test: {str(e)}")


@router.post("/{dataset_id}/t-test/paired")
def api_paired_t_test(dataset_id: str, payload: PairedTTestRequest):
    ds = _get_dataset_or_404(dataset_id)
    try:
        res = paired_t_test(
            dataset=ds,
            variable1=payload.variable1,
            variable2=payload.variable2,
            confidence_level=payload.confidence_level,
        )
        out_id = _save_to_output_viewer(ds, "t_test", res["title"], res)
        res["output_id"] = out_id
        return res
    except (StatisticalEngineError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengeksekusi Paired Samples t-test: {str(e)}")


# ============================================================
# 2. MODUL ANOVA & POST-HOC
# ============================================================

@router.post("/{dataset_id}/anova/one-way")
def api_one_way_anova(dataset_id: str, payload: AnovaRequest):
    ds = _get_dataset_or_404(dataset_id)
    try:
        res = one_way_anova(
            dataset=ds,
            dependent_variable=payload.dependent_variable,
            factor_variable=payload.factor_variable,
            post_hoc=payload.post_hoc,
            confidence_level=payload.confidence_level,
        )
        out_id = _save_to_output_viewer(ds, "anova", res["title"], res)
        res["output_id"] = out_id
        return res
    except (StatisticalEngineError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengeksekusi One-Way ANOVA: {str(e)}")


# ============================================================
# 3. MODUL NONPARAMETRIK
# ============================================================

@router.post("/{dataset_id}/nonparametric/mann-whitney")
def api_mann_whitney(dataset_id: str, payload: MannWhitneyRequest):
    ds = _get_dataset_or_404(dataset_id)
    try:
        res = mann_whitney_u_test(
            dataset=ds,
            test_variable=payload.test_variable,
            grouping_variable=payload.grouping_variable,
            group1_val=payload.group1_val,
            group2_val=payload.group2_val,
        )
        out_id = _save_to_output_viewer(ds, "nonparametric", res["title"], res)
        res["output_id"] = out_id
        return res
    except (StatisticalEngineError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengeksekusi Mann-Whitney U test: {str(e)}")


@router.post("/{dataset_id}/nonparametric/wilcoxon")
def api_wilcoxon(dataset_id: str, payload: WilcoxonSignedRankRequest):
    ds = _get_dataset_or_404(dataset_id)
    try:
        res = wilcoxon_signed_rank_test(
            dataset=ds,
            variable1=payload.variable1,
            variable2=payload.variable2,
        )
        out_id = _save_to_output_viewer(ds, "nonparametric", res["title"], res)
        res["output_id"] = out_id
        return res
    except (StatisticalEngineError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengeksekusi Wilcoxon Signed-Rank test: {str(e)}")


@router.post("/{dataset_id}/nonparametric/kruskal-wallis")
def api_kruskal_wallis(dataset_id: str, payload: KruskalWallisRequest):
    ds = _get_dataset_or_404(dataset_id)
    try:
        res = kruskal_wallis_test(
            dataset=ds,
            dependent_variable=payload.dependent_variable,
            factor_variable=payload.factor_variable,
        )
        out_id = _save_to_output_viewer(ds, "nonparametric", res["title"], res)
        res["output_id"] = out_id
        return res
    except (StatisticalEngineError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengeksekusi Kruskal-Wallis test: {str(e)}")


@router.post("/{dataset_id}/nonparametric/friedman")
def api_friedman(dataset_id: str, payload: FriedmanRequest):
    ds = _get_dataset_or_404(dataset_id)
    try:
        res = friedman_test(
            dataset=ds,
            variables=payload.variables,
        )
        out_id = _save_to_output_viewer(ds, "nonparametric", res["title"], res)
        res["output_id"] = out_id
        return res
    except (StatisticalEngineError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengeksekusi Friedman test: {str(e)}")


@router.post("/{dataset_id}/nonparametric/kendall-tau")
def api_kendall_tau(dataset_id: str, payload: KendallTauRequest):
    ds = _get_dataset_or_404(dataset_id)
    try:
        res = kendall_tau_b(
            dataset=ds,
            variable1=payload.variable1,
            variable2=payload.variable2,
        )
        out_id = _save_to_output_viewer(ds, "nonparametric", res["title"], res)
        res["output_id"] = out_id
        return res
    except (StatisticalEngineError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengeksekusi Kendall's Tau-b: {str(e)}")


# ============================================================
# 4. MODUL CROSSTABS & CHI-SQUARE
# ============================================================

@router.post("/{dataset_id}/crosstabs")
def api_crosstabs(dataset_id: str, payload: CrosstabsRequest):
    ds = _get_dataset_or_404(dataset_id)
    try:
        res = crosstabs_analysis(
            dataset=ds,
            row_variable=payload.row_variable,
            column_variable=payload.column_variable,
        )
        out_id = _save_to_output_viewer(ds, "crosstabs", res["title"], res)
        res["output_id"] = out_id
        return res
    except (StatisticalEngineError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengeksekusi analisis Crosstabs: {str(e)}")


# ============================================================
# 5. MODUL REGRESI LOGISTIK BINER
# ============================================================

@router.post("/{dataset_id}/logistic-regression")
def api_logistic_regression(dataset_id: str, payload: LogisticRegressionRequest):
    ds = _get_dataset_or_404(dataset_id)
    try:
        res = binary_logistic_regression(
            dataset=ds,
            dependent_variable=payload.dependent_variable,
            independent_variables=payload.independent_variables,
            categorical_variables=payload.categorical_variables,
            reference_category=payload.reference_category,
            cutoff=payload.cutoff,
        )
        out_id = _save_to_output_viewer(ds, "logistic_regression", res["title"], res)
        res["output_id"] = out_id
        return res
    except (StatisticalEngineError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengeksekusi Regresi Logistik Biner: {str(e)}")


# ============================================================
# 6. MODUL VISUALISASI GRAFIK STATISTIK
# ============================================================

@router.post("/{dataset_id}/charts")
def api_compute_chart(dataset_id: str, payload: ChartRequest):
    ds = _get_dataset_or_404(dataset_id)
    t = payload.chart_type.lower()
    try:
        if t == "histogram":
            if not payload.variable:
                raise ValueError("Variabel untuk histogram belum ditentukan.")
            return compute_histogram_data(ds, payload.variable, bins_count=payload.bins_count)
        elif t == "boxplot":
            if not payload.variable:
                raise ValueError("Variabel untuk boxplot belum ditentukan.")
            return compute_boxplot_data(ds, payload.variable, grouping_variable=payload.category_variable)
        elif t == "scatter":
            if not payload.x_variable or not payload.y_variable:
                raise ValueError("Variabel X dan Y untuk scatter plot belum ditentukan.")
            return compute_scatter_data(ds, payload.x_variable, payload.y_variable, include_regression_line=payload.include_regression_line)
        elif t == "bar":
            if not payload.category_variable:
                raise ValueError("Variabel kategori untuk bar chart belum ditentukan.")
            return compute_bar_chart_data(ds, payload.category_variable, numeric_variable=payload.numeric_variable, stat_type=payload.stat_type)
        elif t == "heatmap":
            vars_list = payload.variables or []
            if len(vars_list) < 2:
                raise ValueError("Pilih minimal 2 variabel numerik untuk heatmap korelasi.")
            return compute_correlation_heatmap_data(ds, vars_list, method=payload.method)
        elif t == "qq_plot":
            if not payload.variable:
                raise ValueError("Variabel untuk Q-Q plot belum ditentukan.")
            return compute_qq_plot_data(ds, payload.variable)
        else:
            raise HTTPException(status_code=400, detail=f"Tipe grafik '{payload.chart_type}' tidak didukung.")
    except (StatisticalEngineError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses data grafik: {str(e)}")

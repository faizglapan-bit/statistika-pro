from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from services.dataset_service import DatasetService
from statistical_engine.schemas import (
    DescriptiveRequest,
    DescriptiveResponse,
    ValidityRequest,
    ValidityResponse,
    ReliabilityRequest,
    ReliabilityResponse,
    CorrelationRequest,
    CorrelationResponse,
    RegressionRequest,
    RegressionResponse,
    DiagnosticsRequest,
    DiagnosticsSummary,
)
from statistical_engine.exceptions import StatisticalEngineError
from statistical_engine.descriptive import calculate_descriptive
from statistical_engine.validity import calculate_validity
from statistical_engine.reliability import calculate_reliability
from statistical_engine.correlation import calculate_correlation
from statistical_engine.regression import calculate_regression
from statistical_engine.diagnostics import compute_diagnostics
from statistical_engine.common import extract_numeric_data

router = APIRouter(prefix="/api/analysis", tags=["Statistical Analysis"])


def _get_dataset_or_404(dataset_id: str):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset dengan ID '{dataset_id}' tidak ditemukan.")
    return dataset


@router.post("/descriptive", response_model=DescriptiveResponse, summary="Analisis Statistik Deskriptif")
async def descriptive_analysis(payload: DescriptiveRequest) -> DescriptiveResponse:
    dataset = _get_dataset_or_404(payload.dataset_id)
    try:
        return calculate_descriptive(dataset, payload.variables)
    except StatisticalEngineError as e:
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan saat menghitung deskriptif: {str(e)}")


@router.post("/validity", response_model=ValidityResponse, summary="Uji Validitas Item (Item-Total Correlation)")
async def validity_analysis(payload: ValidityRequest) -> ValidityResponse:
    dataset = _get_dataset_or_404(payload.dataset_id)
    try:
        return calculate_validity(dataset, payload.items, method=payload.method, score_type=payload.score_type)
    except StatisticalEngineError as e:
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan saat menghitung validitas item: {str(e)}")


@router.post("/reliability", response_model=ReliabilityResponse, summary="Uji Reliabilitas Cronbach's Alpha")
async def reliability_analysis(payload: ReliabilityRequest) -> ReliabilityResponse:
    dataset = _get_dataset_or_404(payload.dataset_id)
    try:
        return calculate_reliability(dataset, payload.items)
    except StatisticalEngineError as e:
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan saat menghitung reliabilitas: {str(e)}")


@router.post("/correlation", response_model=CorrelationResponse, summary="Analisis Korelasi (Pearson / Spearman)")
async def correlation_analysis(payload: CorrelationRequest) -> CorrelationResponse:
    dataset = _get_dataset_or_404(payload.dataset_id)
    try:
        return calculate_correlation(dataset, payload.variables, method=payload.method, missing_policy=payload.missing_policy)
    except StatisticalEngineError as e:
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan saat menghitung korelasi: {str(e)}")


@router.post("/regression", response_model=RegressionResponse, summary="Regresi Linear OLS & Diagnostik Asumsi")
async def regression_analysis(payload: RegressionRequest) -> RegressionResponse:
    dataset = _get_dataset_or_404(payload.dataset_id)
    try:
        return calculate_regression(
            dataset,
            dependent_var=payload.dependent_variable,
            independent_vars=payload.independent_variables,
            include_intercept=payload.include_intercept,
            include_diagnostics=payload.include_diagnostics,
            confidence_level=payload.confidence_level,
            robust_se=payload.robust_se,
        )
    except StatisticalEngineError as e:
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan saat mengestimasi regresi: {str(e)}")


@router.post("/diagnostics", response_model=DiagnosticsSummary, summary="Diagnostik Asumsi Regresi Mandiri")
async def diagnostics_analysis(payload: DiagnosticsRequest) -> DiagnosticsSummary:
    dataset = _get_dataset_or_404(payload.dataset_id)
    all_vars = [payload.dependent_variable] + payload.independent_variables
    try:
        import statsmodels.api as sm
        df, meta = extract_numeric_data(dataset, all_vars, missing_policy="listwise", min_required_rows=len(payload.independent_variables) + 2)
        y = df[payload.dependent_variable].to_numpy(dtype=float)
        X_df = df[payload.independent_variables]
        X_mat = sm.add_constant(X_df) if payload.include_intercept else X_df
        fit_res = sm.OLS(y, X_mat).fit()

        return compute_diagnostics(
            y=y,
            X=X_df,
            residuals=fit_res.resid,
            predictor_names=payload.independent_variables,
        )
    except StatisticalEngineError as e:
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan saat menghitung diagnostik: {str(e)}")

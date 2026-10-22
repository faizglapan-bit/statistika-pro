from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal


# ============================================================================
# Reusable Metric Schema
# ============================================================================

class StatValue(BaseModel):
    value: Optional[float] = None
    formatted: str = "—"
    note: Optional[str] = None


# ============================================================================
# Request Schemas
# ============================================================================

class DescriptiveRequest(BaseModel):
    dataset_id: str
    variables: List[str] = Field(min_length=1)


class ValidityRequest(BaseModel):
    dataset_id: str
    items: List[str] = Field(min_length=2)
    method: Literal["pearson", "spearman"] = "pearson"
    score_type: Literal["sum", "mean"] = "sum"


class ReliabilityRequest(BaseModel):
    dataset_id: str
    items: List[str] = Field(min_length=2)


class CorrelationRequest(BaseModel):
    dataset_id: str
    variables: List[str] = Field(min_length=2)
    method: Literal["pearson", "spearman"] = "pearson"
    missing_policy: Literal["pairwise", "listwise"] = "pairwise"


class RegressionRequest(BaseModel):
    dataset_id: str
    dependent_variable: str
    independent_variables: List[str] = Field(min_length=1)
    include_intercept: bool = True
    include_diagnostics: bool = True
    confidence_level: float = Field(default=0.95, ge=0.5, le=0.999)
    robust_se: Optional[Literal["HC3", "HC1"]] = None


class DiagnosticsRequest(BaseModel):
    dataset_id: str
    dependent_variable: str
    independent_variables: List[str] = Field(min_length=1)
    include_intercept: bool = True


# ============================================================================
# Response Schemas
# ============================================================================

# 1. Descriptive
class DescriptiveVariableResult(BaseModel):
    name: str
    n_valid: int
    n_missing: int
    mean: StatValue
    median: StatValue
    mode: StatValue
    min: StatValue
    max: StatValue
    range: StatValue
    variance: StatValue
    std_dev: StatValue
    sem: StatValue
    skewness: StatValue
    kurtosis: StatValue
    warnings: List[str] = Field(default_factory=list)


class DescriptiveResponse(BaseModel):
    analysis_type: Literal["descriptive"] = "descriptive"
    dataset_id: str
    dataset_name: str
    sample_size: int
    results: List[DescriptiveVariableResult]
    warnings: List[str] = Field(default_factory=list)


# 2. Validity
class ValidityItemResult(BaseModel):
    item: str
    r_total: StatValue
    r_corrected: StatValue
    p_value: StatValue
    n_valid: int
    is_valid: bool
    notes: Optional[str] = None


class ValidityResponse(BaseModel):
    analysis_type: Literal["validity"] = "validity"
    dataset_id: str
    dataset_name: str
    method: str
    score_type: str
    sample_size: int
    items: List[ValidityItemResult]
    warnings: List[str] = Field(default_factory=list)
    interpretation: str


# 3. Reliability
class ReliabilityItemDeletedResult(BaseModel):
    item: str
    scale_mean_if_deleted: StatValue
    scale_var_if_deleted: StatValue
    corrected_item_total_corr: StatValue
    alpha_if_deleted: StatValue


class ReliabilityResponse(BaseModel):
    analysis_type: Literal["reliability"] = "reliability"
    dataset_id: str
    dataset_name: str
    cronbach_alpha: StatValue
    item_count: int
    sample_size: int
    item_variances: Dict[str, StatValue]
    total_variance: StatValue
    item_deleted_stats: List[ReliabilityItemDeletedResult]
    interpretation: str
    warnings: List[str] = Field(default_factory=list)


# 4. Correlation
class CorrelationCell(BaseModel):
    var1: str
    var2: str
    correlation: StatValue
    p_value: StatValue
    n_pairs: int
    significance_star: str = ""


class CorrelationResponse(BaseModel):
    analysis_type: Literal["correlation"] = "correlation"
    dataset_id: str
    dataset_name: str
    method: str
    missing_policy: str
    variables: List[str]
    matrix: List[CorrelationCell]
    warnings: List[str] = Field(default_factory=list)


# 5. Regression & Diagnostics
class RegressionCoefficient(BaseModel):
    variable: str
    b: StatValue
    std_error: StatValue
    beta: StatValue
    t: StatValue
    p_value: StatValue
    ci_lower: StatValue
    ci_upper: StatValue


class AnovaRow(BaseModel):
    source: str
    sum_of_squares: StatValue
    df: int
    mean_square: StatValue
    f: StatValue
    p_value: StatValue


class DiagnosticsSummary(BaseModel):
    shapiro_wilk: Dict[str, StatValue]
    breusch_pagan: Dict[str, StatValue]
    glejser: List[Dict[str, Any]]
    vif: Dict[str, StatValue]
    durbin_watson: StatValue
    warnings: List[str] = Field(default_factory=list)
    interpretation: str


class RegressionResponse(BaseModel):
    analysis_type: Literal["regression"] = "regression"
    dataset_id: str
    dataset_name: str
    dependent_variable: str
    independent_variables: List[str]
    sample_size: int
    r: StatValue
    r_squared: StatValue
    adj_r_squared: StatValue
    std_error_estimate: StatValue
    f_stat: StatValue
    p_value_model: StatValue
    equation: str
    anova: List[AnovaRow]
    coefficients: List[RegressionCoefficient]
    diagnostics: Optional[DiagnosticsSummary] = None
    warnings: List[str] = Field(default_factory=list)
    interpretation: str

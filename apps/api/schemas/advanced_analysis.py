"""
Skema Pydantic untuk Modul Statistik Lanjutan (Tahap 6)
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class OneSampleTTestRequest(BaseModel):
    variable: str
    test_value: float = 0.0
    confidence_level: float = Field(0.95, ge=0.5, le=0.999)


class IndependentTTestRequest(BaseModel):
    test_variable: str
    grouping_variable: str
    group1_val: Optional[Any] = None
    group2_val: Optional[Any] = None
    confidence_level: float = Field(0.95, ge=0.5, le=0.999)


class PairedTTestRequest(BaseModel):
    variable1: str
    variable2: str
    confidence_level: float = Field(0.95, ge=0.5, le=0.999)


class AnovaRequest(BaseModel):
    dependent_variable: str
    factor_variable: str
    post_hoc: str = Field("auto", description="'auto', 'tukey', 'games-howell', 'none'")
    confidence_level: float = Field(0.95, ge=0.5, le=0.999)


class MannWhitneyRequest(BaseModel):
    test_variable: str
    grouping_variable: str
    group1_val: Optional[Any] = None
    group2_val: Optional[Any] = None


class WilcoxonSignedRankRequest(BaseModel):
    variable1: str
    variable2: str


class KruskalWallisRequest(BaseModel):
    dependent_variable: str
    factor_variable: str


class FriedmanRequest(BaseModel):
    variables: List[str]


class KendallTauRequest(BaseModel):
    variable1: str
    variable2: str


class CrosstabsRequest(BaseModel):
    row_variable: str
    column_variable: str


class LogisticRegressionRequest(BaseModel):
    dependent_variable: str
    independent_variables: List[str]
    categorical_variables: Optional[List[str]] = Field(default_factory=list)
    reference_category: str = Field("last", description="'first' or 'last'")
    cutoff: float = Field(0.5, ge=0.01, le=0.99)


class ChartRequest(BaseModel):
    chart_type: str  # 'histogram', 'boxplot', 'scatter', 'bar', 'heatmap', 'qq_plot'
    variable: Optional[str] = None
    x_variable: Optional[str] = None
    y_variable: Optional[str] = None
    category_variable: Optional[str] = None
    numeric_variable: Optional[str] = None
    variables: Optional[List[str]] = None
    bins_count: int = Field(10, ge=3, le=50)
    include_regression_line: bool = True
    stat_type: str = Field("mean", description="'mean', 'count', 'sum'")
    method: str = Field("pearson", description="'pearson', 'spearman'")

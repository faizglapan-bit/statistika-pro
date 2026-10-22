from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal


class AnalysisOutputMetadata(BaseModel):
    id: str
    title: str
    analysis_type: Literal["descriptive", "validity", "reliability", "correlation", "regression", "diagnostics"]
    dataset_id: str
    dataset_name: str
    dataset_updated_at: Optional[str] = None
    sample_size: int
    variables: List[str]
    created_at: str


class AnalysisOutputCreate(BaseModel):
    title: str
    analysis_type: Literal["descriptive", "validity", "reliability", "correlation", "regression", "diagnostics"]
    dataset_id: str
    dataset_name: str
    dataset_updated_at: Optional[str] = None
    sample_size: int
    variables: List[str]
    parameters: Dict[str, Any] = Field(default_factory=dict)
    results: Dict[str, Any]
    warnings: List[str] = Field(default_factory=list)
    interpretation: Optional[str] = None


class AnalysisOutput(AnalysisOutputCreate):
    id: str
    created_at: str

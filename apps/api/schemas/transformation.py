from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field


class ComputeVariableRequest(BaseModel):
    target_variable: str = Field(..., description="Nama variabel hasil baru")
    target_label: Optional[str] = Field(None, description="Label variabel hasil")
    expression: str = Field(..., description="Ekspresi matematika/kondisional")
    preview_only: bool = Field(False, description="Jika true, hanya tampilkan pratinjau tanpa menyimpan")
    save_as_new_dataset: bool = Field(False, description="Simpan hasil sebagai dataset baru")
    new_dataset_name: Optional[str] = Field(None, description="Nama dataset baru jika disimpan terpisah")


class RecodeRule(BaseModel):
    rule_type: str = Field(..., description="'single', 'range', 'lowest_thru', 'thru_highest', 'else'")
    old_value: Optional[Union[float, int, str]] = None
    range_min: Optional[float] = None
    range_max: Optional[float] = None
    new_value: Optional[Union[float, int, str]] = None
    is_missing: bool = False


class RecodeVariableRequest(BaseModel):
    source_variable: str
    target_variable: str
    target_label: Optional[str] = None
    target_type: str = Field("numeric", description="'numeric' atau 'string'")
    rules: List[RecodeRule]
    preview_only: bool = False
    save_as_new_dataset: bool = False
    new_dataset_name: Optional[str] = None


class ReverseScoreRequest(BaseModel):
    source_variables: List[str]
    scale_min: float = 1.0
    scale_max: float = 5.0
    target_prefix: str = "REV_"
    preview_only: bool = False
    save_as_new_dataset: bool = False
    new_dataset_name: Optional[str] = None


class CompositeScoreRequest(BaseModel):
    target_variable: str
    target_label: Optional[str] = None
    source_variables: List[str]
    method: str = Field("mean", description="'mean' atau 'sum'")
    min_valid_items: Optional[int] = Field(None, description="Jumlah minimum item valid yang wajib ada")
    min_valid_percent: Optional[float] = Field(None, description="Persentase minimum item valid (0 - 100)")
    preview_only: bool = False
    save_as_new_dataset: bool = False
    new_dataset_name: Optional[str] = None


class StandardizeRequest(BaseModel):
    source_variables: List[str]
    target_prefix: str = "Z_"
    preview_only: bool = False
    save_as_new_dataset: bool = False
    new_dataset_name: Optional[str] = None


class CategorizeRequest(BaseModel):
    source_variable: str
    target_variable: str
    target_label: Optional[str] = None
    method: str = Field("cutpoints", description="'cutpoints', 'equal_intervals', 'percentiles'")
    intervals_count: Optional[int] = 3
    cutpoints: Optional[List[float]] = None
    category_labels: Optional[List[str]] = None
    preview_only: bool = False
    save_as_new_dataset: bool = False
    new_dataset_name: Optional[str] = None


class TransformationPreviewResponse(BaseModel):
    target_variable: str
    preview_rows: List[Dict[str, Any]]
    valid_count: int
    missing_count: int
    warnings: List[str] = []
    summary_stats: Optional[Dict[str, Any]] = None


class TransformationApplyResponse(BaseModel):
    success: bool
    message: str
    operation_id: str
    dataset_id: str
    version_id: str
    affected_rows: int
    new_variables: List[str]
    warnings: List[str] = []
    new_dataset_id: Optional[str] = None

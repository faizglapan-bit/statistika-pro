from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class FilterCasesRequest(BaseModel):
    condition_expression: str = Field(..., description="Ekspresi logika filter, contoh: UMUR >= 18 AND STATUS == 'Aktif'")
    mode: str = Field("temporary", description="'temporary' (hanya flag tampilan) atau 'new_dataset'")
    new_dataset_name: Optional[str] = None


class FilterCasesResponse(BaseModel):
    total_cases: int
    matched_cases: int
    excluded_cases: int
    matched_row_ids: List[Any]
    new_dataset_id: Optional[str] = None
    warnings: List[str] = []


class SortVariable(BaseModel):
    name: str
    ascending: bool = True


class SortCasesRequest(BaseModel):
    sort_variables: List[SortVariable]
    save_as_new_dataset: bool = False
    new_dataset_name: Optional[str] = None


class DuplicateDetectionRequest(BaseModel):
    key_variables: List[str]
    keep: str = Field("first", description="'first', 'last', 'none'")


class DuplicateDetectionResponse(BaseModel):
    total_rows: int
    duplicate_rows_count: int
    unique_rows_count: int
    duplicate_row_indices: List[int]
    sample_duplicate_groups: List[Dict[str, Any]] = []


class RemoveDuplicatesRequest(BaseModel):
    key_variables: List[str]
    keep: str = Field("first", description="'first', 'last'")
    save_as_new_dataset: bool = False
    new_dataset_name: Optional[str] = None


class VariableMissingDetail(BaseModel):
    variable_name: str
    variable_label: Optional[str] = None
    total_count: int
    valid_count: int
    missing_count: int
    missing_percentage: float


class MissingSummaryResponse(BaseModel):
    total_rows: int
    total_columns: int
    total_cells: int
    total_missing_cells: int
    overall_missing_percentage: float
    rows_with_any_missing_count: int
    rows_with_any_missing_percentage: float
    variables: List[VariableMissingDetail]
    patterns_summary: List[Dict[str, Any]] = []

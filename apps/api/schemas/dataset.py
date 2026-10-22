from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional, Literal
import re

VariableType = Literal["numeric", "string", "boolean"]
VariableMeasure = Literal["nominal", "ordinal", "scale"]


def sanitize_var_name(name: str) -> str:
    """Bersihkan dan validasi nama variabel agar valid seperti SPSS."""
    clean = re.sub(r"[^\w]", "_", name.strip())
    if not clean or clean[0].isdigit():
        clean = "V_" + clean
    return clean[:64]


class VariableDefinition(BaseModel):
    name: str
    type: VariableType = "numeric"
    width: int = Field(default=8, ge=1, le=255)
    decimals: int = Field(default=2, ge=0, le=16)
    label: str = ""
    values: Dict[str, str] = Field(default_factory=dict)
    missing: List[str] = Field(default_factory=list)
    measure: VariableMeasure = "scale"

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Nama variabel tidak boleh kosong")
        # SPSS variable naming: alfanumerik + underscore
        if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", s):
            raise ValueError("Nama variabel harus diawali huruf/underscore dan hanya memuat alfanumerik")
        return s

    @field_validator("decimals")
    @classmethod
    def validate_decimals(cls, v: int, info) -> int:
        if info.data.get("type") == "string":
            return 0
        return v


class DatasetMetadata(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    row_count: int
    variable_count: int
    missing_count: int
    is_demo: bool = False
    created_at: str
    updated_at: str


class Dataset(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    variables: List[VariableDefinition]
    rows: List[Dict[str, Any]]
    is_demo: bool = False
    created_at: str
    updated_at: str


class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    variables: Optional[List[VariableDefinition]] = None
    rows: Optional[List[Dict[str, Any]]] = None


class DatasetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    variables: Optional[List[VariableDefinition]] = None
    rows: Optional[List[Dict[str, Any]]] = None


class ColumnPreview(BaseModel):
    name: str
    original_name: str
    detected_type: VariableType
    detected_measure: VariableMeasure
    missing_count: int
    sample_values: List[Any]


class ImportPreviewResponse(BaseModel):
    filename: str
    file_format: str
    sheet_names: List[str] = Field(default_factory=list)
    selected_sheet: Optional[str] = None
    delimiter: Optional[str] = None
    has_headers: bool = True
    total_rows: int
    total_columns: int
    columns: List[ColumnPreview]
    preview_rows: List[Dict[str, Any]]
    warnings: List[str] = Field(default_factory=list)


class ImportCommitRequest(BaseModel):
    name: str
    target_dataset_id: Optional[str] = None  # None = buat baru, ID = ganti dataset saat ini
    variables: List[VariableDefinition]
    rows: List[Dict[str, Any]]

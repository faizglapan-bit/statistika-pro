from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from schemas.dataset import Dataset, DatasetUpdate


class ProjectMetadata(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    active_dataset_id: Optional[str] = None
    dataset_name: Optional[str] = None
    row_count: int = 0
    variable_count: int = 0
    output_count: int = 0
    created_at: str
    updated_at: str


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150, description="Nama proyek penelitian")
    description: Optional[str] = Field("", max_length=1000, description="Deskripsi proyek opsional")
    dataset_id: Optional[str] = Field(None, description="ID dataset yang akan ditautkan atau disalin ke proyek")


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    active_dataset_id: Optional[str] = None
    dataset: Optional[DatasetUpdate] = None


class ProjectDetail(BaseModel):
    id: str
    name: str
    description: str = ""
    active_dataset_id: Optional[str] = None
    dataset: Optional[Dataset] = None
    outputs: List[Dict[str, Any]] = []
    audit_log: List[Dict[str, Any]] = []
    created_at: str
    updated_at: str


class StatProManifest(BaseModel):
    format_version: str = "1.0.0"
    app_version: str = "1.0.0-alpha"
    project_id: str
    project_name: str
    exported_at: str

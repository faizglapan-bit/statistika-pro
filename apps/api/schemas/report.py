from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ReportMetadata(BaseModel):
    title: Optional[str] = "Laporan Analisis Statistik"
    researcher: Optional[str] = None
    institution: Optional[str] = None
    period: Optional[str] = None
    notes: Optional[str] = None


class ReportSectionChoice(BaseModel):
    section_id: str
    included: bool = True
    custom_title: Optional[str] = None


class ReportGenerateRequest(BaseModel):
    dataset_id: Optional[str] = None
    metadata: ReportMetadata = Field(default_factory=ReportMetadata)
    sections: List[str] = Field(
        default_factory=lambda: [
            "info_penelitian",
            "info_dataset",
            "kamus_variabel",
            "deskriptif",
            "reliabilitas",
            "validitas",
            "korelasi",
            "regresi",
            "anova",
            "diagnostik",
            "interpretasi",
            "lampiran",
        ]
    )
    format: str = Field("pdf", description="'pdf', 'docx', 'xlsx'")
    include_transformation_history: bool = True


class AvailableSectionsResponse(BaseModel):
    dataset_id: str
    dataset_name: str
    sections: List[Dict[str, Any]]

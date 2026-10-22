import io
import pytest
from report_generator import build_pdf_report, build_docx_report, build_xlsx_report


@pytest.fixture
def dummy_report_data():
    return {
        "metadata": {
            "title": "Laporan Penelitian Pengaruh Motivasi terhadap Kinerja",
            "researcher": "Dr. Antigravity",
            "institution": "Universitas Riset Indonesia",
            "period": "Semester Ganjil 2026",
            "notes": "Sampel acak terstratifikasi",
        },
        "dataset": {
            "id": "ds-1",
            "name": "Dataset Kuesioner SDM",
            "variables": [
                {"name": "ID", "label": "No Responden", "type": "numeric", "measure": "nominal", "missing": []},
                {"name": "X1", "label": "Motivasi", "type": "numeric", "measure": "scale", "missing": []},
                {"name": "Y", "label": "Kinerja", "type": "numeric", "measure": "scale", "missing": []},
            ],
            "rows": [
                {"id": 1, "ID": 1, "X1": 4.5, "Y": 4.2},
                {"id": 2, "ID": 2, "X1": 3.8, "Y": 4.0},
                {"id": 3, "ID": 3, "X1": 4.0, "Y": 3.9},
            ],
            "updated_at": "2026-10-21T00:00:00Z",
        },
        "selected_sections": ["info_penelitian", "info_dataset", "kamus_variabel", "deskriptif", "regresi"],
        "histories": [
            {
                "timestamp": "2026-10-21T01:00:00Z",
                "operation_type": "Compute Variable",
                "description": "TOTAL_X = Q1 + Q2",
                "affected_rows": 3,
                "source_vars": ["Q1", "Q2"],
                "target_vars": ["TOTAL_X"],
            }
        ],
        "analysis_map": {
            "descriptive": [
                type(
                    "DummyOutput",
                    (),
                    {
                        "title": "Deskriptif Variabel X1 dan Y",
                        "dataset_updated_at": "2026-10-21T00:00:00Z",
                        "interpretation": "Rata-rata variabel X1 sebesar 4.10 menunjukkan motivasi tinggi.",
                        "results": {
                            "statistics": [
                                {"Variabel": "X1", "N": 3, "Mean": 4.10, "Std": 0.36, "Min": 3.8, "Max": 4.5},
                                {"Variabel": "Y", "N": 3, "Mean": 4.03, "Std": 0.15, "Min": 3.9, "Max": 4.2},
                            ]
                        },
                    },
                )()
            ],
            "regression": [],
            "reliability": [],
            "validity": [],
            "correlation": [],
            "diagnostics": [],
        },
    }


def test_pdf_report_generation(dummy_report_data):
    pdf_buf = build_pdf_report(dummy_report_data)
    assert isinstance(pdf_buf, io.BytesIO)
    content = pdf_buf.getvalue()
    assert len(content) > 1000
    assert content.startswith(b"%PDF")  # Valid PDF signature


def test_docx_report_generation(dummy_report_data):
    docx_buf = build_docx_report(dummy_report_data)
    assert isinstance(docx_buf, io.BytesIO)
    content = docx_buf.getvalue()
    assert len(content) > 1000
    # ZIP signature for docx
    assert content.startswith(b"PK\x03\x04")


def test_xlsx_report_generation(dummy_report_data):
    xlsx_buf = build_xlsx_report(dummy_report_data)
    assert isinstance(xlsx_buf, io.BytesIO)
    content = xlsx_buf.getvalue()
    assert len(content) > 1000
    # ZIP signature for xlsx
    assert content.startswith(b"PK\x03\x04")

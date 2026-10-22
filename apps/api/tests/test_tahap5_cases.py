import pytest
from services.case_service import CaseService
from schemas.case import SortVariable
from schemas.dataset import Dataset, VariableDefinition


def test_sort_cases():
    rows = [
        {"id": 1, "group": "B", "score": 80},
        {"id": 2, "group": "A", "score": 90},
        {"id": 3, "group": "A", "score": 70},
        {"id": 4, "group": "B", "score": None},
    ]
    # Urutkan berdasarkan group Ascending, lalu score Descending
    sorted_rows = CaseService.sort_cases(
        rows,
        [SortVariable(name="group", ascending=True), SortVariable(name="score", ascending=False)],
    )
    assert sorted_rows[0]["id"] == 2  # A, 90
    assert sorted_rows[1]["id"] == 3  # A, 70
    assert sorted_rows[2]["id"] == 1  # B, 80
    assert sorted_rows[3]["id"] == 4  # B, None (di akhir)


def test_filter_cases():
    rows = [
        {"id": 101, "age": 22, "status": "aktif"},
        {"id": 102, "age": 17, "status": "aktif"},
        {"id": 103, "age": 25, "status": "nonaktif"},
    ]
    matched, matched_ids, warns = CaseService.filter_cases(
        rows,
        ["age", "status"],
        "age >= 18 and status == 'aktif'",
    )
    assert len(matched) == 1
    assert matched_ids == [101]


def test_duplicate_detection_and_removal():
    rows = [
        {"id": 1, "NIK": "123", "nama": "Budi"},
        {"id": 2, "NIK": "456", "nama": "Siti"},
        {"id": 3, "NIK": "123", "nama": "Budi Kloning"},
    ]
    detection = CaseService.detect_duplicates(rows, ["NIK"], keep="first")
    assert detection.total_rows == 3
    assert detection.duplicate_rows_count == 1
    assert detection.unique_rows_count == 2
    assert detection.duplicate_row_indices == [2]

    # Hapus duplikat
    clean = CaseService.remove_duplicates(rows, ["NIK"], keep="first")
    assert len(clean) == 2
    assert [r["NIK"] for r in clean] == ["123", "456"]


def test_missing_summary():
    dataset = Dataset(
        id="test-ds",
        name="Test DS",
        variables=[
            VariableDefinition(name="VAR1", type="numeric"),
            VariableDefinition(name="VAR2", type="numeric"),
        ],
        rows=[
            {"id": 1, "VAR1": 10, "VAR2": 20},
            {"id": 2, "VAR1": None, "VAR2": 20},
            {"id": 3, "VAR1": None, "VAR2": None},
        ],
        created_at="2026-01-01T00:00:00Z",
        updated_at="2026-01-01T00:00:00Z",
    )
    summary = CaseService.summarize_missing(dataset)
    assert summary.total_rows == 3
    assert summary.total_columns == 2
    assert summary.total_cells == 6
    assert summary.total_missing_cells == 3
    assert summary.rows_with_any_missing_count == 2
    assert summary.variables[0].missing_count == 2
    assert summary.variables[1].missing_count == 1

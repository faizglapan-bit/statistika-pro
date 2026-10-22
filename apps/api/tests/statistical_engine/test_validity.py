import pytest
from types import SimpleNamespace

from statistical_engine.validity import calculate_validity
from schemas.dataset import VariableDefinition


def _make_mock_dataset(var_names, rows_data):
    variables = [
        VariableDefinition(name=v, type="numeric", width=8, decimals=2, label=v, measure="scale")
        for v in var_names
    ]
    rows = [{"id": i + 1, **row} for i, row in enumerate(rows_data)]
    return SimpleNamespace(id="mock-validity", name="Mock Validity Dataset", variables=variables, rows=rows)


def test_validity_item_total_and_corrected():
    """Uji korelasi item-total dan corrected item-total correlation."""
    # Data kuesioner konsisten: responden skor tinggi di semua item
    raw_data = [
        {"Q1": 5, "Q2": 5, "Q3": 4},
        {"Q1": 4, "Q2": 4, "Q3": 5},
        {"Q1": 3, "Q2": 3, "Q3": 3},
        {"Q1": 2, "Q2": 2, "Q3": 2},
        {"Q1": 1, "Q2": 1, "Q3": 1},
    ]
    ds = _make_mock_dataset(["Q1", "Q2", "Q3"], raw_data)

    res = calculate_validity(ds, ["Q1", "Q2", "Q3"])
    assert len(res.items) == 3
    assert res.sample_size == 5

    for item in res.items:
        # Korelasi item-total harus bernilai positif tinggi
        assert item.r_total.value is not None
        assert item.r_total.value > 0.8
        # Corrected item-total correlation (tanpa item itu sendiri)
        assert item.r_corrected.value is not None
        assert item.r_corrected.value > 0.8
        assert item.p_value.value is not None
        assert item.is_valid is True


def test_validity_constant_item():
    """Uji penanganan jika ada item yang bernilai konstan."""
    raw_data = [
        {"Q1": 5, "Q2": 3},
        {"Q1": 4, "Q2": 3},
        {"Q1": 3, "Q2": 3},
        {"Q1": 2, "Q2": 3},
    ]
    ds = _make_mock_dataset(["Q1", "Q2"], raw_data)

    res = calculate_validity(ds, ["Q1", "Q2"])
    q2_res = next(i for i in res.items if i.item == "Q2")
    assert q2_res.r_total.value is None
    assert q2_res.is_valid is False
    assert any("konstan" in w.lower() for w in res.warnings)

import pytest
import numpy as np
import pandas as pd
from types import SimpleNamespace

from statistical_engine.reliability import calculate_reliability
from schemas.dataset import VariableDefinition


def _make_mock_dataset(var_names, rows_data):
    variables = [
        VariableDefinition(name=v, type="numeric", width=8, decimals=2, label=v, measure="scale")
        for v in var_names
    ]
    rows = [{"id": i + 1, **row} for i, row in enumerate(rows_data)]
    return SimpleNamespace(id="mock-rel", name="Mock Reliability Dataset", variables=variables, rows=rows)


def test_cronbach_alpha_manual_comparison():
    """Bandingkan hasil Cronbach's Alpha dengan perhitungan formula manual independen."""
    raw_data = [
        {"Q1": 4, "Q2": 5, "Q3": 4, "Q4": 5},
        {"Q1": 5, "Q2": 4, "Q3": 5, "Q4": 4},
        {"Q1": 3, "Q2": 3, "Q3": 4, "Q4": 3},
        {"Q1": 2, "Q2": 2, "Q3": 3, "Q4": 2},
        {"Q1": 4, "Q2": 4, "Q3": 4, "Q4": 4},
        {"Q1": 5, "Q2": 5, "Q3": 5, "Q4": 5},
    ]
    ds = _make_mock_dataset(["Q1", "Q2", "Q3", "Q4"], raw_data)

    # 1. Hitung via Statistical Engine
    res = calculate_reliability(ds, ["Q1", "Q2", "Q3", "Q4"])

    # 2. Hitung manual independen via formula murni:
    # Alpha = (k / (k-1)) * (1 - sum(var_i) / var_total)
    df_raw = pd.DataFrame(raw_data)
    k = 4
    item_vars = df_raw.var(ddof=1)
    sum_vars = item_vars.sum()
    total_var = df_raw.sum(axis=1).var(ddof=1)
    expected_alpha = (k / (k - 1)) * (1.0 - (sum_vars / total_var))

    assert res.cronbach_alpha.value == pytest.approx(expected_alpha, abs=1e-4)
    assert res.item_count == 4
    assert res.sample_size == 6
    assert len(res.item_deleted_stats) == 4

    # Periksa bahwa Alpha if Item Deleted dihitung untuk setiap item
    for stat in res.item_deleted_stats:
        assert stat.alpha_if_deleted.value is not None
        assert stat.corrected_item_total_corr.value is not None


def test_cronbach_alpha_zero_total_variance():
    """Uji penanganan varians total 0 (seluruh responden memiliki skor total yang identik)."""
    raw_data = [
        {"A": 1, "B": 2},
        {"A": 2, "B": 1},
        {"A": 1, "B": 2},
        {"A": 2, "B": 1},
    ]
    # Total A + B selalu 3 -> total_var = 0
    ds = _make_mock_dataset(["A", "B"], raw_data)

    res = calculate_reliability(ds, ["A", "B"])
    assert res.cronbach_alpha.value is None
    assert any("varians 0" in w.lower() for w in res.warnings)

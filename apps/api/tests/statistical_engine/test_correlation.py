import pytest
import numpy as np
from types import SimpleNamespace

from statistical_engine.correlation import calculate_correlation
from schemas.dataset import VariableDefinition


def _make_mock_dataset(var_names, rows_data):
    variables = [
        VariableDefinition(name=v, type="numeric", width=8, decimals=2, label=v, measure="scale")
        for v in var_names
    ]
    rows = [{"id": i + 1, **row} for i, row in enumerate(rows_data)]
    return SimpleNamespace(id="mock-corr", name="Mock Correlation Dataset", variables=variables, rows=rows)


def test_correlation_positive_and_negative():
    """Uji matriks korelasi Pearson: hubungan positif sempurna dan negatif sempurna."""
    raw_data = [
        {"X": 1, "Y": 2, "Z": 10},
        {"X": 2, "Y": 4, "Z": 8},
        {"X": 3, "Y": 6, "Z": 6},
        {"X": 4, "Y": 8, "Z": 4},
        {"X": 5, "Y": 10, "Z": 2},
    ]
    ds = _make_mock_dataset(["X", "Y", "Z"], raw_data)

    res = calculate_correlation(ds, ["X", "Y", "Z"], method="pearson")
    assert len(res.matrix) == 9  # 3 x 3

    # X dengan Y (positif sempurna: r = 1.0)
    xy_cell = next(c for c in res.matrix if c.var1 == "X" and c.var2 == "Y")
    assert xy_cell.correlation.value == pytest.approx(1.0, abs=1e-4)

    # X dengan Z (negatif sempurna: r = -1.0)
    xz_cell = next(c for c in res.matrix if c.var1 == "X" and c.var2 == "Z")
    assert xz_cell.correlation.value == pytest.approx(-1.0, abs=1e-4)

    # Diagonal (X dengan X: r = 1.0)
    xx_cell = next(c for c in res.matrix if c.var1 == "X" and c.var2 == "X")
    assert xx_cell.correlation.value == 1.0


def test_correlation_pairwise_missing():
    """Uji complete-case per pasangan variabel saat terdapat missing values."""
    raw_data = [
        {"A": 1, "B": 2},
        {"A": 2, "B": None},
        {"A": 3, "B": 6},
        {"A": 4, "B": 8},
    ]
    ds = _make_mock_dataset(["A", "B"], raw_data)

    res = calculate_correlation(ds, ["A", "B"], method="pearson", missing_policy="pairwise")
    ab_cell = next(c for c in res.matrix if c.var1 == "A" and c.var2 == "B")
    assert ab_cell.n_pairs == 3
    assert ab_cell.correlation.value is not None

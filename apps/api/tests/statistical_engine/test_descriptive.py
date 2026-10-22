import pytest
import numpy as np
from types import SimpleNamespace

from statistical_engine.descriptive import calculate_descriptive
from schemas.dataset import VariableDefinition


def _make_mock_dataset(var_names, rows_data):
    variables = [
        VariableDefinition(name=v, type="numeric", width=8, decimals=2, label=v, measure="scale")
        for v in var_names
    ]
    rows = [{"id": i + 1, **row} for i, row in enumerate(rows_data)]
    return SimpleNamespace(id="mock-ds", name="Mock Dataset", variables=variables, rows=rows)


def test_descriptive_known_values():
    """Uji perhitungan mean, median, min, max, range, varians, dan SD terhadap nilai acuan yang diketahui."""
    # Data sintetis: [10, 20, 30, 40, 50]
    # Mean = 30, Median = 30, Min = 10, Max = 50, Range = 40
    # Sample Var (ddof=1) = 250.0, Sample SD = sqrt(250) = 15.811388...
    # SEM = 15.811388 / sqrt(5) = 7.071067...
    raw_data = [{"X": 10}, {"X": 20}, {"X": 30}, {"X": 40}, {"X": 50}]
    ds = _make_mock_dataset(["X"], raw_data)

    res = calculate_descriptive(ds, ["X"])
    assert len(res.results) == 1
    r = res.results[0]

    assert r.n_valid == 5
    assert r.n_missing == 0
    assert r.mean.value == pytest.approx(30.0, abs=1e-4)
    assert r.median.value == pytest.approx(30.0, abs=1e-4)
    assert r.min.value == pytest.approx(10.0, abs=1e-4)
    assert r.max.value == pytest.approx(50.0, abs=1e-4)
    assert r.range.value == pytest.approx(40.0, abs=1e-4)
    assert r.variance.value == pytest.approx(250.0, abs=1e-4)
    assert r.std_dev.value == pytest.approx(np.sqrt(250.0), abs=1e-4)
    assert r.sem.value == pytest.approx(np.sqrt(250.0) / np.sqrt(5), abs=1e-4)
    # Distribusi simetris sempurna -> Skewness mendekati 0
    assert r.skewness.value == pytest.approx(0.0, abs=1e-3)


def test_descriptive_constant_column():
    """Uji penanganan kolom konstan (varians = 0, skewness/kurtosis null)."""
    raw_data = [{"K": 5}, {"K": 5}, {"K": 5}, {"K": 5}]
    ds = _make_mock_dataset(["K"], raw_data)

    res = calculate_descriptive(ds, ["K"])
    r = res.results[0]
    assert r.n_valid == 4
    assert r.mean.value == 5.0
    assert r.variance.value == 0.0
    assert r.std_dev.value == 0.0
    assert r.skewness.value is None
    assert r.kurtosis.value is None
    assert any("konstan" in w.lower() for w in r.warnings)


def test_descriptive_missing_values():
    """Uji penanganan missing values dan penghitungan N valid & missing yang akurat."""
    raw_data = [{"M": 10}, {"M": None}, {"M": 20}, {"M": ""}, {"M": 30}]
    ds = _make_mock_dataset(["M"], raw_data)

    res = calculate_descriptive(ds, ["M"])
    r = res.results[0]
    assert r.n_valid == 3
    assert r.n_missing == 2
    assert r.mean.value == pytest.approx(20.0, abs=1e-4)


def test_descriptive_single_observation():
    """Uji penanganan edge-case N=1 (varians sampel tidak terdefinisi)."""
    raw_data = [{"S": 42}]
    ds = _make_mock_dataset(["S"], raw_data)

    res = calculate_descriptive(ds, ["S"])
    r = res.results[0]
    assert r.n_valid == 1
    assert r.mean.value == 42.0
    assert r.variance.value is None
    assert r.std_dev.value is None

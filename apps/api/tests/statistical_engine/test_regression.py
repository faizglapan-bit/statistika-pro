import pytest
import numpy as np
from types import SimpleNamespace

from statistical_engine.regression import calculate_regression
from statistical_engine.exceptions import (
    CollinearPredictorsError,
    ConstantColumnError,
    InsufficientDataError,
)
from schemas.dataset import VariableDefinition


def _make_mock_dataset(var_names, rows_data):
    variables = [
        VariableDefinition(name=v, type="numeric", width=8, decimals=2, label=v, measure="scale")
        for v in var_names
    ]
    rows = [{"id": i + 1, **row} for i, row in enumerate(rows_data)]
    return SimpleNamespace(id="mock-reg", name="Mock Regression Dataset", variables=variables, rows=rows)


def test_simple_linear_regression_known_parameters():
    """Uji regresi linier sederhana OLS dengan parameter deterministik: Y = 2*X + 1."""
    # Y = 1 + 2*X
    raw_data = [
        {"X": 1.0, "Y": 3.0},
        {"X": 2.0, "Y": 5.0},
        {"X": 3.0, "Y": 7.0},
        {"X": 4.0, "Y": 9.0},
        {"X": 5.0, "Y": 11.0},
    ]
    ds = _make_mock_dataset(["X", "Y"], raw_data)

    res = calculate_regression(ds, dependent_var="Y", independent_vars=["X"], include_diagnostics=False)

    assert res.sample_size == 5
    assert res.r_squared.value == pytest.approx(1.0, abs=1e-4)
    assert res.adj_r_squared.value == pytest.approx(1.0, abs=1e-4)

    # Koefisien
    const_coef = next(c for c in res.coefficients if c.variable == "(Constant)")
    x_coef = next(c for c in res.coefficients if c.variable == "X")

    assert const_coef.b.value == pytest.approx(1.0, abs=1e-4)
    assert x_coef.b.value == pytest.approx(2.0, abs=1e-4)
    # Standardized Beta untuk hubungan positif sempurna adalah 1.0
    assert x_coef.beta.value == pytest.approx(1.0, abs=1e-4)
    assert x_coef.p_value.value is not None
    assert x_coef.p_value.value < 0.001

    # Persamaan regresi
    assert "Y = 1.000 + 2.000*X" in res.equation or "Y = 1.000" in res.equation


def test_multiple_regression_anova_and_beta():
    """Uji regresi berganda, tabel ANOVA (SS, df, MS, F), dan Standardized Beta."""
    raw_data = [
        {"Y": 10.0, "X1": 1.0, "X2": 2.0},
        {"Y": 15.0, "X1": 2.0, "X2": 1.0},
        {"Y": 20.0, "X1": 3.0, "X2": 4.0},
        {"Y": 25.0, "X1": 4.0, "X2": 3.0},
        {"Y": 30.0, "X1": 5.0, "X2": 5.0},
        {"Y": 35.0, "X1": 6.0, "X2": 6.0},
    ]
    ds = _make_mock_dataset(["Y", "X1", "X2"], raw_data)

    res = calculate_regression(ds, dependent_var="Y", independent_vars=["X1", "X2"], include_diagnostics=False)

    assert res.sample_size == 6
    assert len(res.anova) == 3
    # Derajat kebebasan
    anova_reg = next(a for a in res.anova if a.source == "Regression")
    anova_res = next(a for a in res.anova if a.source == "Residual")
    anova_tot = next(a for a in res.anova if a.source == "Total")

    assert anova_reg.df == 2
    assert anova_res.df == 3  # N - k - 1 = 6 - 2 - 1 = 3
    assert anova_tot.df == 5

    # Standardized Beta harus ada untuk tiap prediktor
    for pred in ["X1", "X2"]:
        c = next(coef for coef in res.coefficients if coef.variable == pred)
        assert c.beta.value is not None


def test_regression_perfect_collinearity_error():
    """Uji bahwa prediktor dengan multikolinearitas sempurna ditolak dengan error yang jelas."""
    # X2 persis 2 kali lipat dari X1 -> Rank deficient
    raw_data = [
        {"Y": 5, "X1": 1, "X2": 2},
        {"Y": 10, "X1": 2, "X2": 4},
        {"Y": 15, "X1": 3, "X2": 6},
        {"Y": 20, "X1": 4, "X2": 8},
        {"Y": 25, "X1": 5, "X2": 10},
    ]
    ds = _make_mock_dataset(["Y", "X1", "X2"], raw_data)

    with pytest.raises(CollinearPredictorsError) as exc_info:
        calculate_regression(ds, dependent_var="Y", independent_vars=["X1", "X2"])
    assert "kolinearitas sempurna" in str(exc_info.value).lower()


def test_regression_constant_predictor_error():
    """Uji penolakan variabel konstan pada regresi."""
    raw_data = [
        {"Y": 5, "X": 3},
        {"Y": 10, "X": 3},
        {"Y": 15, "X": 3},
        {"Y": 20, "X": 3},
    ]
    ds = _make_mock_dataset(["Y", "X"], raw_data)

    with pytest.raises(ConstantColumnError):
        calculate_regression(ds, dependent_var="Y", independent_vars=["X"])

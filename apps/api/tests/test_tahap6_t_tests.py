import pytest
from types import SimpleNamespace
from schemas.dataset import VariableDefinition
from statistical_engine.t_tests import (
    one_sample_t_test,
    independent_t_test,
    paired_t_test,
)
from statistical_engine.exceptions import (
    InsufficientDataError,
    VariableNotFoundError,
)


def _make_dataset(var_defs, rows):
    variables = [
        VariableDefinition(
            name=v["name"],
            type=v.get("type", "numeric"),
            width=8,
            decimals=2,
            label=v.get("label", v["name"]),
            measure=v.get("measure", "scale"),
            missing=v.get("missing", []),
        )
        for v in var_defs
    ]
    return SimpleNamespace(id="mock-ds", name="Mock Dataset", variables=variables, rows=rows)


def test_one_sample_t_test_benchmark():
    # Data: [12, 14, 15, 18, 21] -> Mean = 16.0, SD = 3.5355..., N = 5
    # Nilai acuan = 10.0 -> Mean Diff = 6.0
    # SE = 3.5355 / sqrt(5) = 1.5811...
    # t = 6.0 / 1.5811 = 3.7947... -> df = 4
    rows = [{"VAL": 12}, {"VAL": 14}, {"VAL": 15}, {"VAL": 18}, {"VAL": 21}]
    ds = _make_dataset([{"name": "VAL"}], rows)

    res = one_sample_t_test(ds, "VAL", test_value=10.0)
    assert res["summary"]["n"] == 5
    assert round(res["summary"]["mean"], 2) == 16.00
    assert round(res["summary"]["t"], 3) == 3.795
    assert res["summary"]["df"] == 4
    assert res["summary"]["p_value"] < 0.05
    assert res["summary"]["cohens_d"] > 1.0


def test_independent_t_test_student_and_welch():
    # Kelompok A: [10, 12, 14] -> Mean = 12, Var = 4
    # Kelompok B: [20, 22, 24] -> Mean = 22, Var = 4
    rows = [
        {"SCORE": 10, "GRP": "A"},
        {"SCORE": 12, "GRP": "A"},
        {"SCORE": 14, "GRP": "A"},
        {"SCORE": 20, "GRP": "B"},
        {"SCORE": 22, "GRP": "B"},
        {"SCORE": 24, "GRP": "B"},
    ]
    ds = _make_dataset([{"name": "SCORE"}, {"name": "GRP", "type": "string", "measure": "nominal"}], rows)

    res = independent_t_test(ds, "SCORE", "GRP")
    assert res["summary"]["n1"] == 3
    assert res["summary"]["n2"] == 3
    assert round(res["summary"]["m1"], 1) == 12.0
    assert round(res["summary"]["m2"], 1) == 22.0
    # Levene F should be 0 because variances are identical
    assert round(res["summary"]["levene_f"], 3) == 0.0
    assert res["summary"]["p_student"] < 0.005
    assert res["summary"]["t_student"] < 0  # 12 - 22 = -10


def test_paired_t_test_benchmark():
    # Pre: [10, 15, 20], Post: [12, 17, 24]
    # Diffs = Post - Pre = [2, 2, 4], Mean Diff = 2.666..., SD Diff = 1.1547...
    rows = [
        {"PRE": 10, "POST": 12},
        {"PRE": 15, "POST": 17},
        {"PRE": 20, "POST": 24},
    ]
    ds = _make_dataset([{"name": "PRE"}, {"name": "POST"}], rows)

    res = paired_t_test(ds, "POST", "PRE")
    assert res["summary"]["n"] == 3
    assert round(res["summary"]["mean_diff"], 2) == 2.67
    assert res["summary"]["t"] > 3.0
    assert res["summary"]["df"] == 2
    assert res["summary"]["r_corr"] > 0.95


def test_t_test_error_handling():
    # Constant data
    rows = [{"VAL": 5}, {"VAL": 5}, {"VAL": 5}]
    ds = _make_dataset([{"name": "VAL"}], rows)
    with pytest.raises(InsufficientDataError):
        one_sample_t_test(ds, "VAL", test_value=5.0)

    # Missing variable
    with pytest.raises(VariableNotFoundError):
        one_sample_t_test(ds, "UNKNOWN", test_value=0.0)

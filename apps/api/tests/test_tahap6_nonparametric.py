import pytest
from types import SimpleNamespace
from schemas.dataset import VariableDefinition
from statistical_engine.nonparametric import (
    mann_whitney_u_test,
    wilcoxon_signed_rank_test,
    kruskal_wallis_test,
    friedman_test,
    kendall_tau_b,
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


def test_mann_whitney_u_test():
    rows = [
        {"VAL": 1, "GRP": "A"},
        {"VAL": 2, "GRP": "A"},
        {"VAL": 3, "GRP": "A"},
        {"VAL": 4, "GRP": "A"},
        {"VAL": 7, "GRP": "B"},
        {"VAL": 8, "GRP": "B"},
        {"VAL": 9, "GRP": "B"},
        {"VAL": 10, "GRP": "B"},
    ]
    ds = _make_dataset([{"name": "VAL"}, {"name": "GRP", "type": "string"}], rows)

    res = mann_whitney_u_test(ds, "VAL", "GRP")
    assert res["summary"]["u_stat"] == 0.0  # Perfect separation of ranks
    assert res["summary"]["p_value"] < 0.05
    assert abs(res["summary"]["rank_biserial"]) == 1.0


def test_wilcoxon_signed_rank():
    rows = [
        {"PRE": 10, "POST": 15},
        {"PRE": 20, "POST": 25},
        {"PRE": 30, "POST": 35},
        {"PRE": 40, "POST": 45},
        {"PRE": 50, "POST": 55},
        {"PRE": 60, "POST": 65},
    ]
    ds = _make_dataset([{"name": "PRE"}, {"name": "POST"}], rows)

    res = wilcoxon_signed_rank_test(ds, "PRE", "POST")
    assert res["summary"]["n"] == 6
    assert res["summary"]["w_stat"] == 0.0  # All differences are positive
    assert res["summary"]["p_value"] < 0.05


def test_kruskal_wallis_and_dunn():
    rows = [
        {"SCORE": 1, "GRP": "K1"},
        {"SCORE": 2, "GRP": "K1"},
        {"SCORE": 10, "GRP": "K2"},
        {"SCORE": 11, "GRP": "K2"},
        {"SCORE": 20, "GRP": "K3"},
        {"SCORE": 21, "GRP": "K3"},
    ]
    ds = _make_dataset([{"name": "SCORE"}, {"name": "GRP", "type": "string"}], rows)

    res = kruskal_wallis_test(ds, "SCORE", "GRP")
    assert res["summary"]["k"] == 3
    assert res["summary"]["h_stat"] > 4.0
    assert any("Dunn" in t["title"] for t in res["tables"])


def test_friedman_test():
    rows = [
        {"T1": 1, "T2": 2, "T3": 3},
        {"T1": 2, "T2": 3, "T3": 4},
        {"T1": 1, "T2": 2, "T3": 4},
        {"T1": 2, "T2": 3, "T3": 5},
    ]
    ds = _make_dataset([{"name": "T1"}, {"name": "T2"}, {"name": "T3"}], rows)

    res = friedman_test(ds, ["T1", "T2", "T3"])
    assert res["summary"]["n_subjects"] == 4
    assert res["summary"]["df"] == 2
    assert res["summary"]["kendalls_w"] == 1.0  # Perfect agreement across subjects


def test_kendall_tau_b():
    rows = [
        {"X": 1, "Y": 2},
        {"X": 2, "Y": 4},
        {"X": 3, "Y": 6},
        {"X": 4, "Y": 8},
    ]
    ds = _make_dataset([{"name": "X"}, {"name": "Y"}], rows)

    res = kendall_tau_b(ds, "X", "Y")
    assert res["summary"]["tau_b"] == 1.0  # Monotonically increasing

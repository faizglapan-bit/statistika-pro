import pytest
from types import SimpleNamespace
from schemas.dataset import VariableDefinition
from statistical_engine.crosstabs import crosstabs_analysis


def _make_dataset(var_defs, rows):
    variables = [
        VariableDefinition(
            name=v["name"],
            type=v.get("type", "string"),
            width=8,
            decimals=0,
            label=v.get("label", v["name"]),
            measure=v.get("measure", "nominal"),
            missing=v.get("missing", []),
        )
        for v in var_defs
    ]
    return SimpleNamespace(id="mock-ds", name="Mock Dataset", variables=variables, rows=rows)


def test_crosstabs_2x2_pearson_and_fisher():
    # 2x2 contingency table:
    # A=1, B=1: 20
    # A=1, B=2: 5
    # A=2, B=1: 5
    # A=2, B=2: 20
    rows = []
    for _ in range(20):
        rows.append({"A": "1", "B": "1"})
    for _ in range(5):
        rows.append({"A": "1", "B": "2"})
    for _ in range(5):
        rows.append({"A": "2", "B": "1"})
    for _ in range(20):
        rows.append({"A": "2", "B": "2"})

    ds = _make_dataset([{"name": "A"}, {"name": "B"}], rows)

    res = crosstabs_analysis(ds, "A", "B")
    assert res["summary"]["n_total"] == 50
    assert res["summary"]["chi2"] > 15.0
    assert res["summary"]["p_value"] < 0.001
    assert res["summary"]["cramer_v"] > 0.50
    assert any("Fisher's Exact Test" in r.get("Uji", "") for t in res["tables"] if "Chi-Square Tests" in t["title"] for r in t["rows"])

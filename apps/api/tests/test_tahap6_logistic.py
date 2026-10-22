import pytest
from types import SimpleNamespace
from schemas.dataset import VariableDefinition
from statistical_engine.logistic_regression import binary_logistic_regression


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


def test_binary_logistic_regression_estimation():
    # Buat dataset sintetis: X1 kontinu, Y biner (0 atau 1)
    # Jika X1 tinggi -> cenderung Y = 1
    rows = []
    # 15 kasus 0
    for i in range(15):
        rows.append({"X1": 10 + i, "CAT": "LOW" if i < 8 else "MID", "Y": 0})
    # 15 kasus 1
    for i in range(15):
        rows.append({"X1": 30 + i, "CAT": "HIGH" if i > 7 else "MID", "Y": 1})

    ds = _make_dataset(
        [
            {"name": "X1"},
            {"name": "CAT", "type": "string", "measure": "nominal"},
            {"name": "Y", "measure": "nominal"},
        ],
        rows,
    )

    res = binary_logistic_regression(
        dataset=ds,
        dependent_variable="Y",
        independent_variables=["X1", "CAT"],
        categorical_variables=["CAT"],
        reference_category="last",
        cutoff=0.5,
    )

    assert res["summary"]["n_total"] == 30
    assert res["summary"]["chi2_omnibus"] > 10.0
    assert res["summary"]["p_omnibus"] < 0.01
    assert res["summary"]["accuracy"] > 80.0
    assert any("Variables in the Equation" in t["title"] for t in res["tables"])

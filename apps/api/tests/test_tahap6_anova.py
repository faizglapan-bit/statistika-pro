import pytest
from types import SimpleNamespace
from schemas.dataset import VariableDefinition
from statistical_engine.anova import one_way_anova
from statistical_engine.exceptions import InsufficientDataError


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


def test_one_way_anova_classic_and_tukey():
    # 3 Kelompok:
    # G1: [10, 12, 11] (M=11)
    # G2: [20, 22, 21] (M=21)
    # G3: [30, 32, 31] (M=31)
    rows = [
        {"SCORE": 10, "TREATMENT": "A"},
        {"SCORE": 12, "TREATMENT": "A"},
        {"SCORE": 11, "TREATMENT": "A"},
        {"SCORE": 20, "TREATMENT": "B"},
        {"SCORE": 22, "TREATMENT": "B"},
        {"SCORE": 21, "TREATMENT": "B"},
        {"SCORE": 30, "TREATMENT": "C"},
        {"SCORE": 32, "TREATMENT": "C"},
        {"SCORE": 31, "TREATMENT": "C"},
    ]
    ds = _make_dataset([{"name": "SCORE"}, {"name": "TREATMENT", "type": "string"}], rows)

    res = one_way_anova(ds, "SCORE", "TREATMENT", post_hoc="tukey")
    assert res["summary"]["groups_count"] == 3
    assert res["summary"]["total_n"] == 9
    assert res["summary"]["f_stat"] > 100.0  # Sangat signifikan
    assert res["summary"]["p_stat"] < 0.001
    assert res["summary"]["eta_squared"] > 0.90
    assert any("Tukey HSD" in t["title"] for t in res["tables"])


def test_one_way_anova_games_howell():
    # Kelompok dengan varians tidak homogen
    rows = [
        {"SCORE": 10, "GRP": "G1"},
        {"SCORE": 11, "GRP": "G1"},
        {"SCORE": 10, "GRP": "G1"},
        {"SCORE": 20, "GRP": "G2"},
        {"SCORE": 35, "GRP": "G2"},
        {"SCORE": 15, "GRP": "G2"},
    ]
    ds = _make_dataset([{"name": "SCORE"}, {"name": "GRP", "type": "string"}], rows)

    res = one_way_anova(ds, "SCORE", "GRP", post_hoc="games-howell")
    assert res["summary"]["groups_count"] == 2
    assert any("Games-Howell" in t["title"] for t in res["tables"])


def test_anova_validation_error():
    # Only 1 group
    rows = [{"SCORE": 10, "GRP": "G1"}, {"SCORE": 12, "GRP": "G1"}]
    ds = _make_dataset([{"name": "SCORE"}, {"name": "GRP", "type": "string"}], rows)
    with pytest.raises(InsufficientDataError):
        one_way_anova(ds, "SCORE", "GRP")

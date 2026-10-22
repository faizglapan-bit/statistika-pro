import pytest
from types import SimpleNamespace
from schemas.dataset import VariableDefinition
from statistical_engine.charts import (
    compute_histogram_data,
    compute_boxplot_data,
    compute_scatter_data,
    compute_bar_chart_data,
    compute_correlation_heatmap_data,
    compute_qq_plot_data,
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


def test_charts_calculations():
    rows = [
        {"X": 10, "Y": 20, "GRP": "A"},
        {"X": 15, "Y": 25, "GRP": "A"},
        {"X": 20, "Y": 35, "GRP": "B"},
        {"X": 25, "Y": 40, "GRP": "B"},
        {"X": 30, "Y": 50, "GRP": "B"},
    ]
    ds = _make_dataset([{"name": "X"}, {"name": "Y"}, {"name": "GRP", "type": "string"}], rows)

    # 1. Histogram
    h = compute_histogram_data(ds, "X", bins_count=5)
    assert h["chart_type"] == "histogram"
    assert len(h["bins"]) > 0
    assert len(h["normal_curve"]) > 0

    # 2. Boxplot
    b = compute_boxplot_data(ds, "X", grouping_variable="GRP")
    assert b["chart_type"] == "boxplot"
    assert len(b["boxplots"]) == 2

    # 3. Scatter Plot
    s = compute_scatter_data(ds, "X", "Y")
    assert s["chart_type"] == "scatter"
    assert len(s["points"]) == 5
    assert s["regression_line"]["r_squared"] > 0.95

    # 4. Bar Chart
    bar = compute_bar_chart_data(ds, "GRP", numeric_variable="Y", stat_type="mean")
    assert bar["chart_type"] == "bar"
    assert len(bar["bars"]) == 2

    # 5. Correlation Heatmap
    hm = compute_correlation_heatmap_data(ds, ["X", "Y"])
    assert hm["chart_type"] == "heatmap"
    assert len(hm["matrix"]) == 2

    # 6. Q-Q Plot
    qq = compute_qq_plot_data(ds, "X")
    assert qq["chart_type"] == "qq_plot"
    assert len(qq["points"]) == 5

import pytest
import numpy as np
from types import SimpleNamespace
from fastapi.testclient import TestClient

from statistical_engine.regression import calculate_regression
from main import app
from schemas.dataset import VariableDefinition

client = TestClient(app)


def _make_mock_dataset(var_names, rows_data):
    variables = [
        VariableDefinition(name=v, type="numeric", width=8, decimals=2, label=v, measure="scale")
        for v in var_names
    ]
    rows = [{"id": i + 1, **row} for i, row in enumerate(rows_data)]
    return SimpleNamespace(id="mock-diag", name="Mock Diagnostics Dataset", variables=variables, rows=rows)


def test_diagnostics_integration_in_regression():
    """Uji bahwa diagnostik (VIF, Breusch-Pagan, Glejser, Shapiro-Wilk, Durbin-Watson) terintegrasi pada regresi."""
    np.random.seed(42)
    n = 30
    x1 = np.linspace(1, 10, n)
    x2 = np.random.normal(5, 2, n)
    eps = np.random.normal(0, 1, n)
    y = 3.0 + 1.5 * x1 - 0.8 * x2 + eps

    raw_data = [{"Y": float(y[i]), "X1": float(x1[i]), "X2": float(x2[i])} for i in range(n)]
    ds = _make_mock_dataset(["Y", "X1", "X2"], raw_data)

    res = calculate_regression(ds, dependent_var="Y", independent_vars=["X1", "X2"], include_diagnostics=True)

    assert res.diagnostics is not None
    diag = res.diagnostics

    # 1. Normalitas
    assert "statistic" in diag.shapiro_wilk
    assert diag.shapiro_wilk["statistic"].value is not None

    # 2. VIF & Tolerance
    assert "X1" in diag.vif
    assert "X2" in diag.vif
    assert diag.vif["X1"].value is not None
    # Karena x1 dan x2 dibangkitkan independen, VIF harus rendah (< 2.0)
    assert diag.vif["X1"].value < 2.0

    # 3. Heteroskedastisitas
    assert "lm_stat" in diag.breusch_pagan
    assert len(diag.glejser) == 2

    # 4. Durbin-Watson
    assert diag.durbin_watson.value is not None
    # Nilai Durbin-Watson data acak independen berada di sekitar 1.5 - 2.5
    assert 1.0 < diag.durbin_watson.value < 3.0


def test_analysis_api_endpoints():
    """Uji pemanggilan endpoint REST API /api/analysis/* dengan DEMO DATA."""
    # Pastikan demo data sudah di-seed
    res_seed = client.post("/api/datasets/demo/seed?force=true")
    assert res_seed.status_code == 200
    demo_id = res_seed.json()["id"]

    # 1. Deskriptif
    res_desc = client.post("/api/analysis/descriptive", json={"dataset_id": demo_id, "variables": ["Q1", "Q2"]})
    assert res_desc.status_code == 200
    assert len(res_desc.json()["results"]) == 2

    # 2. Validitas Item
    res_val = client.post("/api/analysis/validity", json={"dataset_id": demo_id, "items": ["Q1", "Q2", "Q3", "Q4"]})
    assert res_val.status_code == 200
    assert len(res_val.json()["items"]) == 4

    # 3. Reliabilitas
    res_rel = client.post("/api/analysis/reliability", json={"dataset_id": demo_id, "items": ["Q1", "Q2", "Q3", "Q4"]})
    assert res_rel.status_code == 200
    assert res_rel.json()["cronbach_alpha"]["value"] is not None

    # 4. Korelasi
    res_corr = client.post("/api/analysis/correlation", json={"dataset_id": demo_id, "variables": ["Q1", "Q2", "Q3"]})
    assert res_corr.status_code == 200
    assert len(res_corr.json()["matrix"]) == 9

    # 5. Regresi & Diagnostik
    res_reg = client.post(
        "/api/analysis/regression",
        json={
            "dataset_id": demo_id,
            "dependent_variable": "Q4",
            "independent_variables": ["Q1", "Q2", "Q3"],
            "include_diagnostics": True,
        },
    )
    assert res_reg.status_code == 200
    assert res_reg.json()["r_squared"]["value"] is not None
    assert res_reg.json()["diagnostics"] is not None

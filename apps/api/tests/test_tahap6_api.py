import pytest
from fastapi.testclient import TestClient
from main import app
from services.dataset_service import DatasetService
from schemas.dataset import DatasetCreate, VariableDefinition

client = TestClient(app)


@pytest.fixture
def mock_dataset():
    payload = DatasetCreate(
        name="Dataset Tahap 6 Test",
        variables=[
            VariableDefinition(name="ID", type="numeric", width=8, decimals=0, label="Subject ID", measure="nominal"),
            VariableDefinition(name="Q1", type="numeric", width=8, decimals=2, label="Skor Pre", measure="scale"),
            VariableDefinition(name="Q2", type="numeric", width=8, decimals=2, label="Skor Post", measure="scale"),
            VariableDefinition(name="GROUP", type="string", width=8, decimals=0, label="Kelompok", measure="nominal"),
            VariableDefinition(name="GENDER", type="string", width=8, decimals=0, label="Gender", measure="nominal"),
            VariableDefinition(name="SUCCESS", type="numeric", width=8, decimals=0, label="Kelulusan", measure="nominal"),
        ],
        rows=[
            {"ID": 1, "Q1": 10, "Q2": 15, "GROUP": "A", "GENDER": "M", "SUCCESS": 0},
            {"ID": 2, "Q1": 12, "Q2": 18, "GROUP": "A", "GENDER": "M", "SUCCESS": 0},
            {"ID": 3, "Q1": 14, "Q2": 20, "GROUP": "A", "GENDER": "F", "SUCCESS": 0},
            {"ID": 4, "Q1": 25, "Q2": 30, "GROUP": "B", "GENDER": "F", "SUCCESS": 1},
            {"ID": 5, "Q1": 27, "Q2": 32, "GROUP": "B", "GENDER": "M", "SUCCESS": 1},
            {"ID": 6, "Q1": 30, "Q2": 35, "GROUP": "B", "GENDER": "F", "SUCCESS": 1},
            {"ID": 7, "Q1": 40, "Q2": 45, "GROUP": "C", "GENDER": "M", "SUCCESS": 1},
            {"ID": 8, "Q1": 42, "Q2": 48, "GROUP": "C", "GENDER": "F", "SUCCESS": 1},
            {"ID": 9, "Q1": 45, "Q2": 50, "GROUP": "C", "GENDER": "F", "SUCCESS": 1},
        ],
    )
    ds = DatasetService.create_dataset(payload)
    yield ds
    # Cleanup
    try:
        DatasetService.delete_dataset(ds.id)
    except Exception:
        pass


def test_api_t_tests(mock_dataset):
    ds_id = mock_dataset.id

    # One Sample
    r = client.post(f"/api/advanced-analysis/{ds_id}/t-test/one-sample", json={"variable": "Q1", "test_value": 20.0})
    assert r.status_code == 200
    assert "output_id" in r.json()

    # Independent
    r = client.post(
        f"/api/advanced-analysis/{ds_id}/t-test/independent",
        json={"test_variable": "Q1", "grouping_variable": "GROUP", "group1_val": "A", "group2_val": "B"},
    )
    assert r.status_code == 200

    # Paired
    r = client.post(f"/api/advanced-analysis/{ds_id}/t-test/paired", json={"variable1": "Q1", "variable2": "Q2"})
    assert r.status_code == 200


def test_api_anova(mock_dataset):
    ds_id = mock_dataset.id
    r = client.post(
        f"/api/advanced-analysis/{ds_id}/anova/one-way",
        json={"dependent_variable": "Q1", "factor_variable": "GROUP", "post_hoc": "tukey"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["summary"]["groups_count"] == 3


def test_api_nonparametric(mock_dataset):
    ds_id = mock_dataset.id
    # Mann Whitney
    r = client.post(
        f"/api/advanced-analysis/{ds_id}/nonparametric/mann-whitney",
        json={"test_variable": "Q1", "grouping_variable": "GROUP", "group1_val": "A", "group2_val": "B"},
    )
    assert r.status_code == 200

    # Wilcoxon
    r = client.post(
        f"/api/advanced-analysis/{ds_id}/nonparametric/wilcoxon",
        json={"variable1": "Q1", "variable2": "Q2"},
    )
    assert r.status_code == 200

    # Kruskal Wallis
    r = client.post(
        f"/api/advanced-analysis/{ds_id}/nonparametric/kruskal-wallis",
        json={"dependent_variable": "Q1", "factor_variable": "GROUP"},
    )
    assert r.status_code == 200


def test_api_crosstabs(mock_dataset):
    ds_id = mock_dataset.id
    r = client.post(
        f"/api/advanced-analysis/{ds_id}/crosstabs",
        json={"row_variable": "GROUP", "column_variable": "GENDER"},
    )
    assert r.status_code == 200
    assert "Chi-Square Tests" in r.text


def test_api_charts(mock_dataset):
    ds_id = mock_dataset.id
    # Histogram
    r = client.post(
        f"/api/advanced-analysis/{ds_id}/charts",
        json={"chart_type": "histogram", "variable": "Q1", "bins_count": 5},
    )
    assert r.status_code == 200
    assert r.json()["chart_type"] == "histogram"

    # Scatter
    r = client.post(
        f"/api/advanced-analysis/{ds_id}/charts",
        json={"chart_type": "scatter", "x_variable": "Q1", "y_variable": "Q2"},
    )
    assert r.status_code == 200
    assert r.json()["chart_type"] == "scatter"

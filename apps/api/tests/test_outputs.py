import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_outputs_crud_lifecycle():
    # 1. Pastikan bisa create output
    payload = {
        "title": "Analisis Deskriptif - Q1 to Q4",
        "analysis_type": "descriptive",
        "dataset_id": "test-dataset-xyz",
        "dataset_name": "Kuesioner Kepuasan Pelanggan",
        "dataset_updated_at": "2026-10-21T12:00:00Z",
        "sample_size": 25,
        "variables": ["Q1", "Q2", "Q3", "Q4"],
        "parameters": {"method": "descriptive"},
        "results": {
            "sample_size": 25,
            "results": [
                {
                    "name": "Q1",
                    "n_valid": 25,
                    "n_missing": 0,
                    "mean": {"value": 4.12, "formatted": "4.120", "note": None},
                    "std_dev": {"value": 0.88, "formatted": "0.880", "note": None},
                }
            ],
        },
        "warnings": [],
        "interpretation": "Rata-rata skor item berkisar antara 4.12.",
    }

    create_res = client.post("/api/outputs", json=payload)
    assert create_res.status_code == 200
    created_data = create_res.json()
    assert "id" in created_data
    output_id = created_data["id"]
    assert created_data["title"] == payload["title"]
    assert created_data["dataset_id"] == "test-dataset-xyz"

    # 2. Ambil list outputs
    list_res = client.get("/api/outputs")
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(item["id"] == output_id for item in items)

    # 3. Filter list by dataset_id
    filtered_res = client.get(f"/api/outputs?dataset_id=test-dataset-xyz")
    assert filtered_res.status_code == 200
    filtered_items = filtered_res.json()
    assert all(item["dataset_id"] == "test-dataset-xyz" for item in filtered_items)
    assert any(item["id"] == output_id for item in filtered_items)

    # Filter with non-existent dataset_id
    empty_res = client.get("/api/outputs?dataset_id=non-existent-dataset-id")
    assert empty_res.status_code == 200
    assert len(empty_res.json()) == 0

    # 4. Ambil output by ID
    get_res = client.get(f"/api/outputs/{output_id}")
    assert get_res.status_code == 200
    got_data = get_res.json()
    assert got_data["id"] == output_id
    assert got_data["interpretation"] == payload["interpretation"]
    assert len(got_data["results"]["results"]) == 1

    # 5. Hapus output
    del_res = client.delete(f"/api/outputs/{output_id}")
    assert del_res.status_code == 200

    # 6. Pastikan sudah tidak ditemukan (404)
    after_del_res = client.get(f"/api/outputs/{output_id}")
    assert after_del_res.status_code == 404

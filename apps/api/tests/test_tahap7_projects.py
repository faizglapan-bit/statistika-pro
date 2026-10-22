import pytest
import io
import json
import zipfile
from fastapi.testclient import TestClient

from main import app
from services.project_service import ProjectService
from services.dataset_service import DatasetService
from services.storage_security import (
    safe_join,
    sanitize_formula_cell,
    safe_extract_zip,
)
from schemas.project import ProjectCreate, ProjectUpdate
from schemas.dataset import DatasetCreate, VariableDefinition

client = TestClient(app)


def test_project_crud_lifecycle():
    # 1. Buat Proyek Baru
    create_payload = {
        "name": "Riset Kepuasan Konsumen 2026",
        "description": "Pengujian kepuasan konsumen terhadap layanan digital",
    }
    res = client.post("/api/projects", json=create_payload)
    assert res.status_code == 200
    data = res.json()
    proj_id = data["id"]
    assert data["name"] == "Riset Kepuasan Konsumen 2026"
    assert data["dataset"] is not None
    assert len(data["dataset"]["variables"]) >= 3

    # 2. Ambil Daftar Proyek
    res_list = client.get("/api/projects")
    assert res_list.status_code == 200
    projects = res_list.json()
    assert any(p["id"] == proj_id for p in projects)

    # 3. Ambil Detail Proyek
    res_get = client.get(f"/api/projects/{proj_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == proj_id

    # 4. Update / Simpan Proyek
    update_payload = {
        "name": "Riset Kepuasan Konsumen 2026 - Final",
        "description": "Deskripsi diperbarui",
    }
    res_update = client.put(f"/api/projects/{proj_id}", json=update_payload)
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Riset Kepuasan Konsumen 2026 - Final"

    # 5. Duplikasi Proyek
    res_dup = client.post(f"/api/projects/{proj_id}/duplicate?new_name=Salinan+Riset")
    assert res_dup.status_code == 200
    dup_data = res_dup.json()
    dup_id = dup_data["id"]
    assert dup_data["name"] == "Salinan Riset"
    assert dup_id != proj_id

    # 6. Hapus Proyek
    res_del = client.delete(f"/api/projects/{dup_id}")
    assert res_del.status_code == 200
    assert res_del.json()["success"] is True

    # Verifikasi sudah terhapus
    res_get_deleted = client.get(f"/api/projects/{dup_id}")
    assert res_get_deleted.status_code == 404


def test_statpro_export_and_import():
    # Buat proyek dengan dataset khusus
    ds_payload = DatasetCreate(
        name="Dataset Uji Ekspor",
        description="Dataset untuk verifikasi export/import",
        variables=[
            VariableDefinition(name="skor_a", type="numeric", width=8, decimals=2, label="Skor A", measure="scale"),
            VariableDefinition(name="skor_b", type="numeric", width=8, decimals=2, label="Skor B", measure="scale"),
        ],
        rows=[
            {"id": 1, "skor_a": 85.0, "skor_b": 90.0},
            {"id": 2, "skor_a": 78.5, "skor_b": 82.0},
        ],
    )
    dataset = DatasetService.create_dataset(ds_payload)

    proj_create = ProjectCreate(
        name="Proyek Paket Uji",
        description="Deskripsi paket ekspor .statpro",
        dataset_id=dataset.id,
    )
    proj = ProjectService.create_project(proj_create)

    # Ekspor berkas .statpro
    res_export = client.get(f"/api/projects/{proj.id}/export")
    assert res_export.status_code == 200
    assert "attachment" in res_export.headers.get("content-disposition", "")
    zip_bytes = res_export.content

    # Verifikasi isi zip
    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as z:
        names = z.namelist()
        assert "manifest.json" in names
        assert "project.json" in names
        assert "dataset.json" in names
        manifest = json.loads(z.read("manifest.json").decode("utf-8"))
        assert manifest["format_version"] == "1.0.0"

    # Impor berkas .statpro
    files = {"file": ("proyek_impor.statpro", zip_bytes, "application/octet-stream")}
    res_import = client.post("/api/projects/import", files=files)
    assert res_import.status_code == 200
    imported = res_import.json()
    assert "Proyek Paket Uji (Impor)" in imported["name"]
    assert imported["dataset"] is not None
    assert len(imported["dataset"]["rows"]) == 2


def test_zip_slip_protection():
    # Buat zip berbahaya dengan entri path traversal ../../evil.txt
    malicious_buf = io.BytesIO()
    with zipfile.ZipFile(malicious_buf, "w") as z:
        z.writestr("manifest.json", json.dumps({"format_version": "1.0.0"}))
        z.writestr("project.json", json.dumps({"id": "evil", "name": "Evil"}))
        z.writestr("../../evil.txt", "Malicious content")

    malicious_buf.seek(0)
    files = {"file": ("evil.statpro", malicious_buf.getvalue(), "application/octet-stream")}
    res = client.post("/api/projects/import", files=files)
    # Harus ditolak dengan status 400 karena Zip-Slip
    assert res.status_code == 400
    assert "Akses path tidak diizinkan" in res.json()["detail"] or "Gagal memproses" in res.json()["detail"]


def test_csv_formula_injection_sanitization():
    # Test fungsi sanitizer
    assert sanitize_formula_cell("=SUM(A1:A10)") == "'=SUM(A1:A10)"
    assert sanitize_formula_cell("+cmd|' /C calc'!A0") == "'+cmd|' /C calc'!A0"
    assert sanitize_formula_cell("-12.5") == "-12.5"  # Angka bertanda valid tidak di-escape
    assert sanitize_formula_cell(-42.0) == -42.0
    assert sanitize_formula_cell(100) == 100
    assert sanitize_formula_cell("@dangerous") == "'@dangerous"

    # Test ekspor CSV via dataset
    ds_payload = DatasetCreate(
        name="Dataset Formula Injection Test",
        variables=[
            VariableDefinition(name="item1", type="string", width=20, decimals=0, label="Item", measure="nominal"),
        ],
        rows=[
            {"id": 1, "item1": "=2+5"},
            {"id": 2, "item1": "Normal text"},
        ],
    )
    dataset = DatasetService.create_dataset(ds_payload)
    csv_str = DatasetService.export_csv(dataset.id)
    assert "'=2+5" in csv_str


def test_path_traversal_safe_join():
    with pytest.raises(ValueError):
        safe_join("C:\\data\\projects", "..\\..\\windows\\system32")


def test_health_check_enhanced():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "disk" in data
    assert "services" in data
    assert data["services"]["api"] == "healthy"
    assert "free_gb" in data["disk"]

import os
import json
import uuid
import io
import shutil
import zipfile
import tempfile
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from config import settings
from schemas.project import (
    ProjectMetadata,
    ProjectCreate,
    ProjectUpdate,
    ProjectDetail,
    StatProManifest,
)
from schemas.dataset import Dataset, DatasetCreate
from services.dataset_service import DatasetService
from services.output_service import OutputService
from services.audit_service import AuditService
from services.storage_security import (
    atomic_write_json,
    safe_extract_zip,
    sanitize_filename,
    safe_join,
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECTS_DIR = os.path.join(BASE_DIR, settings.data_dir, "projects")
INDEX_FILE = os.path.join(PROJECTS_DIR, "index.json")


def _ensure_projects_storage():
    os.makedirs(PROJECTS_DIR, exist_ok=True)
    if not os.path.exists(INDEX_FILE):
        with open(INDEX_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)


def _load_projects_index() -> List[Dict[str, Any]]:
    _ensure_projects_storage()
    try:
        with open(INDEX_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def _save_projects_index(items: List[Dict[str, Any]]) -> None:
    _ensure_projects_storage()
    atomic_write_json(INDEX_FILE, items, indent=2)


class ProjectService:
    @staticmethod
    def list_projects() -> List[ProjectMetadata]:
        _ensure_projects_storage()
        index = _load_projects_index()

        # Jika belum ada proyek sama sekali, buat Proyek Default otomatis dari demo dataset
        if not index:
            default_proj = ProjectService._seed_default_project()
            return [
                ProjectMetadata(
                    id=default_proj.id,
                    name=default_proj.name,
                    description=default_proj.description,
                    active_dataset_id=default_proj.active_dataset_id,
                    dataset_name=default_proj.dataset.name if default_proj.dataset else None,
                    row_count=len(default_proj.dataset.rows) if default_proj.dataset else 0,
                    variable_count=len(default_proj.dataset.variables) if default_proj.dataset else 0,
                    output_count=len(default_proj.outputs),
                    created_at=default_proj.created_at,
                    updated_at=default_proj.updated_at,
                )
            ]

        results = []
        for item in index:
            results.append(
                ProjectMetadata(
                    id=item["id"],
                    name=item["name"],
                    description=item.get("description", ""),
                    active_dataset_id=item.get("active_dataset_id"),
                    dataset_name=item.get("dataset_name"),
                    row_count=item.get("row_count", 0),
                    variable_count=item.get("variable_count", 0),
                    output_count=item.get("output_count", 0),
                    created_at=item.get("created_at", ""),
                    updated_at=item.get("updated_at", ""),
                )
            )
        return results

    @staticmethod
    def _seed_default_project() -> ProjectDetail:
        datasets = DatasetService.list_datasets()
        ds_id = datasets[0].id if datasets else None
        create_dto = ProjectCreate(
            name="Proyek Penelitian Default",
            description="Proyek awal otomatis Statistika Pro dengan dataset demonstrasi.",
            dataset_id=ds_id,
        )
        return ProjectService.create_project(create_dto)

    @staticmethod
    def get_project(project_id: str) -> Optional[ProjectDetail]:
        _ensure_projects_storage()
        proj_dir = os.path.join(PROJECTS_DIR, project_id)
        proj_file = os.path.join(proj_dir, "project.json")
        if not os.path.exists(proj_file):
            return None

        try:
            with open(proj_file, "r", encoding="utf-8") as f:
                proj_data = json.load(f)

            # Ambil dataset aktif jika ada
            dataset = None
            active_ds_id = proj_data.get("active_dataset_id")
            if active_ds_id:
                dataset = DatasetService.get_dataset(active_ds_id)

            # Jika dataset file lokal ada di direktori proyek
            local_ds_file = os.path.join(proj_dir, "dataset.json")
            if not dataset and os.path.exists(local_ds_file):
                with open(local_ds_file, "r", encoding="utf-8") as f:
                    ds_data = json.load(f)
                    dataset = Dataset(**ds_data)

            # Ambil outputs jika ada
            outputs = []
            local_outputs_file = os.path.join(proj_dir, "outputs.json")
            if os.path.exists(local_outputs_file):
                with open(local_outputs_file, "r", encoding="utf-8") as f:
                    outputs = json.load(f)
            elif active_ds_id:
                outputs = OutputService.list_outputs(dataset_id=active_ds_id)

            # Ambil audit log
            audit_log = []
            local_audit_file = os.path.join(proj_dir, "audit_log.json")
            if os.path.exists(local_audit_file):
                with open(local_audit_file, "r", encoding="utf-8") as f:
                    audit_log = json.load(f)

            return ProjectDetail(
                id=proj_data["id"],
                name=proj_data["name"],
                description=proj_data.get("description", ""),
                active_dataset_id=active_ds_id,
                dataset=dataset,
                outputs=outputs,
                audit_log=audit_log,
                created_at=proj_data.get("created_at", ""),
                updated_at=proj_data.get("updated_at", ""),
            )
        except Exception as e:
            return None

    @staticmethod
    def create_project(payload: ProjectCreate) -> ProjectDetail:
        _ensure_projects_storage()
        proj_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        proj_dir = os.path.join(PROJECTS_DIR, proj_id)
        os.makedirs(proj_dir, exist_ok=True)

        dataset = None
        if payload.dataset_id:
            existing_ds = DatasetService.get_dataset(payload.dataset_id)
            if existing_ds:
                dataset = existing_ds

        # Jika tidak ada dataset yang ditautkan, buat dataset baru
        if not dataset:
            new_ds_dto = DatasetCreate(
                name=f"Dataset {payload.name}",
                description=f"Dataset utama untuk {payload.name}",
            )
            dataset = DatasetService.create_dataset(new_ds_dto)

        proj_record = {
            "id": proj_id,
            "name": payload.name.strip(),
            "description": payload.description or "",
            "active_dataset_id": dataset.id if dataset else None,
            "created_at": now,
            "updated_at": now,
        }

        # Simpan project.json secara atomik
        proj_file = os.path.join(proj_dir, "project.json")
        atomic_write_json(proj_file, proj_record, indent=2)

        # Simpan salinan dataset.json lokal
        if dataset:
            ds_file = os.path.join(proj_dir, "dataset.json")
            atomic_write_json(ds_file, dataset.model_dump(), indent=2)

        # Inisialisasi outputs.json & audit_log.json
        atomic_write_json(os.path.join(proj_dir, "outputs.json"), [])
        atomic_write_json(os.path.join(proj_dir, "audit_log.json"), [])

        # Update index
        index = _load_projects_index()
        meta = {
            "id": proj_id,
            "name": proj_record["name"],
            "description": proj_record["description"],
            "active_dataset_id": dataset.id if dataset else None,
            "dataset_name": dataset.name if dataset else None,
            "row_count": len(dataset.rows) if dataset else 0,
            "variable_count": len(dataset.variables) if dataset else 0,
            "output_count": 0,
            "created_at": now,
            "updated_at": now,
        }
        index.insert(0, meta)
        _save_projects_index(index)

        return ProjectDetail(
            id=proj_id,
            name=proj_record["name"],
            description=proj_record["description"],
            active_dataset_id=dataset.id if dataset else None,
            dataset=dataset,
            outputs=[],
            audit_log=[],
            created_at=now,
            updated_at=now,
        )

    @staticmethod
    def save_project(project_id: str, payload: ProjectUpdate) -> Optional[ProjectDetail]:
        _ensure_projects_storage()
        proj_dir = os.path.join(PROJECTS_DIR, project_id)
        proj_file = os.path.join(proj_dir, "project.json")
        if not os.path.exists(proj_file):
            return None

        with open(proj_file, "r", encoding="utf-8") as f:
            proj_data = json.load(f)

        now = datetime.now(timezone.utc).isoformat()
        if payload.name is not None and payload.name.strip():
            proj_data["name"] = payload.name.strip()
        if payload.description is not None:
            proj_data["description"] = payload.description
        if payload.active_dataset_id is not None:
            proj_data["active_dataset_id"] = payload.active_dataset_id

        proj_data["updated_at"] = now
        atomic_write_json(proj_file, proj_data, indent=2)

        # Update dataset jika disertakan
        dataset = None
        active_ds_id = proj_data.get("active_dataset_id")
        if payload.dataset and active_ds_id:
            dataset = DatasetService.update_dataset(active_ds_id, payload.dataset)
            if dataset:
                ds_file = os.path.join(proj_dir, "dataset.json")
                atomic_write_json(ds_file, dataset.model_dump(), indent=2)
        elif active_ds_id:
            dataset = DatasetService.get_dataset(active_ds_id)

        # Update snapshot outputs
        outputs = []
        if active_ds_id:
            outputs = OutputService.list_outputs(dataset_id=active_ds_id)
            atomic_write_json(os.path.join(proj_dir, "outputs.json"), outputs)

        # Update index
        index = _load_projects_index()
        for item in index:
            if item["id"] == project_id:
                item["name"] = proj_data["name"]
                item["description"] = proj_data["description"]
                item["active_dataset_id"] = active_ds_id
                item["dataset_name"] = dataset.name if dataset else item.get("dataset_name")
                item["row_count"] = len(dataset.rows) if dataset else item.get("row_count", 0)
                item["variable_count"] = len(dataset.variables) if dataset else item.get("variable_count", 0)
                item["output_count"] = len(outputs)
                item["updated_at"] = now
                break
        _save_projects_index(index)

        return ProjectDetail(
            id=project_id,
            name=proj_data["name"],
            description=proj_data["description"],
            active_dataset_id=active_ds_id,
            dataset=dataset,
            outputs=outputs,
            audit_log=[],
            created_at=proj_data.get("created_at", ""),
            updated_at=now,
        )

    @staticmethod
    def duplicate_project(project_id: str, new_name: Optional[str] = None) -> Optional[ProjectDetail]:
        orig = ProjectService.get_project(project_id)
        if not orig:
            return None

        dup_name = new_name.strip() if new_name and new_name.strip() else f"{orig.name} (Salinan)"

        # Gandakan dataset agar independen
        new_ds = None
        if orig.dataset:
            ds_create = DatasetCreate(
                name=f"{orig.dataset.name} (Salinan)",
                description=f"Salinan untuk proyek {dup_name}",
                variables=orig.dataset.variables,
                rows=orig.dataset.rows,
            )
            new_ds = DatasetService.create_dataset(ds_create)

        create_dto = ProjectCreate(
            name=dup_name,
            description=orig.description,
            dataset_id=new_ds.id if new_ds else None,
        )
        return ProjectService.create_project(create_dto)

    @staticmethod
    def delete_project(project_id: str) -> bool:
        _ensure_projects_storage()
        proj_dir = os.path.join(PROJECTS_DIR, project_id)
        if not os.path.exists(proj_dir):
            return False

        # Buat backup safety sebelum penghapusan permanen
        backup_dir = os.path.join(PROJECTS_DIR, ".backups")
        os.makedirs(backup_dir, exist_ok=True)
        backup_path = os.path.join(backup_dir, f"{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        try:
            shutil.copytree(proj_dir, backup_path)
        except Exception:
            pass

        # Hapus direktori proyek
        shutil.rmtree(proj_dir, ignore_errors=True)

        # Update index
        index = _load_projects_index()
        new_index = [item for item in index if item["id"] != project_id]
        _save_projects_index(new_index)
        return True

    @staticmethod
    def export_statpro(project_id: str) -> io.BytesIO:
        """Kemas proyek ke dalam format arsip ZIP berkas .statpro dengan manifest."""
        proj = ProjectService.get_project(project_id)
        if not proj:
            raise ValueError(f"Proyek {project_id} tidak ditemukan")

        proj_dir = os.path.join(PROJECTS_DIR, project_id)
        now = datetime.now(timezone.utc).isoformat()

        manifest = StatProManifest(
            format_version="1.0.0",
            app_version=settings.app_version,
            project_id=proj.id,
            project_name=proj.name,
            exported_at=now,
        )

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            # 1. Manifest
            zip_file.writestr("manifest.json", json.dumps(manifest.model_dump(), indent=2))

            # 2. Project Metadata
            proj_data = {
                "id": proj.id,
                "name": proj.name,
                "description": proj.description,
                "active_dataset_id": proj.active_dataset_id,
                "created_at": proj.created_at,
                "updated_at": proj.updated_at,
            }
            zip_file.writestr("project.json", json.dumps(proj_data, indent=2))

            # 3. Dataset
            if proj.dataset:
                zip_file.writestr("dataset.json", json.dumps(proj.dataset.model_dump(), indent=2))

            # 4. Outputs
            zip_file.writestr("outputs.json", json.dumps(proj.outputs, indent=2))

            # 5. Audit Log
            zip_file.writestr("audit_log.json", json.dumps(proj.audit_log, indent=2))

        zip_buffer.seek(0)
        return zip_buffer

    @staticmethod
    def import_statpro(file_bytes: bytes) -> ProjectDetail:
        """
        Buka, validasi skema, dan impor paket .statpro (ZIP bundle).
        Dilengkapi proteksi Zip-Slip dan pencegahan Decompression Bomb.
        """
        try:
            zip_buffer = io.BytesIO(file_bytes)
            with zipfile.ZipFile(zip_buffer, "r") as zip_obj:
                with tempfile.TemporaryDirectory() as temp_dir:
                    # Ekstrak aman dengan proteksi Zip-Slip & bomb
                    safe_extract_zip(zip_obj, temp_dir, max_uncompressed_bytes=100 * 1024 * 1024)

                    manifest_file = os.path.join(temp_dir, "manifest.json")
                    if not os.path.exists(manifest_file):
                        raise ValueError("Berkas .statpro tidak valid: 'manifest.json' tidak ditemukan.")

                    with open(manifest_file, "r", encoding="utf-8") as f:
                        manifest_data = json.load(f)

                    # Validasi versi manifest
                    format_version = manifest_data.get("format_version", "1.0.0")
                    if not format_version.startswith("1."):
                        raise ValueError(f"Versi format berkas '{format_version}' tidak didukung oleh aplikasi.")

                    # Baca project.json
                    proj_file = os.path.join(temp_dir, "project.json")
                    if not os.path.exists(proj_file):
                        raise ValueError("Berkas .statpro tidak valid: 'project.json' tidak ditemukan.")
                    with open(proj_file, "r", encoding="utf-8") as f:
                        proj_data = json.load(f)

                    # Baca dataset.json jika ada
                    dataset = None
                    dataset_file = os.path.join(temp_dir, "dataset.json")
                    if os.path.exists(dataset_file):
                        with open(dataset_file, "r", encoding="utf-8") as f:
                            ds_data = json.load(f)
                            # Simpan dataset baru di sistem
                            ds_create = DatasetCreate(
                                name=ds_data.get("name", "Dataset Impor"),
                                description=ds_data.get("description", "Diimpor dari paket .statpro"),
                                variables=ds_data.get("variables", []),
                                rows=ds_data.get("rows", []),
                            )
                            dataset = DatasetService.create_dataset(ds_create)

                    # Buat proyek baru dengan data hasil impor
                    new_proj_name = f"{proj_data.get('name', 'Proyek Impor')} (Impor)"
                    create_dto = ProjectCreate(
                        name=new_proj_name,
                        description=proj_data.get("description", ""),
                        dataset_id=dataset.id if dataset else None,
                    )
                    new_project = ProjectService.create_project(create_dto)

                    # Salin outputs jika ada
                    outputs_file = os.path.join(temp_dir, "outputs.json")
                    if os.path.exists(outputs_file):
                        with open(outputs_file, "r", encoding="utf-8") as f:
                            imported_outputs = json.load(f)
                            proj_dir = os.path.join(PROJECTS_DIR, new_project.id)
                            atomic_write_json(os.path.join(proj_dir, "outputs.json"), imported_outputs)
                            new_project.outputs = imported_outputs

                    return new_project

        except zipfile.BadZipFile:
            raise ValueError("Berkas yang diunggah bukan arsip ZIP atau file .statpro yang valid.")
        except Exception as e:
            if isinstance(e, ValueError):
                raise
            raise ValueError(f"Gagal memproses berkas .statpro: {str(e)}")

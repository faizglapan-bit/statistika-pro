import os
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from config import settings
from schemas.output import (
    AnalysisOutputMetadata,
    AnalysisOutputCreate,
    AnalysisOutput,
)

OUTPUTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), settings.data_dir, "outputs")
INDEX_FILE = os.path.join(OUTPUTS_DIR, "index.json")


def _ensure_storage_dir():
    os.makedirs(OUTPUTS_DIR, exist_ok=True)
    if not os.path.exists(INDEX_FILE):
        with open(INDEX_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)


def _load_index() -> List[Dict[str, Any]]:
    _ensure_storage_dir()
    try:
        with open(INDEX_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def _save_index(items: List[Dict[str, Any]]) -> None:
    _ensure_storage_dir()
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)


class OutputService:
    @staticmethod
    def list_outputs(dataset_id: Optional[str] = None) -> List[AnalysisOutputMetadata]:
        """Ambil metadata seluruh riwayat output, opsional difilter per dataset."""
        items = _load_index()
        if dataset_id:
            items = [item for item in items if item.get("dataset_id") == dataset_id]
        
        # Sort descending by created_at (terbaru di atas)
        items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return [AnalysisOutputMetadata(**item) for item in items]

    @staticmethod
    def get_output(output_id: str) -> Optional[AnalysisOutput]:
        """Ambil data lengkap output hasil analisis berdasarkan ID."""
        _ensure_storage_dir()
        file_path = os.path.join(OUTPUTS_DIR, f"{output_id}.json")
        if not os.path.exists(file_path):
            return None
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return AnalysisOutput(**data)
        except Exception:
            return None

    @staticmethod
    def create_output(payload: AnalysisOutputCreate) -> AnalysisOutput:
        """Simpan output hasil analisis baru ke backend."""
        _ensure_storage_dir()
        output_id = f"out_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()

        full_output = AnalysisOutput(
            id=output_id,
            created_at=now,
            **payload.model_dump(),
        )

        # Simpan file lengkap
        file_path = os.path.join(OUTPUTS_DIR, f"{output_id}.json")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(full_output.model_dump(), f, indent=2, ensure_ascii=False)

        # Update index
        metadata = AnalysisOutputMetadata(
            id=output_id,
            title=full_output.title,
            analysis_type=full_output.analysis_type,
            dataset_id=full_output.dataset_id,
            dataset_name=full_output.dataset_name,
            dataset_updated_at=full_output.dataset_updated_at,
            sample_size=full_output.sample_size,
            variables=full_output.variables,
            created_at=now,
        )

        index = _load_index()
        index = [i for i in index if i.get("id") != output_id]
        index.insert(0, metadata.model_dump())
        _save_index(index)

        return full_output

    @staticmethod
    def delete_output(output_id: str) -> bool:
        """Hapus file output dan perbarui index."""
        _ensure_storage_dir()
        file_path = os.path.join(OUTPUTS_DIR, f"{output_id}.json")
        deleted = False
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                deleted = True
            except OSError:
                pass

        index = _load_index()
        new_index = [item for item in index if item.get("id") != output_id]
        if len(new_index) != len(index):
            _save_index(new_index)
            deleted = True

        return deleted

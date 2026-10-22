import os
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from schemas.dataset import Dataset, DatasetUpdate
from config import settings

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), settings.data_dir, "datasets")
HISTORY_DIR = os.path.join(DATA_DIR, "history")


def _ensure_history_dir(dataset_id: str) -> str:
    ds_hist_dir = os.path.join(HISTORY_DIR, dataset_id)
    os.makedirs(ds_hist_dir, exist_ok=True)
    return ds_hist_dir


class AuditService:
    @staticmethod
    def save_snapshot(
        dataset: Dataset,
        operation_type: str,
        description: str,
        affected_rows: int = 0,
        source_vars: Optional[List[str]] = None,
        target_vars: Optional[List[str]] = None,
    ) -> str:
        """Menyimpan snapshot versi dataset sebelum transformasi untuk audit dan undo."""
        ds_hist_dir = _ensure_history_dir(dataset.id)
        snapshot_id = f"{int(datetime.now(timezone.utc).timestamp())}_{str(uuid.uuid4())[:8]}"
        now = datetime.now(timezone.utc).isoformat()

        meta = {
            "snapshot_id": snapshot_id,
            "dataset_id": dataset.id,
            "timestamp": now,
            "operation_type": operation_type,
            "description": description,
            "affected_rows": affected_rows,
            "source_vars": source_vars or [],
            "target_vars": target_vars or [],
            "row_count": len(dataset.rows),
            "variable_count": len(dataset.variables),
        }

        # Simpan snapshot data lengkap
        snapshot_file = os.path.join(ds_hist_dir, f"{snapshot_id}.json")
        with open(snapshot_file, "w", encoding="utf-8") as f:
            json.dump({
                "metadata": meta,
                "dataset": dataset.model_dump(),
            }, f, indent=2, ensure_ascii=False)

        # Update file index history
        index_file = os.path.join(ds_hist_dir, "history_index.json")
        history_list = []
        if os.path.exists(index_file):
            try:
                with open(index_file, "r", encoding="utf-8") as f:
                    history_list = json.load(f)
            except Exception:
                history_list = []

        history_list.insert(0, meta)
        # Batasi riwayat maksimal 50 snapshot
        history_list = history_list[:50]
        with open(index_file, "w", encoding="utf-8") as f:
            json.dump(history_list, f, indent=2, ensure_ascii=False)

        return snapshot_id

    @staticmethod
    def list_history(dataset_id: str) -> List[Dict[str, Any]]:
        ds_hist_dir = os.path.join(HISTORY_DIR, dataset_id)
        index_file = os.path.join(ds_hist_dir, "history_index.json")
        if not os.path.exists(index_file):
            return []
        try:
            with open(index_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    @staticmethod
    def rollback(dataset_id: str, snapshot_id: str) -> Optional[Dataset]:
        """Mengembalikan kondisi dataset ke snapshot yang dipilih."""
        from services.dataset_service import DatasetService

        ds_hist_dir = os.path.join(HISTORY_DIR, dataset_id)
        snapshot_file = os.path.join(ds_hist_dir, f"{snapshot_id}.json")
        if not os.path.exists(snapshot_file):
            return None

        with open(snapshot_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        saved_ds = Dataset(**data["dataset"])

        # Perbarui dataset aktif dengan dataset dari snapshot
        updated = DatasetService.update_dataset(
            dataset_id,
            DatasetUpdate(
                name=saved_ds.name,
                description=saved_ds.description,
                variables=saved_ds.variables,
                rows=saved_ds.rows,
            )
        )
        return updated

from typing import Dict, Any, List, Optional
from services.dataset_service import DatasetService
from services.output_service import OutputService
from services.audit_service import AuditService
from schemas.report import ReportMetadata


class ReportAggregator:
    @staticmethod
    def get_available_sections(dataset_id: str) -> Dict[str, Any]:
        """Memeriksa bagian laporan mana saja yang memiliki data aktual."""
        ds = DatasetService.get_dataset(dataset_id)
        if not ds:
            raise ValueError(f"Dataset '{dataset_id}' tidak ditemukan")

        outputs = OutputService.list_outputs(dataset_id=dataset_id)
        histories = AuditService.list_history(dataset_id)

        available_types = {o.analysis_type for o in outputs}

        sections = [
            {
                "id": "info_penelitian",
                "title": "Informasi Penelitian & Metadata",
                "available": True,
                "description": "Judul, nama peneliti, instansi, dan periode penelitian.",
            },
            {
                "id": "info_dataset",
                "title": "Ringkasan Dataset",
                "available": True,
                "description": f"Dataset: {ds.name} ({len(ds.rows)} baris, {len(ds.variables)} variabel).",
            },
            {
                "id": "kamus_variabel",
                "title": "Kamus Variabel (Codebook)",
                "available": len(ds.variables) > 0,
                "description": "Definisi, tipe, skala ukur, dan label nilai setiap variabel.",
            },
            {
                "id": "riwayat_transformasi",
                "title": "Riwayat Transformasi Data",
                "available": len(histories) > 0,
                "description": f"{len(histories)} operasi transformasi tercatat dalam audit trail.",
            },
            {
                "id": "deskriptif",
                "title": "Statistik Deskriptif",
                "available": "descriptive" in available_types,
                "description": "Mean, median, standar deviasi, skewness, kurtosis, min/max.",
            },
            {
                "id": "reliabilitas",
                "title": "Uji Reliabilitas (Cronbach's Alpha)",
                "available": "reliability" in available_types,
                "description": "Konsistensi internal instrumen dan item-total statistics.",
            },
            {
                "id": "validitas",
                "title": "Uji Validitas Instrumen",
                "available": "validity" in available_types,
                "description": "Korelasi Pearson item-total (r hitung vs r tabel).",
            },
            {
                "id": "korelasi",
                "title": "Analisis Korelasi",
                "available": "correlation" in available_types,
                "description": "Matriks korelasi Pearson/Spearman dan signifikansi p-value.",
            },
            {
                "id": "regresi",
                "title": "Analisis Regresi Linier",
                "available": "regression" in available_types,
                "description": "Koefisien regresi, R-Square, uji F (ANOVA), dan uji t.",
            },
            {
                "id": "diagnostik",
                "title": "Uji Asumsi Klasik & Diagnostik",
                "available": "diagnostics" in available_types,
                "description": "Normalitas, multikolinearitas (VIF), heteroskedastisitas.",
            },
        ]

        return {
            "dataset_id": ds.id,
            "dataset_name": ds.name,
            "sections": sections,
        }

    @staticmethod
    def aggregate_report_data(
        dataset_id: str,
        metadata: ReportMetadata,
        selected_sections: List[str],
        include_history: bool = True,
    ) -> Dict[str, Any]:
        """Mengumpulkan seluruh data aktual yang akan dicetak ke dalam laporan."""
        ds = DatasetService.get_dataset(dataset_id)
        if not ds:
            raise ValueError(f"Dataset '{dataset_id}' tidak ditemukan")

        outputs_meta = OutputService.list_outputs(dataset_id=dataset_id)
        # Ambil objek lengkap untuk setiap output
        full_outputs = []
        for om in outputs_meta:
            full = OutputService.get_output(om.id)
            if full:
                full_outputs.append(full)

        histories = AuditService.list_history(dataset_id) if include_history else []

        # Filter output berdasarkan bagian yang dipilih
        analysis_map: Dict[str, List[Any]] = {
            "descriptive": [],
            "reliability": [],
            "validity": [],
            "correlation": [],
            "regression": [],
            "diagnostics": [],
        }
        for o in full_outputs:
            if o.analysis_type in analysis_map:
                analysis_map[o.analysis_type].append(o)

        return {
            "metadata": metadata.model_dump(),
            "dataset": ds.model_dump(),
            "histories": histories,
            "selected_sections": selected_sections,
            "analysis_map": analysis_map,
        }

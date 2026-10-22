from typing import List, Dict, Any, Tuple, Optional
import math
import pandas as pd
from schemas.dataset import Dataset
from schemas.case import (
    SortVariable,
    VariableMissingDetail,
    MissingSummaryResponse,
    DuplicateDetectionResponse,
)
from transformation_engine.expression_parser import evaluate_expression_on_rows


class CaseService:
    @staticmethod
    def sort_cases(
        rows: List[Dict[str, Any]],
        sort_variables: List[SortVariable],
    ) -> List[Dict[str, Any]]:
        """Mengurutkan kasus berdasarkan satu atau beberapa variabel."""
        if not sort_variables or not rows:
            return list(rows)

        df = pd.DataFrame(rows)
        sort_cols = [sv.name for sv in sort_variables if sv.name in df.columns]
        ascending_flags = [sv.ascending for sv in sort_variables if sv.name in df.columns]

        if not sort_cols:
            return list(rows)

        # Urutkan DataFrame (missing values / NaN ditaruh di akhir)
        df_sorted = df.sort_values(by=sort_cols, ascending=ascending_flags, na_position="last")
        # Ganti NaN kembali ke None
        sorted_rows = df_sorted.where(pd.notnull(df_sorted), None).to_dict(orient="records")
        return sorted_rows

    @staticmethod
    def filter_cases(
        rows: List[Dict[str, Any]],
        available_variables: List[str],
        condition_expression: str,
    ) -> Tuple[List[Dict[str, Any]], List[Any], List[str]]:
        """Mengevaluasi kondisi filter pada baris dan mengembalikan daftar baris yang lolos serta ID baris."""
        eval_results, warnings = evaluate_expression_on_rows(condition_expression, rows, available_variables)

        matched_rows: List[Dict[str, Any]] = []
        matched_row_ids: List[Any] = []

        for idx, (row, is_match) in enumerate(zip(rows, eval_results)):
            row_id = row.get("id", idx + 1)
            if is_match is True or (isinstance(is_match, (int, float)) and is_match != 0):
                matched_rows.append(row)
                matched_row_ids.append(row_id)

        return matched_rows, matched_row_ids, warnings

    @staticmethod
    def detect_duplicates(
        rows: List[Dict[str, Any]],
        key_variables: List[str],
        keep: str = "first",
    ) -> DuplicateDetectionResponse:
        """Mendeteksi baris duplikat berdasarkan variabel kunci."""
        if not rows:
            return DuplicateDetectionResponse(
                total_rows=0,
                duplicate_rows_count=0,
                unique_rows_count=0,
                duplicate_row_indices=[],
                sample_duplicate_groups=[],
            )

        df = pd.DataFrame(rows)
        valid_keys = [k for k in key_variables if k in df.columns]
        if not valid_keys:
            valid_keys = [col for col in df.columns if col != "id"]

        keep_arg = False if keep == "none" else (keep if keep in ("first", "last") else "first")
        dup_mask = df.duplicated(subset=valid_keys, keep=keep_arg)

        dup_indices = [int(i) for i in df[dup_mask].index.tolist()]

        # Sampel grup duplikat untuk pratinjau pengguna
        sample_groups = []
        if dup_indices:
            # Ambil semua baris yang terlibat dalam duplikasi
            all_dups = df[df.duplicated(subset=valid_keys, keep=False)]
            grouped = all_dups.groupby(valid_keys)
            for _, group in grouped:
                if len(sample_groups) >= 5:
                    break
                sample_groups.append({
                    "keys": {k: group.iloc[0][k] for k in valid_keys},
                    "count": len(group),
                    "row_ids": group["id"].tolist() if "id" in group else group.index.tolist(),
                })

        return DuplicateDetectionResponse(
            total_rows=len(rows),
            duplicate_rows_count=len(dup_indices),
            unique_rows_count=len(rows) - len(dup_indices),
            duplicate_row_indices=dup_indices,
            sample_duplicate_groups=sample_groups,
        )

    @staticmethod
    def remove_duplicates(
        rows: List[Dict[str, Any]],
        key_variables: List[str],
        keep: str = "first",
    ) -> List[Dict[str, Any]]:
        """Menghapus baris duplikat berdasarkan variabel kunci dengan aturan keep yang dipilih."""
        if not rows:
            return []

        df = pd.DataFrame(rows)
        valid_keys = [k for k in key_variables if k in df.columns]
        if not valid_keys:
            valid_keys = [col for col in df.columns if col != "id"]

        keep_arg = keep if keep in ("first", "last") else "first"
        df_clean = df.drop_duplicates(subset=valid_keys, keep=keep_arg)
        return df_clean.where(pd.notnull(df_clean), None).to_dict(orient="records")

    @staticmethod
    def summarize_missing(dataset: Dataset) -> MissingSummaryResponse:
        """Menghitung ringkasan missing values komprehensif untuk dataset aktif."""
        rows = dataset.rows
        variables = dataset.variables
        total_rows = len(rows)
        total_cols = len(variables)
        total_cells = total_rows * total_cols

        var_details: List[VariableMissingDetail] = []
        rows_with_missing_indices = set()
        total_missing_cells = 0

        # Mapping missing values terdefinisi
        missing_lookup = {v.name: set(v.missing) for v in variables}

        for v in variables:
            col_name = v.name
            miss_count = 0
            for r_idx, r in enumerate(rows):
                val = r.get(col_name)
                is_miss = False
                if val is None or (isinstance(val, float) and math.isnan(val)):
                    is_miss = True
                elif isinstance(val, str) and (val.strip() == "" or val.lower() in ("nan", "none", "null")):
                    is_miss = True
                elif str(val) in missing_lookup.get(col_name, set()):
                    is_miss = True

                if is_miss:
                    miss_count += 1
                    rows_with_missing_indices.add(r_idx)

            total_missing_cells += miss_count
            valid_count = total_rows - miss_count
            pct = round((miss_count / total_rows * 100.0), 2) if total_rows > 0 else 0.0

            var_details.append(
                VariableMissingDetail(
                    variable_name=col_name,
                    variable_label=v.label,
                    total_count=total_rows,
                    valid_count=valid_count,
                    missing_count=miss_count,
                    missing_percentage=pct,
                )
            )

        overall_pct = round((total_missing_cells / total_cells * 100.0), 2) if total_cells > 0 else 0.0
        row_miss_count = len(rows_with_missing_indices)
        row_miss_pct = round((row_miss_count / total_rows * 100.0), 2) if total_rows > 0 else 0.0

        return MissingSummaryResponse(
            total_rows=total_rows,
            total_columns=total_cols,
            total_cells=total_cells,
            total_missing_cells=total_missing_cells,
            overall_missing_percentage=overall_pct,
            rows_with_any_missing_count=row_miss_count,
            rows_with_any_missing_percentage=row_miss_pct,
            variables=var_details,
        )

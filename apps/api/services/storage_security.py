import os
import re
import json
import uuid
import zipfile
from typing import Any, Optional


def atomic_write_json(file_path: str, data: Any, indent: int = 2) -> None:
    """Tulis data JSON ke file tujuan secara atomik via file sementara."""
    dir_name = os.path.dirname(os.path.abspath(file_path))
    os.makedirs(dir_name, exist_ok=True)
    temp_path = f"{file_path}.tmp.{uuid.uuid4().hex}"
    try:
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=indent, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())
        os.replace(temp_path, file_path)
    except Exception:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass
        raise


def atomic_write_bytes(file_path: str, data: bytes) -> None:
    """Tulis data biner ke file tujuan secara atomik via file sementara."""
    dir_name = os.path.dirname(os.path.abspath(file_path))
    os.makedirs(dir_name, exist_ok=True)
    temp_path = f"{file_path}.tmp.{uuid.uuid4().hex}"
    try:
        with open(temp_path, "wb") as f:
            f.write(data)
            f.flush()
            os.fsync(f.fileno())
        os.replace(temp_path, file_path)
    except Exception:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass
        raise


def safe_join(base_dir: str, *paths: str) -> str:
    """Gabungkan path dan validasi terhadap Path Traversal (directory traversal)."""
    base_dir = os.path.abspath(base_dir)
    target = os.path.abspath(os.path.join(base_dir, *paths))
    common = os.path.commonpath([base_dir, target])
    if common != base_dir:
        raise ValueError(f"Akses path tidak diizinkan: {target} berada di luar {base_dir}")
    return target


def sanitize_filename(filename: str, default: str = "project") -> str:
    """Bersihkan nama file dari karakter berbahaya atau traversal."""
    cleaned = os.path.basename(filename)
    cleaned = re.sub(r"[^\w\.\-\s]", "_", cleaned).strip()
    return cleaned or default


def sanitize_formula_cell(val: Any) -> Any:
    """Cegah CSV Formula Injection dengan menambahkan kutip tunggal bila diawali =, +, -, @, \\t, \\r."""
    if val is None:
        return ""
    if isinstance(val, (int, float, bool)):
        return val
    s = str(val)
    if s.startswith(("=", "+", "-", "@", "\t", "\r")):
        # Jika nilai sebenarnya adalah angka numerik bertanda (misal "-12.5" atau "+5"), jangan di-escape
        try:
            float(s)
            return val
        except ValueError:
            return f"'{s}"
    return val


def safe_extract_zip(
    zip_obj: zipfile.ZipFile,
    target_dir: str,
    max_uncompressed_bytes: int = 100 * 1024 * 1024,
) -> None:
    """
    Ekstrak zip secara aman:
    1. Melindungi dari Zip-Slip (path traversal pada member name)
    2. Melindungi dari Decompression Bomb (membatasi total uncompressed size)
    """
    target_dir = os.path.abspath(target_dir)
    total_size = 0

    for member in zip_obj.infolist():
        # Validasi batas ukuran dekompresi
        total_size += member.file_size
        if total_size > max_uncompressed_bytes:
            raise ValueError(
                f"Ukuran berkas proyek melebihi batas aman dekompresi ({max_uncompressed_bytes // (1024*1024)} MB)"
            )

        # Validasi Zip-Slip
        member_path = safe_join(target_dir, member.filename)

        if member.is_dir():
            os.makedirs(member_path, exist_ok=True)
        else:
            os.makedirs(os.path.dirname(member_path), exist_ok=True)
            with zip_obj.open(member) as source, open(member_path, "wb") as target:
                while True:
                    chunk = source.read(64 * 1024)
                    if not chunk:
                        break
                    target.write(chunk)

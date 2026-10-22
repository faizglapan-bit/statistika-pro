from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Dict, Any
import os
import logging

logger = logging.getLogger("statistika_pro.config")


class Settings(BaseSettings):
    """Konfigurasi aplikasi yang dapat diatur melalui environment variables."""

    # App info
    app_name: str = "Statistika Pro API"
    app_version: str = "1.0.0-alpha"
    app_env: str = "development"

    # Server
    api_host: str = "127.0.0.1"
    api_port: int = 8000

    # CORS - daftar origin yang diizinkan (pisahkan koma)
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:4173"

    # Upload & Storage
    upload_max_size_mb: int = 50
    max_dataset_rows: int = 100000
    max_dataset_cols: int = 500
    data_dir: str = "data"
    projects_dir: str = "data/projects"
    safe_formula_escape: bool = True
    log_level: str = "INFO"

    @field_validator("app_env")
    @classmethod
    def validate_app_env(cls, v: str) -> str:
        valid_envs = {"development", "production", "testing"}
        v_clean = v.strip().lower()
        if v_clean not in valid_envs:
            raise ValueError(f"app_env harus salah satu dari {valid_envs}, diberikan: '{v}'")
        return v_clean

    @field_validator("api_port")
    @classmethod
    def validate_api_port(cls, v: int) -> int:
        if not (1 <= v <= 65535):
            raise ValueError(f"api_port harus di antara 1 dan 65535, diberikan: {v}")
        return v

    @field_validator("upload_max_size_mb")
    @classmethod
    def validate_upload_max_size(cls, v: int) -> int:
        if v <= 0 or v > 1000:
            raise ValueError(f"upload_max_size_mb harus di antara 1 dan 1000 MB, diberikan: {v}")
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins dari string yang dipisahkan koma."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.app_env.lower() == "development"

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def is_testing(self) -> bool:
        return self.app_env.lower() == "testing"

    def get_absolute_path(self, rel_path: str) -> str:
        """Dapatkan path absolut relatif terhadap direktori apps/api jika bukan path absolut."""
        if os.path.isabs(rel_path):
            return rel_path
        base_dir = os.path.dirname(os.path.abspath(__file__))
        return os.path.normpath(os.path.join(base_dir, rel_path))

    def validate_runtime(self) -> Dict[str, Any]:
        """
        Validasi konfigurasi runtime saat startup.
        Mengembalikan ringkasan status konfigurasi dan mendeteksi potensi masalah keamanan.
        """
        warnings: List[str] = []

        # 1. Peringatan keamanan binding host
        if self.is_development and self.api_host == "0.0.0.0":
            warnings.append(
                "Keamanan: API_HOST diatur ke 0.0.0.0 pada mode development. "
                "Backend lokal dapat diakses oleh perangkat lain di jaringan lokal. "
                "Gunakan 127.0.0.1 untuk isolasi aman."
            )

        # 2. Peringatan CORS pada mode production
        if self.is_production:
            if "*" in self.cors_origins_list:
                warnings.append(
                    "Keamanan Kritis: Wildcard '*' digunakan pada CORS_ORIGINS dalam mode production! "
                    "Batasi origin ke domain frontend terdaftar."
                )
            for origin in self.cors_origins_list:
                if "localhost" in origin or "127.0.0.1" in origin:
                    warnings.append(
                        f"Peringatan CORS: Origin lokal '{origin}' terdaftar dalam mode production."
                    )

        # 3. Validasi direktori data
        abs_data = self.get_absolute_path(self.data_dir)
        abs_projects = self.get_absolute_path(self.projects_dir)
        try:
            os.makedirs(abs_data, exist_ok=True)
            os.makedirs(abs_projects, exist_ok=True)
        except Exception as e:
            raise RuntimeError(f"Gagal menginisialisasi direktori data: {e}")

        for w in warnings:
            logger.warning(f"⚠️  {w}")

        return {
            "app_env": self.app_env,
            "api_host": self.api_host,
            "api_port": self.api_port,
            "data_dir": abs_data,
            "projects_dir": abs_projects,
            "cors_origins_count": len(self.cors_origins_list),
            "warnings_count": len(warnings),
        }

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }


def get_settings() -> Settings:
    """Factory function untuk settings (memudahkan dependency injection di tests)."""
    return Settings()


# Singleton instance
settings = get_settings()

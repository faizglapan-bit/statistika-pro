class StatisticalEngineError(Exception):
    """Base exception class untuk error pada Statistical Engine."""
    def __init__(self, message: str, code: str = "STATISTICAL_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code


class InsufficientDataError(StatisticalEngineError):
    """Error ketika ukuran sampel efektif tidak mencukupi untuk melakukan analisis."""
    def __init__(self, message: str = "Jumlah observasi valid tidak mencukupi untuk analisis ini."):
        super().__init__(message, code="INSUFFICIENT_DATA")


class ConstantColumnError(StatisticalEngineError):
    """Error ketika variabel memiliki nilai konstan (varians = 0)."""
    def __init__(self, variable_name: str):
        super().__init__(
            f"Variabel '{variable_name}' memiliki nilai konstan (varians nol). Tidak dapat dihitung.",
            code="CONSTANT_COLUMN",
        )
        self.variable_name = variable_name


class CollinearPredictorsError(StatisticalEngineError):
    """Error ketika terdapat multikolinearitas sempurna antar prediktor."""
    def __init__(self, message: str = "Matriks prediktor singular atau mengalami multikolinearitas sempurna."):
        super().__init__(message, code="PERFECT_MULTICOLLINEARITY")


class VariableNotFoundError(StatisticalEngineError):
    """Error ketika variabel yang diminta tidak ditemukan pada dataset."""
    def __init__(self, variable_name: str):
        super().__init__(
            f"Variabel '{variable_name}' tidak ditemukan pada dataset.",
            code="VARIABLE_NOT_FOUND",
        )
        self.variable_name = variable_name


class NonNumericDataError(StatisticalEngineError):
    """Error ketika kolom non-numerik digunakan pada analisis numerik."""
    def __init__(self, variable_name: str):
        super().__init__(
            f"Variabel '{variable_name}' memuat data non-numerik yang tidak valid untuk analisis ini.",
            code="NON_NUMERIC_DATA",
        )
        self.variable_name = variable_name

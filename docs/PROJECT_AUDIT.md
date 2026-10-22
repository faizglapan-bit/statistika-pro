# Laporan Audit Proyek: Statistika Pro (Tahap 1–7)

**Tanggal Audit**: 21 Oktober 2026  
**Auditor**: Senior Full-Stack Engineer, Software Architect, QA & Security Engineer  
**Versi Aplikasi**: 1.0.0-alpha (Menuju Production-Ready)

---

## 1. Ikhtisar Arsitektur
Statistika Pro dibangun dengan arsitektur decoupled client-server:
- **Frontend**: Single Page Application (SPA) berbasis React 18, TypeScript, Tailwind CSS, Lucide Icons, dan Vite.
- **Backend**: RESTful API berbasis Python 3.12+, FastAPI, Uvicorn, Pydantic v2.
- **Komputasi Statistik**: pandas, NumPy, SciPy (stats), dan statsmodels.
- **Penyimpanan Lokal**: Sistem file terstruktur JSON dengan atomic writes dan arsip proyek `.statpro` (ZIP bundle).

---

## 2. Hasil Audit Komponen & Modul

### A. Data Editor & Manajemen Variabel
- **Data View**: Virtualized Spreadsheet Grid mampu menangani 1.000+ baris data dengan performa rendering 60 FPS, navigasi keyboard (panah, enter, tab), copy-paste dua arah dengan Microsoft Excel.
- **Variable View**: Mendukung 8 atribut SPSS: Name, Type (Numeric/String), Width, Decimals, Label, Values (Value Labels dialog), Missing (Discrete missing values), dan Measure (Nominal, Ordinal, Scale).
- **Import/Export**: Auto-detect delimiter CSV (koma, titik-koma, tab), XLSX multi-sheet parsing. Ekspor dataset ke CSV dan XLSX berlabel.

### B. Statistical Engine (Tahap 3 & Tahap 6)
- **Uji Deskriptif**: Mean, Median, Mode, Std Dev, Variance, Min, Max, Range, Skewness, Kurtosis.
- **Validitas & Reliabilitas**: Korelasi Pearson corrected item-total ($r > 0.3$), Cronbach's Alpha dengan analisis *if item deleted*.
- **Korelasi & Regresi Linear**: Matriks korelasi Pearson & Spearman dengan uji signifikansi $p$-value; Regresi Linear OLS Berganda ($R, R^2, \text{Adj } R^2, F$-test, $t$-test koefisien, 95% CI); Uji Asumsi Klasik (Kolmogorov-Smirnov normalitas residual, VIF multikolinearitas, Durbin-Watson autokorelasi, Uji Glejser heteroskedastisitas).
- **Uji Beda (t-test)**: One-Sample, Independent Samples (Student & Welch, Uji Levene), Paired Samples (wide format); Effect size (Cohen's $d$, Hedges' $g$, Glass's $\Delta$).
- **ANOVA**: One-Way ANOVA, Welch ANOVA, Uji Homogenitas Levene, Post-Hoc Tukey HSD & Games-Howell, Eta Squared ($\eta^2$), Omega Squared ($\omega^2$).
- **Statistik Nonparametrik**: Mann-Whitney U, Wilcoxon Signed-Rank, Kruskal-Wallis (+ Dunn-Bonferroni Post-Hoc), Friedman Test, Kendall's Tau-b.
- **Crosstabs & Chi-Square**: Tabel silang $R \times C$, Observed/Expected counts, Row/Col/Total %, Pearson Chi-Square, Yates Continuity Correction, Likelihood Ratio, Fisher's Exact ($2 \times 2$), Cramér's $V$, peringatan sel $E < 5$.
- **Regresi Logistik Biner**: MLE Logit, Dummy Coding, Odds Ratio $\text{Exp}(B)$, Wald test, Omnibus $\chi^2$, Pseudo-$R^2$ (Cox & Snell, Nagelkerke, McFadden), Hosmer-Lemeshow, Confusion Matrix dinamis.

### C. Transformasi Data & Manajemen Kasus (Tahap 5)
- **Compute Variable**: AST Expression Parser mandiri tanpa `eval()` / `exec()`.
- **Recode Variable**: Pemetaan aturan eksplisit (tunggal, range, ELSE).
- **Reverse Scoring, Composite Score, Z-Score, Binning**: Berjalan presisi dengan audit trail snapshot rollback 1-klik.
- **Case Management**: Filter/Select Cases (redup visual), Sort Cases multi-kolom, Identifikasi & Pembersihan Duplikat, Ringkasan Missing Values.

### D. Output Viewer & Pelaporan
- **Output Viewer**: Riwayat analisis terstruktur, salin tabel TSV, cetak PDF, badge deteksi dataset stale.
- **Report Generator**: Pembuatan laporan akademik standar APA 7 dalam 3 format: PDF (`reportlab`), DOCX (`python-docx`), dan XLSX (`openpyxl`).

---

## 3. Hasil Audit Keamanan & Keandalan (Pra-Tahap 7)
| Area | Status Awal | Temuan & Rekomendasi Tahap 7 |
| :--- | :--- | :--- |
| **Penyimpanan Proyek** | Parsial | Sebelumnya hanya menyimpan dataset dan output terpisah. Diperlukan paket proyek utuh `.statpro` (ZIP) untuk portabilitas riset. |
| **CSV Formula Injection** | Rentan | Sel yang diawali `=`, `+`, `-`, `@` belum disanitasi saat ekspor CSV. Wajib ditambahkan single-quote prefix. |
| **Path Traversal & Zip-Slip** | Perlu Proteksi | Pengunggahan file proyek arsip wajib memeriksa nama file agar tidak keluar direktori kerja (`commonpath` check). |
| **Atomic Writes** | Belum Menyeluruh | Penyimpanan langsung menulis ke berkas tujuan. Perlu mekanisme tulis ke `.tmp` lalu rename atomik. |
| **Error Leakage** | Terkendali | FastAPI mengembalikan pesan validasi Pydantic standar, namun perlu skema error terpadu tanpa rincian path sistem. |
| **Batas Ukuran Upload** | Belum Dibatasi | Diperlukan pembatasan ukuran payload upload (default 50 MB) dan batas baris dataset (default 100.000). |

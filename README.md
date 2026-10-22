# Statistika Pro

> Platform analisis statistik profesional berbasis web — alternatif SPSS yang berjalan di browser.

[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue)](apps/web)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-green)](apps/api)
[![Status](https://img.shields.io/badge/Tahap-7%20Production%20Readiness%20%26%20Project%20Management-brightgreen)](docs/)

---

## 📋 Persyaratan Sistem

| Komponen | Versi Minimum | Catatan |
|----------|---------------|---------|
| **Node.js** | v18 atau lebih baru | Direkomendasikan v20+ |
| **npm** | v9 atau lebih baru | Sudah termasuk dalam Node.js |
| **Python** | v3.10 atau lebih baru | Direkomendasikan v3.12+ |

---

## 🚀 Menjalankan Aplikasi

### Opsi A: Berjalan Otomatis di Latar Belakang (Windows Startup) - Direkomendasikan
Aplikasi sudah terkonfigurasi untuk berjalan otomatis di latar belakang saat Windows dinyalakan.

Anda dapat mengontrol layanan kapan saja menggunakan file batch di root folder:
- **`start-service.bat`**: Menjalankan API & Frontend di latar belakang (*silent mode*).
- **`stop-service.bat`**: Menghentikan layanan API (port 8000) dan Frontend (port 5173).
- **`status.bat`**: Memeriksa status keaktifan layanan dan tautan akses.
- **`restart-service.bat`**: Me-restart kedua layanan.
- **`install-startup.bat`**: Mendaftarkan kembali ke Windows Startup jika sebelumnya dicabut.
- **`uninstall-startup.bat`**: Mencabut otomatisasi startup dari Windows.

> **Catatan Log:** Output log otomatis dicatat di `logs/api.log` dan `logs/web.log`.

---

### Opsi B: Menggunakan Terminal Root
Cukup jalankan dari folder utama `SPSS`:
```powershell
npm run dev
```
Perintah ini akan menjalankan FastAPI dan Vite secara terpadu.

---

### Opsi C: Manual 2 Terminal

#### 1. Frontend (Terminal 1)
```powershell
cd apps\web
npm install
npm run dev
```
Akses frontend di: **http://localhost:5173**

#### 2. Backend (Terminal 2)
```powershell
cd apps\api
.venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Akses backend di:
- **API Docs:** http://127.0.0.1:8000/api/docs
- **Health Check:** http://127.0.0.1:8000/api/health

---

## ✅ Fitur yang Sudah Tersedia (Tahap 1 s/d 7)

| Fitur | Status | Keterangan |
|-------|--------|------------|
| **Manajemen Proyek (.statpro)** | ✅ Berfungsi | Format paket riset mandiri berversi (`.statpro` ZIP bundle), CRUD proyek, duplikasi, ekspor/impor aman |
| **Header Project Bar & Dirty-State**| ✅ Berfungsi | Indikator status "Tersimpan" / "Belum Disimpan", tombol Simpan Cepat (`Ctrl+S`), konfirmasi cegah kehilangan data |
| **Hardening Keamanan & Reliabilitas**| ✅ Berfungsi | Proteksi CSV Formula Injection, proteksi Zip-Slip & bomb dekompresi, *Atomic File Writes*, sanitasi error global |
| **Dashboard** | ✅ Berfungsi | Tampilan status proyek, metrik dataset, dan status koneksi API |
| **Data View (Spreadsheet)** | ✅ Berfungsi | Grid tervirtualisasi, 1.000+ baris lancar, navigasi keyboard, copy-paste Excel |
| **Variable View** | ✅ Berfungsi | Konfigurasi kolom: Name, Type, Width, Decimals, Label, Values, Missing, Measure |
| **Value Labels & Missing Values** | ✅ Berfungsi | Pengaturan kategori nilai kuesioner ala SPSS dan kode missing diskrit |
| **Impor & Ekspor Dataset** | ✅ Berfungsi | Impor CSV/XLSX dengan auto-detect delimiter, ekspor multi-sheet XLSX & CSV tersanitasi |
| **Statistical Engine Dasar** | ✅ Berfungsi | Deskriptif, validitas ($r > 0.3$), reliabilitas Cronbach Alpha, korelasi Pearson/Spearman, regresi linear OLS, dan uji asumsi klasik |
| **Modal Dialogs Analisis** | ✅ Berfungsi | Dialog modal SPSS dengan transfer variabel (`>`, `<`), validasi, reset, dan interpretasi |
| **Output Viewer & Re-run** | ✅ Berfungsi | Riwayat hasil analisis, badge kesesuaian waktu dataset, salin tabel TSV, cetak PDF, tombol *Jalankan Ulang* |
| **Hitung & Rekode Variabel** | ✅ Berfungsi | Evaluator ekspresi AST aman tanpa `eval`/`exec`, rekode fleksibel, reverse scoring, skor komposit, Z-score, dan binning |
| **Manajemen Kasus** | ✅ Berfungsi | Filter/Select Cases (redup visual di grid), Sort Cases multi-kolom, identifikasi duplikat, dan ringkasan missing |
| **Generator Laporan Akademik (APA 7)**| ✅ Berfungsi | Ekspor dokumen lengkap multi-format: **PDF** (`reportlab`), **DOCX** (`python-docx`), dan **XLSX** (`openpyxl`) |
| **Uji Beda Rata-rata (t-test)** | ✅ Berfungsi | One-Sample, Independent Samples (Student & Welch t-test, uji Levene), Paired Samples (wide format). Ukuran efek: Cohen's $d$, Hedges' $g$, Glass's $\Delta$ |
| **Analisis Varians (ANOVA)** | ✅ Berfungsi | One-Way ANOVA, Welch ANOVA, uji homogenitas varians Levene, Post-Hoc Tukey HSD & Games-Howell, efek $\eta^2$ dan $\omega^2$ |
| **Statistik Nonparametrik** | ✅ Berfungsi | Mann-Whitney U, Wilcoxon Signed-Rank, Kruskal-Wallis (+ Uji Dunn koreksi Bonferroni), Uji Friedman, Korelasi Kendall's Tau-b |
| **Tabel Kontingensi & Chi-Square** | ✅ Berfungsi | Frekuensi teramati & terharap, % baris, % kolom, % total, Pearson $\chi^2$, Koreksi Kontinuitas Yates, Rasio Likelihood, Fisher's Exact ($2\times 2$), Cramér's $V$, serta peringatan sel $E < 5$ |
| **Regresi Logistik Biner** | ✅ Berfungsi | Estimasi Logit MLE, Odds Ratio $\text{Exp}(B)$ + CI 95%, Uji Wald, Omnibus Test of Model Coefficients $\chi^2$, Pseudo-$R^2$ (Cox & Snell, Nagelkerke, McFadden), Hosmer-Lemeshow goodness-of-fit, Confusion Matrix & Akurasi dengan ambang batas (cutoff) dinamis |
| **Visualisasi Statistik Hibrida** | ✅ Berfungsi | Agregasi matematis server-side: Histogram + kurva densitas normal, Boxplot 5-angka Tukey + deteksi outliers IQR, Scatter Plot + garis tren OLS, Bar Chart + 95% CI error bar, Heatmap Korelasi, Normal Q-Q Plot. Rendering client-side interaktif dengan ekspor PNG instan |

---

## 🧪 Menjalankan Pengujian Otomatis

### 1. Pengujian Backend (FastAPI + Pytest)
Menjalankan **83 skenario pengujian komprehensif** (impor CSV/XLSX, missing values, CRUD baris/kolom, benchmark engine statistik dasar, AST safe parser, transformasi rekode/z-score/reverse/komposit, manajemen kasus duplikat/sort/filter, generator laporan multi-format, t-test, ANOVA, 5 uji nonparametrik, Crosstabs Chi-Square, Regresi Logistik Biner, agregasi visualisasi data, manajemen proyek `.statpro`, atomic writes, proteksi Zip-Slip, proteksi CSV formula injection, dan endpoint REST API):

```powershell
cd apps\api
.venv\Scripts\Activate.ps1
pytest -v
```
*Hasil: 83 passed (100% lulus)*

### 2. Pengujian Frontend (Vitest + React Testing Library)
Menjalankan **32 skenario unit & integration tests** untuk DataGrid spreadsheet, Variable View, dialog analisis modal, Output Viewer, dialog transformasi Tahap 5, Report Generator, hub Statistik Lanjutan, modal analitik Tahap 6, ProjectHeaderBar, ProjectManagerModal, dan UnsavedChangesModal:

```powershell
cd apps\web
npm test
```
*Hasil: 32 passed (100% lulus)*

### 3. Build Frontend Produksi
```powershell
cd apps\web
npm run build
```
*Hasil: Vite production build berhasil tanpa error (0 warning/error TypeScript)*

---

## 📚 Dokumentasi Lengkap
Tersedia dokumentasi teknis dan operasional di folder `docs/`:
- [`docs/PROJECT_AUDIT.md`](docs/PROJECT_AUDIT.md): Laporan audit arsitektur dan sistem menyeluruh.
- [`docs/FEATURE_STATUS.md`](docs/FEATURE_STATUS.md): Matriks status operasional setiap modul dan fitur.
- [`docs/KNOWN_ISSUES.md`](docs/KNOWN_ISSUES.md): Batasan teknis, konkurensi, dan mitigasi skenario tepi (*edge cases*).
- [`docs/INSTALLATION.md`](docs/INSTALLATION.md): Panduan instalasi dan deployment lokal workstation.
- [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md): Panduan lengkap alur kerja pengguna dari input data hingga laporan riset.
- [`docs/SECURITY.md`](docs/SECURITY.md): Kebijakan keamanan, model ancaman, formula injection, dan sanitasi berkas.
- [`docs/BACKUP_AND_RECOVERY.md`](docs/BACKUP_AND_RECOVERY.md): Prosedur pencadangan paket `.statpro` dan pemulihan data.
- [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md): Daftar periksa verifikasi pra-rilis produksi.

---

## 🗂️ Struktur Proyek

```
statistika-pro/
├── apps/
│   ├── web/              # Frontend React + TypeScript + Vite
│   │   ├── src/
│   │   │   ├── components/   # Komponen UI
│   │   │   ├── contexts/     # React Context (bahasa)
│   │   │   ├── hooks/        # Custom hooks
│   │   │   ├── i18n/         # Terjemahan ID/EN
│   │   │   └── types/        # TypeScript types
│   │   └── package.json
│   └── api/              # Backend FastAPI
│       ├── main.py           # Aplikasi utama
│       ├── config.py         # Konfigurasi
│       ├── tests/            # Tes backend
│       └── requirements.txt
├── docs/                 # Dokumentasi
├── scripts/              # Skrip pengembangan
├── .env.example          # Contoh environment variables
└── README.md
```

---

## ⚙️ Konfigurasi Environment Variables

Salin `.env.example` ke `.env` untuk menyesuaikan konfigurasi:

```powershell
copy .env.example .env
```

| Variable | Default | Keterangan |
|----------|---------|------------|
| `VITE_API_URL` | `http://127.0.0.1:8000` | URL backend API (frontend) |
| `API_HOST` | `127.0.0.1` | Host backend (hanya lokal!) |
| `API_PORT` | `8000` | Port backend |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Origin yang diizinkan |
| `APP_ENV` | `development` | Environment aplikasi |

> ⚠️ **Keamanan:** Backend dikonfigurasi untuk hanya menerima koneksi dari `127.0.0.1` (localhost) selama pengembangan. Jangan ubah ini ke `0.0.0.0` kecuali untuk produksi dengan pengamanan yang tepat.

---

## 📞 Dukungan

Proyek ini masih dalam tahap pengembangan awal. Laporkan masalah melalui sistem issue tracker.

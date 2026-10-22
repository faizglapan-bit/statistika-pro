# Daftar Periksa Rilis (Release Checklist): Statistika Pro v1.0.0

Daftar periksa ini wajib diverifikasi sebelum menerbitkan versi rilis baru dari Statistika Pro.

---

## 1. Verifikasi Kode & Pengujian Otomatis

- [x] **Backend Unit & Integration Tests**: 83 dari 83 skenario pengujian Pytest lulus 100%.
  - `pytest -v` (0 failed, 83 passed).
- [x] **Frontend Unit & Component Tests**: 32 dari 32 skenario pengujian Vitest lulus 100%.
  - `npm test -- --run` (0 failed, 32 passed).
- [x] **Kompilasi TypeScript & Production Build**:
  - `npm run build` berhasil tanpa error (0 error, 0 warning tipe data).
- [x] **Regression Testing**:
  - Fitur Tahap 1 (Dashboard & Fondasi UI) berfungsi normal.
  - Fitur Tahap 2 (DataGrid Spreadsheet & Variable View) berfungsi normal.
  - Fitur Tahap 3 (Statistical Engine Dasar) menghasilkan angka akurat.
  - Fitur Tahap 4 (Output Viewer & Dialog Modals) berfungsi normal.
  - Fitur Tahap 5 (Transformasi Data & Report Generator APA 7) berfungsi normal.
  - Fitur Tahap 6 (Uji Beda, ANOVA, Nonparametrik, Crosstabs, Logistik, Grafik) berfungsi normal.
  - Fitur Tahap 7 (Project Management, Security Hardening, Reliability) berfungsi normal.

---

## 2. Pemeriksaan Keamanan (*Security Hardening*)

- [x] **Pencegahan CSV Formula Injection**: Sel berkarakter `=`, `+`, `-`, `@`, `\t`, `\r` otomatis di-escape dengan kutip tunggal saat ekspor CSV.
- [x] **Proteksi Zip-Slip**: Ekstraksi paket proyek `.statpro` memvalidasi traversal path `commonpath`.
- [x] **Proteksi Decompression Bomb**: Dekompresi berkas dibatasi maksimal 100 MB.
- [x] **Zero Insecure Pickle**: Tidak ada serialisasi arbitrer dengan pickle.
- [x] **Penyimpanan Atomik (Atomic File Writes)**: Berkas JSON ditulis via `.tmp` dan `os.replace()`.
- [x] **CORS Enforcement**: Backend membatasi origin hanya ke host yang diizinkan (`localhost:5173`).
- [x] **Batas Ukuran Upload**: Dibatasi 50 MB / 100.000 baris.
- [x] **Sanitasi Error Global**: Tidak ada stack trace sistem atau kredensial internal yang bocor ke respons HTTP.

---

## 3. Keandalan & Pengalaman Pengguna (*Reliability & UX*)

- [x] **Status Indikator Dirty-State**: Menampilkan penanda "Tersimpan" / "Belum Disimpan" dengan titik berwarna.
- [x] **Pintasan Simpan Cepat**: Pintasan keyboard `Ctrl+S` / `Cmd+S` berfungsi menyimpan proyek dan dataset.
- [x] **Pencegahan Kehilangan Data**: Konfirmasi dialog muncul jika pengguna mencoba berpindah proyek atau menutup browser saat ada perubahan yang belum disimpan.
- [x] **Reproduksibilitas Analisis**: Tombol *Jalankan Ulang* membuka kembali dialog analisis dengan konfigurasi variabel yang tersimpan.
- [x] **Health Check Komprehensif**: Endpoint `/api/health` memantau kesiapan API, kondisi penyimpanan, dan kapasitas disk lokal.

---

## 4. Kelengkapan Dokumentasi

- [x] `README.md`: Ringkasan arsitektur, panduan singkat, status fitur, dan metrik tes.
- [x] `docs/PROJECT_AUDIT.md`: Laporan audit sistem menyeluruh.
- [x] `docs/FEATURE_STATUS.md`: Matriks status operasional seluruh modul.
- [x] `docs/KNOWN_ISSUES.md`: Batasan teknis dan mitigasi skenario tepi.
- [x] `docs/INSTALLATION.md`: Panduan instalasi dan deployment workstation lokal.
- [x] `docs/USER_GUIDE.md`: Buku petunjuk alur kerja pengguna dari hulu ke hilir.
- [x] `docs/SECURITY.md`: Model ancaman dan arsitektur pertahanan keamanan.
- [x] `docs/BACKUP_AND_RECOVERY.md`: Strategi cadangan berkas `.statpro` dan pemulihan data.

# Kebijakan Keamanan (Security Policy): Statistika Pro

Dokumen ini menjelaskan model ancaman (*Threat Model*), mekanisme pertahanan yang diterapkan di Statistika Pro, serta rekomendasi pengoperasian aman.

---

## 1. Model Ancaman & Lingkup Operasional

### Lingkup Penggunaan Saat Ini
Statistika Pro dirancang sebagai aplikasi **Desktop / Workstation Lokal**. 
- Server backend berjalan secara default pada host loopback `127.0.0.1` port `8000`.
- Server frontend Vite berjalan pada `localhost` port `5173`.
- Tidak ada data pengguna yang dikirim ke cloud atau pihak ketiga mana pun tanpa otorisasi eksplisit pengguna.

> ⚠️ **Peringatan Keamanan Jaringan**: Jangan mengubah `API_HOST` menjadi `0.0.0.0` kecuali backend dilindungi oleh lapisan autentikasi (Reverse Proxy, NGINX, Cloudflare Access, atau VPN privat). Server lokal tidak memiliki autentikasi multi-tenant bawaan.

---

## 2. Mekanisme Pertahanan Keamanan yang Diimplementasikan

### A. Pencegahan CSV Formula Injection (Spreadsheet Macro Injection)
- **Risiko**: Nilai sel yang diawali karakter `=`, `+`, `-`, `@`, `\t`, `\r` dapat dieksekusi oleh Microsoft Excel atau LibreOffice sebagai rumus DDE berbahaya saat berkas CSV dibuka.
- **Implementasi Pertahanan**:
  - Pada `services/storage_security.py::sanitize_formula_cell()`, setiap nilai sel string yang diawali karakter tersebut dan bukan angka numerik standar otomatis diberi awalan kutip tunggal (`'`).
  - Nilai angka negatif valid (mis. `-15.4`) atau positif (mis. `+3`) tetap dipertahankan sebagai angka tanpa kutip agar kalkulasi statistik tidak rusak.

### B. Proteksi Path Traversal & Zip-Slip pada Berkas `.statpro`
- **Risiko**: Arsip proyek `.statpro` (ZIP) buatan penyerang dapat memuat nama berkas berbahaya seperti `../../../../etc/passwd` atau `../../scripts/evil.bat`.
- **Implementasi Pertahanan**:
  - Pada `services/storage_security.py::safe_extract_zip()`, setiap entri berkas diverifikasi menggunakan `os.path.commonpath([target_dir, resolved_path])`.
  - Jika berkas mencoba menulis di luar direktori sandbox temporer yang ditentukan, proses ekstraksi langsung digagalkan dengan `ValueError`.

### C. Proteksi Decompression Bomb (Zip Bomb)
- **Risiko**: Berkas arsip kecil yang mengembang menjadi puluhan gigabyte saat diekstrak, menyebabkan kehabisan ruang disk (*Denial of Service*).
- **Implementasi Pertahanan**:
  - Diterapkan batasan akumulatif total ukuran dekompresi maksimum 100 MB per berkas `.statpro`. Jika melebihi batas tersebut, ekstraksi dibatalkan.

### D. Zero Arbitrary Pickle Execution
- **Risiko**: Penggunaan modul `pickle` bawaan Python untuk menyimpan file proyek sangat rentan terhadap *Remote Code Execution (RCE)* melalui muatan `__reduce__`.
- **Implementasi Pertahanan**:
  - Tidak ada modul `pickle` yang digunakan untuk serialisasi atau deserialisasi proyek.
  - Seluruh struktur berkas `.statpro` dan dokumen menggunakan format terbuka JSON tervalidasi skema Pydantic v2.

### E. Penyimpanan Atomik (Atomic File Writes)
- **Risiko**: Server mati mendadak saat menulis berkas JSON dapat menyebabkan berkas korup (*half-written file*).
- **Implementasi Pertahanan**:
  - `atomic_write_json()` menulis ke berkas sementara `.tmp.<uuid>`, memanggil `f.flush()` dan `os.fsync()`, lalu melakukan operasi penggantian atomik sistem operasi `os.replace()`.

### F. Eksekusi Rumus Komputasi Variabel Tanpa `eval()`
- **Risiko**: Peneliti yang memasukkan ekspresi pada fitur *Compute Variable* dapat menyusupkan kode Python berbahaya jika menggunakan fungsi bawaan `eval()` atau `exec()`.
- **Implementasi Pertahanan**:
  - Digunakan Abstract Syntax Tree (`ast`) Safe Evaluator khusus pada `transformation_engine/evaluator.py` yang hanya mengizinkan node matematika aritmatika dasar (`Add`, `Sub`, `Mult`, `Div`, `Pow`) dan fungsi matematika tertentu (`sqrt`, `abs`, `log`, `round`).

### G. Pembatasan Ukuran & Volume Data
- `UPLOAD_MAX_SIZE_MB`: Dibatasi maksimal 50 MB per berkas (dapat disesuaikan di `.env`).
- `MAX_DATASET_ROWS`: 100.000 baris.
- `MAX_DATASET_COLS`: 500 kolom.

### H. Sanitasi Pesan Error
- Exception handler global pada `main.py` menangkap error tak tertangani tanpa membocorkan path absolut sistem operasi lokal kepada pengguna.

---

## 3. Rekomendasi Deployment Publik (Jika Diterapkan di Masa Depan)
Jika aplikasi ini akan dipublikasikan ke internet atau digunakan oleh banyak pengguna secara bersamaan:
1. Pasang Reverse Proxy (NGINX / Caddy) dengan sertifikat SSL/TLS (HTTPS).
2. Terapkan lapisan autentikasi OAuth2 / JWT dan session management.
3. Batasi laju permintaan (*Rate Limiting*) per IP address.
4. Terapkan sandboxing atau containerization (Docker) dengan hak akses non-root.

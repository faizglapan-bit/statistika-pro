# Panduan Pencadangan & Pemulihan (Backup & Recovery): Statistika Pro

Dokumen ini menjelaskan strategi dan prosedur untuk mencadangkan serta memulihkan data penelitian di Statistika Pro.

---

## 1. Lokasi Penyimpanan Data Sistem

Seluruh data persistensi Statistika Pro disimpan di direktori `apps/api/data/`:
```
apps/api/data/
├── datasets/             # Berkas dataset mentah (*.json) dan index.json
├── projects/             # Berkas proyek (*.json), audit_log.json, outputs.json
│   ├── index.json        # Katalog indeks seluruh proyek
│   └── .backups/         # Cadangan keselamatan otomatis sebelum proyek dihapus
└── outputs/              # Arsip dokumen output analisis dan grafik
```

---

## 2. Metode Pencadangan (Backup)

### A. Ekspor Paket Mandiri Berkas `.statpro` (Metode Utama yang Direkomendasikan)
Metode ini adalah cara termudah dan paling aman untuk mengarsipkan riset per proyek:
1. Buka aplikasi Statistika Pro di browser.
2. Pada bilah atas (*Project Header Bar*), klik menu **Aksi** $\to$ pilih **Ekspor Arsip (.statpro)**.
3. Anda juga dapat membuka **Manajer Proyek** dan mengklik ikon unduh pada proyek yang diinginkan.
4. Berkas `.statpro` yang dihasilkan adalah arsip kompresi ZIP standar yang memuat:
   - `manifest.json` (versi format dan metadata ekspor)
   - `project.json` (nama dan deskripsi proyek)
   - `dataset.json` (seluruh baris data dan kamus variabel)
   - `audit_log.json` (riwayat transformasi data)
   - `outputs.json` (seluruh dokumen output analisis yang pernah dihitung)
5. Simpan berkas `.statpro` ini di flashdisk, Google Drive, OneDrive, atau media penyimpanan eksternal.

### B. Pencadangan Manual Folder `data/` (Pencadangan Penuh Server)
Untuk mencadangkan seluruh proyek, dataset, dan riwayat analisis sekaligus:
1. Pastikan server backend sedang tidak melakukan operasi tulis berat.
2. Salin folder `apps/api/data` ke lokasi cadangan yang aman:
   ```powershell
   # Contoh perintah backup di Windows PowerShell:
   Copy-Item -Path "apps\api\data" -Destination "D:\Backups\StatistikaPro_Data_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse
   ```

### C. Cadangan Keselamatan Otomatis (.backups)
Ketika Anda menghapus sebuah proyek melalui antarmuka Manajer Proyek, sistem secara otomatis membuat salinan darurat dari direktori proyek tersebut di dalam folder `apps/api/data/projects/.backups/` dengan penanda waktu.

---

## 3. Prosedur Pemulihan (Recovery)

### A. Memulihkan Proyek dari Berkas `.statpro`
1. Buka aplikasi Statistika Pro.
2. Klik tombol **Buka Manajer Proyek** pada header atas.
3. Klik tombol **Impor .statpro**.
4. Pilih berkas `.statpro` dari komputer Anda.
5. Sistem akan:
   - Memvalidasi integritas arsip ZIP dan skema manifest JSON.
   - Memastikan tidak ada risiko *Zip-Slip*.
   - Membuat entitas proyek dan dataset baru yang sepenuhnya terisolasi dan siap digunakan.

### B. Memulihkan Folder `data/` Penuh
Jika terjadi kerusakan sistem operasi atau migrasi ke komputer baru:
1. Pasang aplikasi Statistika Pro di komputer baru sesuai panduan `docs/INSTALLATION.md`.
2. Hentikan server backend.
3. Timpa isi direktori `apps/api/data/` dengan isi folder cadangan Anda.
4. Jalankan kembali server backend:
   ```powershell
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
5. Buka frontend, seluruh proyek, dataset, dan riwayat analisis akan kembali tampil seperti semula.

---

## 4. Penanganan Berkas Rusak (Corrupted Files)
Jika sebuah proyek mengalami kegagalan baca (misal akibat penghentian paksa sistem operasi non-atomik):
1. Periksa folder `apps/api/data/projects/<id_proyek>/`.
2. Jika berkas `project.json` berukuran 0 byte, periksa apakah terdapat berkas sementara `.tmp` di folder tersebut.
3. Ganti nama berkas `.tmp` yang valid menjadi `project.json`.
4. Jika tidak tersedia, pulihkan dari folder `.backups/` atau impor ulang dari berkas `.statpro` cadangan.

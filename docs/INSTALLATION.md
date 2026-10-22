# Panduan Instalasi & Menjalankan Statistika Pro

Dokumen ini menyediakan panduan instalasi langkah-demi-langkah untuk menyiapkan dan menjalankan Statistika Pro di lingkungan lokal atau workstation.

---

## 1. Prasyarat Sistem

| Perangkat Lunak | Versi Minimum | Rekomendasi | Catatan |
| :--- | :--- | :--- | :--- |
| **Node.js** | v18.0.0 | v20.x atau v22.x LTS | Diperlukan untuk frontend React/Vite |
| **npm** | v9.0.0 | v10.x | Disertakan bersama Node.js |
| **Python** | v3.10 | v3.12+ (64-bit) | Diperlukan untuk backend FastAPI |
| **Sistem Operasi** | Windows 10/11, macOS, atau Linux (Ubuntu 22.04+) | Windows 11 / Linux | Diuji penuh pada Windows PowerShell |

---

## 2. Pengaturan Lingkungan Backend (`apps/api`)

### Langkah 1: Masuk ke Direktori Backend
```powershell
cd apps\api
```

### Langkah 2: Buat Lingkungan Virtual Python (`venv`)
```powershell
python -m venv .venv
```

### Langkah 3: Aktifkan Lingkungan Virtual
- **Windows (PowerShell)**:
  ```powershell
  .venv\Scripts\Activate.ps1
  ```
- **macOS / Linux**:
  ```bash
  source .venv/bin/activate
  ```

### Langkah 4: Pasang Dependensi
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

### Langkah 5: Konfigurasi Environment Variables
Salin konfigurasi dasar dari template root jika belum ada:
```powershell
copy .env.example .env
```
Variabel kunci backend:
- `API_HOST=127.0.0.1` (Default hanya localhost untuk keamanan)
- `API_PORT=8000`
- `CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- `APP_ENV=development`
- `UPLOAD_MAX_SIZE_MB=50`
- `MAX_DATASET_ROWS=100000`

### Langkah 6: Jalankan Server Backend
```powershell
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
Akses verifikasi:
- **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- **Swagger API Docs**: [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs)

---

## 3. Pengaturan Lingkungan Frontend (`apps/web`)

### Langkah 1: Masuk ke Direktori Frontend (Terminal Baru)
```powershell
cd apps\web
```

### Langkah 2: Pasang Paket NPM
```powershell
npm install
```

### Langkah 3: Jalankan Dev Server Vite
```powershell
npm run dev
```
Buka browser Anda di: **http://localhost:5173**

---

## 4. Menjalankan Pengujian Otomatis

### Pengujian Backend (83 Skenario Pytest)
```powershell
cd apps\api
.venv\Scripts\Activate.ps1
pytest -v
```

### Pengujian Frontend (32 Skenario Vitest)
```powershell
cd apps\web
npm test -- --run
```

### Build Produksi Frontend
```powershell
cd apps\web
npm run build
```
Hasil build produksi yang siap didistribusikan tersimpan di direktori `apps/web/dist/`.

---

## 5. Menghentikan Aplikasi
Untuk mematikan aplikasi dengan aman:
- Tekan `Ctrl + C` pada terminal backend (uvicorn).
- Tekan `Ctrl + C` pada terminal frontend (vite).

# Batasan Sistem & Isu Diketahui (Known Issues)

Dokumen ini mendokumentasikan batasan teknis yang diketahui, skenario tepi (*edge cases*), dan mitigasi keamanan untuk aplikasi Statistika Pro.

---

## 1. Batasan Lingkungan & Konkurensi
1. **Mode Single-User Desktop/Lokal**:
   - *Deskripsi*: Aplikasi dirancang optimal untuk alur kerja workstation lokal (peneliti tunggal).
   - *Batasan*: Belum dilengkapi sistem autentikasi multi-tenant (JWT/OAuth) dan row-level database locking.
   - *Mitigasi*: Backend default mendengarkan hanya pada host lokal `127.0.0.1` port `8000`. Jika dijalankan di jaringan publik, diperlukan reverse proxy dengan SSL/TLS dan otentikasi lapis depan.

2. **Ukuran Dataset & Memori Browser**:
   - *Deskripsi*: DataGrid spreadsheet frontend merender data dalam memori JavaScript (DOM virtualized).
   - *Batasan*: Dataset di atas 100.000 baris atau 500 kolom dapat menurunkan responsivitas browser pada perangkat berspesifikasi rendah.
   - *Mitigasi*: Ditetapkan batas konfigurasi `MAX_DATASET_ROWS=100000` dan `MAX_DATASET_COLS=500` di backend serta peringatan ukuran saat impor data besar.

---

## 2. Isu Metodologis & Batasan Statistik
1. **Regresi Logistik: Separasi Sempurna (*Quasi-complete Separation*)**:
   - *Kondisi*: Jika suatu prediktor dapat memisahkan variabel dependen biner secara 100% sempurna tanpa tumpang-tindih (mis. semua nilai $x > 50$ memiliki $y = 1$), estimasi MLE tidak konvergen (koefisien mendekati tak terhingga).
   - *Penanganan*: Engine menangkap `PerfectSeparationWarning` dan `ConvergenceWarning` dari statsmodels, menyertakan catatan peringatan pada output ringkasan model, dan menghindari crash server.

2. **Matriks Kovarians Singular pada Regresi OLS**:
   - *Kondisi*: Kolom independen yang memiliki multikolinearitas sempurna ($r = 1.0$) menyebabkan matriks singular tak terinversi.
   - *Penanganan*: Ditangani dengan pesan validasi ramah pengguna yang menyarankan menghapus salah satu variabel yang redundan.

3. **Uji Fisher's Exact pada Tabel Lebih Besar dari $2 \times 2$**:
   - *Kondisi*: Komputasi faktorial eksak pada tabel $R \times C$ besar sangat membebani CPU secara eksponensial.
   - *Penanganan*: Sesuai standar SPSS, Fisher's Exact Test hanya diaktifkan secara otomatis untuk tabel kontingensi $2 \times 2$. Untuk tabel yang lebih besar, digunakan Pearson Chi-Square dengan peringatan sel ekspektasi rendah ($E < 5$).

---

## 3. Keamanan File & Sistem
1. **Pencegahan CSV Formula Injection**:
   - *Kondisi*: Spreadsheet (Microsoft Excel, LibreOffice Calc) mengeksekusi rumus jika teks sel diawali karakter `=`, `+`, `-`, `@`, `\t`, `\r`.
   - *Penanganan*: Seluruh ekspor CSV otomatis menambahkan kutip tunggal `'` di awal sel string yang berpotensi formulaik.

2. **Proteksi Zip-Slip pada Impor `.statpro`**:
   - *Kondisi*: Berkas zip berbahaya dapat memuat nama jalur relatif seperti `../../etc/passwd`.
   - *Penanganan*: Seluruh berkas yang diekstraksi divalidasi dengan `os.path.commonpath` untuk memastikan tidak ada berkas yang ditulis di luar folder sandbox temporer.

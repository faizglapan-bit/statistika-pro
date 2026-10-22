# Panduan Pengguna (User Guide): Statistika Pro

Statistika Pro adalah perangkat lunak analisis data penelitian dan statistik terapan berbasis web yang memadukan alur kerja intuitif spreadsheet seperti IBM SPSS Statistics dengan kecepatan dan visual modern aplikasi web kontemporer.

---

## 1. Memulai Aplikasi & Manajemen Proyek (.statpro)

### Header Proyek Terpadu
Di bagian paling atas layar, terdapat bilah **Project Header Bar**:
- **Nama Proyek**: Klik langsung pada nama proyek untuk mengubah judul riset.
- **Indikator Dirty-State**:
  - 🟢 **Tersimpan**: Menandakan seluruh perubahan dataset dan riwayat analisis telah aman tersimpan di server.
  - 🟡 **Belum Disimpan**: Muncul seketika Anda mengedit sel, mengubah variabel, atau melakukan analisis baru.
- **Simpan Cepat (`Ctrl+S` / `Cmd+S`)**: Tekan tombol *Simpan Proyek* atau gunakan pintasan keyboard `Ctrl+S` untuk menyimpan data secara atomik.
- **Menu Aksi Proyek**:
  - **Buka Manajer Proyek**: Menampilkan daftar seluruh proyek lokal, ringkasan jumlah responden, dan tanggal modifikasi.
  - **Proyek Baru**: Membuat proyek baru dengan lembar kerja bersih.
  - **Gandakan Proyek**: Membuat klon independen proyek beserta datasetnya untuk eksperimen skenario alternatif.
  - **Ekspor Arsip (.statpro)**: Mengunduh satu berkas paket kompresi mandiri `.statpro` (ZIP bundle) berisi konfigurasi proyek, dataset lengkap, audit log, dan hasil analisis.
  - **Impor .statpro**: Mengunggah berkas `.statpro` yang diproduksi dari komputer lain secara aman.

---

## 2. Mengelola Data: Data View & Variable View

### Data View (Spreadsheet)
- **Navigasi Keyboard**: Gunakan tombol panah `← ↑ → ↓`, `Enter`, `Tab`, dan `Shift+Tab`.
- **Salin & Tempel**: Mendukung copy-paste dua arah dari dan ke Microsoft Excel atau Google Sheets (`Ctrl+C` / `Ctrl+V`).
- **Kelola Baris & Kolom**: Klik tombol *Tambah Baris* atau *Tambah Kolom*, serta tombol hapus baris/kolom pada menu toolbar.

### Variable View (Kamus Data)
Atur atribut setiap variabel:
1. **Name**: Nama teknis variabel (mis. `X1`, `Y`, `GENDER`).
2. **Type**: Tipe data (`Numeric` atau `String`).
3. **Width & Decimals**: Lebar kolom dan jumlah angka di belakang koma.
4. **Label**: Deskripsi panjang instrumen (mis. *"Tingkat Kepuasan Pelayanan"*).
5. **Values (Value Labels)**: Klik tombol nilai untuk memetakan angka kuesioner ke teks (mis. `1 = Sangat Tidak Setuju`, `5 = Sangat Setuju`).
6. **Missing**: Menentukan kode nilai hilang diskrit (mis. `99` atau `999`).
7. **Measure**: Skala pengukuran (`Scale`, `Ordinal`, atau `Nominal`).

---

## 3. Impor & Ekspor Data

### Impor Data (CSV / XLSX)
1. Klik tombol **Impor Data** pada toolbar.
2. Seret berkas CSV atau Excel ke kotak unggah.
3. Sistem mendeteksi otomatis delimiter (koma, titik koma, tab) dan lembar kerja (*sheet*).
4. Pratinjau 5 baris pertama akan muncul beserta tipe data hasil tebakan cerdas.
5. Klik **Konfirmasi Impor**.

### Ekspor Data Aman
- **CSV**: Ekspor otomatis dilengkapi sanitasi *Formula Injection* (menjaga sel yang diawali karakter formula agar tidak dieksekusi oleh Microsoft Excel).
- **Excel Multi-Sheet (.xlsx)**: Menghasilkan lembar kerja `Data` (isi responden) dan `Variable_Dictionary` (kamus atribut variabel).

---

## 4. Transformasi Data & Manajemen Kasus

Pada toolbar Data Editor, terdapat menu **Transformasi Data** dan **Manajemen Kasus**:
- **Hitung Variabel (Compute Variable)**: Bangun variabel baru dengan ekspresi matematika aman (mis. `skor_total = item1 + item2 + item3`).
- **Rekode Variabel (Recode)**: Mengubah nilai ke variabel baru dengan aturan nilai tunggal, rentang nilai, atau ELSE.
- **Skor Terbalik (Reverse Scoring)**: Membalik skala butir pernyataan negatif (mis. $1 \leftrightarrow 5$).
- **Standarisasi (Z-Score)**: Mengubah kolom ke skor standar $(x - \mu)/\sigma$.
- **Kategorisasi (Binning)**: Mengelompokkan variabel rasio ke kelompok ordinal berlabel.
- **Pilih Kasus (Select Cases)**: Terapkan kondisi filter (mis. `USIA >= 20`); baris yang tidak memenuhi syarat akan diberi efek redup visual.
- **Urutkan Kasus (Sort Cases)**: Urutkan data berdasarkan beberapa kolom sekaligus secara ascending/descending.
- **Identifikasi Duplikat**: Deteksi responden ganda berdasarkan kombinasi kolom kunci.
- **Ringkasan Missing**: Lihat rekapitulasi data kosong per variabel.
- **Riwayat Transformasi (Audit Trail)**: Pulihkan dataset ke versi sebelumnya (*1-Click Undo/Rollback*) jika terjadi kesalahan kalkulasi.

---

## 5. Melakukan Analisis Statistik

### Menu Analisis Dasar (Sidebar & Toolbar)
1. **Statistik Deskriptif**: Mean, Median, Mode, Std Dev, Variance, Skewness, Kurtosis.
2. **Uji Validitas Instrumen**: Korelasi Pearson corrected item-total vs nilai batas r-tabel ($r > 0.3$).
3. **Uji Reliabilitas**: Koefisien Cronbach's Alpha dan tabel *Alpha if Item Deleted*.
4. **Korelasi**: Matriks Pearson dan Spearman dua arah dengan signifikansi $p$-value.
5. **Regresi Linear OLS Berganda**: Model regresi $R, R^2$, Uji $F$, koefisien $B, t$, dan Uji Asumsi Klasik residual.

### Menu Statistik Lanjutan (*Tahap 6*)
Akses melalui menu **Statistik Lanjutan** pada Sidebar atau toolbar:
1. **Uji Beda (t-test)**:
   - One-Sample t-test.
   - Independent Samples t-test (dilengkapi Uji Homogenitas Levene, Student's $t$, Welch's $t$, Cohen's $d$, Hedges' $g$).
   - Paired Samples t-test (format berpasangan per baris responden).
2. **Analisis Varians (ANOVA)**:
   - One-Way ANOVA standar & Welch ANOVA.
   - Uji Homogenitas Varians Levene.
   - Post-Hoc otomatis: **Tukey HSD** (varians homogen) atau **Games-Howell** (varians heterogen).
   - Ukuran efek $\eta^2$ dan $\omega^2$.
3. **Statistik Nonparametrik**:
   - Mann-Whitney U (2 sampel independen ordinal).
   - Wilcoxon Signed-Rank (2 sampel berpasangan).
   - Kruskal-Wallis (+ Uji Dunn Post-Hoc dengan koreksi Bonferroni).
   - Uji Friedman (multi-kondisi berpasangan).
   - Korelasi Kendall's Tau-b.
4. **Tabel Kontingensi & Chi-Square**:
   - Crosstab $R \times C$ dengan persentase baris, kolom, dan total.
   - Pearson Chi-Square, Yates Continuity Correction, Likelihood Ratio, Fisher's Exact Test ($2 \times 2$), Cramér's $V$, dan peringatan sel $E < 5$.
5. **Regresi Logistik Biner**:
   - Estimasi Logit MLE, Odds Ratio $\text{Exp}(B)$ + CI 95%, Uji Wald.
   - Omnibus $\chi^2$, Pseudo-$R^2$ (Cox & Snell, Nagelkerke, McFadden).
   - Hosmer-Lemeshow Goodness-of-Fit.
   - Confusion Matrix & Akurasi dengan ambang batas (*cutoff*) interaktif.
6. **Visualisasi Interaktif**:
   - Histogram kurva normal, Boxplot Tukey, Scatter plot OLS, Bar chart CI 95%, Heatmap korelasi, Normal Q-Q Plot.
   - Tombol **Unduh PNG** untuk ekspor grafik beresolusi tinggi.

---

## 6. Output Viewer & Pembuatan Laporan

### Output Viewer
- Menampilkan seluruh dokumen hasil analisis secara kronologis.
- **Peringatan Stale Data**: Memberi penanda visual jika dataset aktif telah diubah setelah analisis dijalankan.
- **Salin Tabel TSV**: Klik tombol salin pada tabel mana pun untuk langsung menempelkannya ke Microsoft Word atau Excel dalam format tabel rapi.
- **Cetak / PDF**: Cetak dokumen output langsung dari browser.
- **Jalankan Ulang Analisis**: Klik tombol **Jalankan Ulang** (`RotateCcw`) untuk membuka kembali dialog modal analisis terkait dengan variabel dan opsi yang sudah terisi persis seperti konfigurasi semula.

### Generator Laporan Akademik (APA 7)
Navigasikan ke menu **Laporan**:
1. Masukkan judul riset, nama peneliti, dan afiliasi institusi.
2. Pilih bagian analisis yang ingin disertakan.
3. Pilih format ekspor:
   - **PDF**: Dokumen formal dengan tata letak profesional via ReportLab.
   - **Microsoft Word (.docx)**: Dokumen teks yang dapat diedit langsung untuk naskah skripsi/tesis/jurnal.
   - **Microsoft Excel (.xlsx)**: Lembar kerja multi-tab dengan styling tabel formal.

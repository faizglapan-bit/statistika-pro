# Status Fitur Statistika Pro

Dokumen ini melacak status operasional seluruh modul dan fitur aplikasi Statistika Pro berdasarkan audit empiris dan pengujian otomatis.

**Kategori Status**:
- 🟢 **Berfungsi**: Telah diuji secara unit, integrasi, dan berfungsi penuh di antarmuka pengguna.
- 🟡 **Perlu Perbaikan**: Berfungsi namun membutuhkan penyempurnaan stabilitas, validasi, atau keamanan.
- 🔵 **Dalam Proses**: Sedang diimplementasikan pada tahap aktif saat ini.
- ⚪ **Direncanakan**: Fitur untuk rilis masa depan.

---

## 1. Manajemen Dataset & Editor Data
| Fitur | Status | Keterangan |
| :--- | :---: | :--- |
| Virtualized Spreadsheet DataGrid | 🟢 Berfungsi | Lancar menangani 1.000+ baris data dengan navigasi keyboard. |
| Variable View & Atribut SPSS | 🟢 Berfungsi | Konfigurasi 8 atribut variabel (Type, Width, Decimals, Label, Values, Missing, Measure). |
| Value Labels (Kategori Kuesioner) | 🟢 Berfungsi | Pemetaan kode angka ke label teks (mis. 1=Sangat Tidak Setuju s/d 5=Sangat Setuju). |
| Missing Values Diskrit | 🟢 Berfungsi | Pengaturan nilai missing (mis. 99, 999) yang diabaikan dalam kalkulasi. |
| Impor Dataset CSV & XLSX | 🟢 Berfungsi | Deteksi otomatis delimiter, dukungan sheet Excel, validasi tipe data. |
| Ekspor Dataset CSV & XLSX | 🟢 Berfungsi | Dilengkapi pencegahan CSV Formula Injection pada Tahap 7. |
| Demo Dataset Generator | 🟢 Berfungsi | Pembuatan dataset sintetis realistis untuk uji coba instan. |

---

## 2. Manajemen Proyek (.statpro) — *Tahap 7*
| Fitur | Status | Keterangan |
| :--- | :---: | :--- |
| Pembuatan Proyek Baru | 🟢 Berfungsi | Inisialisasi proyek dengan UUID unik, nama, dan deskripsi. |
| Buka / Simpan Proyek | 🟢 Berfungsi | Persistensi metadata, dataset aktif, audit log, dan hasil output. |
| Dirty-State Detection & Warning | 🟢 Berfungsi | Status "Tersimpan" / "Belum Disimpan" dan dialog konfirmasi cegah kehilangan data. |
| Duplikasi / Salin Proyek | 🟢 Berfungsi | Pembuatan salinan proyek independen untuk skenario analisis komparatif. |
| Hapus Proyek dengan Konfirmasi | 🟢 Berfungsi | Dialog peringatan konfirmasi sebelum penghapusan permanen. |
| Ekspor Paket `.statpro` (ZIP) | 🟢 Berfungsi | Bundling file proyek mandiri berversi format 1.0.0. |
| Impor Paket `.statpro` | 🟢 Berfungsi | Ekstraksi aman dengan proteksi Zip-Slip dan validasi skema Pydantic. |
| Atomic File Storage | 🟢 Berfungsi | Penyimpanan aman menggunakan berkas `.tmp` dan atomic rename. |

---

## 3. Statistical Engine Dasar & Lanjutan
| Fitur | Status | Keterangan |
| :--- | :---: | :--- |
| Statistik Deskriptif | 🟢 Berfungsi | Mean, Median, Std Dev, Variance, Skewness, Kurtosis. |
| Uji Validitas Butir Instrumen | 🟢 Berfungsi | Korelasi Pearson corrected item-total vs tabel $r$. |
| Uji Reliabilitas Cronbach's Alpha | 🟢 Berfungsi | Nilai koefisien Alpha dan tabel *alpha if item deleted*. |
| Korelasi Pearson & Spearman | 🟢 Berfungsi | Matriks korelasi dua arah beserta signifikansi $p$-value. |
| Regresi Linear Berganda (OLS) | 🟢 Berfungsi | Koefisien, $R, R^2$, Uji $F$, Uji $t$, serta Uji Asumsi Klasik. |
| One-Sample t-test | 🟢 Berfungsi | Perbandingan terhadap nilai acuan $\mu_0$ dan Cohen's $d$. |
| Independent Samples t-test | 🟢 Berfungsi | Student's $t$, Welch's $t$, Uji Homogenitas Levene. |
| Paired Samples t-test | 🟢 Berfungsi | Format data *wide* SPSS per responden. |
| One-Way ANOVA & Welch ANOVA | 🟢 Berfungsi | Post-Hoc Tukey HSD & Games-Howell, $\eta^2, \omega^2$. |
| Statistik Nonparametrik | 🟢 Berfungsi | Mann-Whitney U, Wilcoxon, Kruskal-Wallis (+ Dunn-Bonferroni), Friedman, Kendall's Tau-b. |
| Tabel Kontingensi & Chi-Square | 🟢 Berfungsi | Tabel silang $R \times C$, Observed/Expected, Yates, Fisher's Exact, Cramér's $V$. |
| Regresi Logistik Biner | 🟢 Berfungsi | Logit MLE, Odds Ratio $\text{Exp}(B)$, Pseudo-$R^2$, Hosmer-Lemeshow, Confusion Matrix. |
| Visualisasi Hibrida Interaktif | 🟢 Berfungsi | Histogram, Boxplot Tukey, Scatter OLS, Bar CI, Heatmap, Q-Q Plot + ekspor PNG. |

---

## 4. Transformasi Data & Kasus
| Fitur | Status | Keterangan |
| :--- | :---: | :--- |
| Hitung Variabel (Compute Variable) | 🟢 Berfungsi | AST Safe Parser tanpa eksekusi kode berbahaya. |
| Rekode Nilai (Recode Variable) | 🟢 Berfungsi | Rekode nilai tunggal, interval/range, dan nilai default ELSE. |
| Reverse Scoring Skala Likert | 🟢 Berfungsi | Pembalikan otomatis skala item kuesioner negatif. |
| Skor Komposit (Mean / Sum) | 🟢 Berfungsi | Pembentukan variabel total dimensi dari butir pertanyaan. |
| Standarisasi Z-Score | 🟢 Berfungsi | Penanganan khusus zero-variance. |
| Kategorisasi Variabel (Binning) | 🟢 Berfungsi | Pengelompokan numerik ke ordinal berlabel. |
| Filter & Select Cases | 🟢 Berfungsi | Penyaringan baris dengan efek visual redup di spreadsheet. |
| Urutkan Kasus (Sort Cases) | 🟢 Berfungsi | Multi-column ascending / descending sort. |
| Identifikasi & Hapus Duplikat | 🟢 Berfungsi | Pemindaian duplikat berbasis kolom kunci. |
| Ringkasan Missing Values | 🟢 Berfungsi | Rekap jumlah dan persentase nilai hilang per variabel. |

---

## 5. Output Viewer, Laporan, & Reproduksibilitas
| Fitur | Status | Keterangan |
| :--- | :---: | :--- |
| Output Viewer Dokumen | 🟢 Berfungsi | Riwayat hierarkis, salin TSV, cetak PDF, badge dataset stale. |
| Re-run Analisis (Jalankan Ulang) | 🟢 Berfungsi | Tombol jalankan ulang dengan modal terisi otomatis (*pre-filled*). |
| Generator Laporan PDF | 🟢 Berfungsi | Standar APA 7 via ReportLab dengan cover page dan tabel rapi. |
| Generator Laporan DOCX | 🟢 Berfungsi | Format Microsoft Word standar publikasi penelitian. |
| Generator Laporan XLSX | 🟢 Berfungsi | Lembar kerja Excel multi-tab dengan styling formal. |

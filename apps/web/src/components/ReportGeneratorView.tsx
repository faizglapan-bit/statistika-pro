import React, { useEffect, useState } from 'react'
import {
  DatasetMetadata,
  ReportMetadata,
  ReportSectionItem,
} from '@/types'
import {
  getReportAvailableSections,
  previewReport,
  downloadReport,
} from '@/services/reportApi'

interface Props {
  activeDataset: DatasetMetadata | null
  onOpenAnalysis?: () => void
}

export const ReportGeneratorView: React.FC<Props> = ({
  activeDataset,
  onOpenAnalysis,
}) => {
  const [metadata, setMetadata] = useState<ReportMetadata>({
    title: 'Laporan Hasil Analisis Statistik',
    researcher: '',
    institution: '',
    period: '',
    notes: '',
  })

  const [sections, setSections] = useState<ReportSectionItem[]>([])
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([])
  const [format, setFormat] = useState<'pdf' | 'docx' | 'xlsx'>('pdf')
  const [includeHistory, setIncludeHistory] = useState(true)

  const [previewData, setPreviewData] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (activeDataset?.id) {
      setLoading(true)
      setError(null)
      getReportAvailableSections(activeDataset.id)
        .then((res) => {
          setSections(res.sections)
          // Default select all available sections
          setSelectedSectionIds(res.sections.filter((s) => s.available).map((s) => s.id))
        })
        .catch((err) => setError(err.message || 'Gagal memuat bagian laporan'))
        .finally(() => setLoading(false))
    }
  }, [activeDataset?.id])

  const toggleSection = (id: string) => {
    setSelectedSectionIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handlePreview = async () => {
    if (!activeDataset?.id) return
    setError(null)
    try {
      const data = await previewReport(activeDataset.id, {
        dataset_id: activeDataset.id,
        metadata,
        sections: selectedSectionIds,
        format,
        include_transformation_history: includeHistory,
      })
      setPreviewData(data)
    } catch (err: any) {
      setError(err.message || 'Gagal memuat ringkasan pratinjau.')
    }
  }

  const handleDownload = async () => {
    if (!activeDataset?.id) return
    setError(null)
    setSuccessMsg(null)
    setDownloading(true)
    try {
      await downloadReport(activeDataset.id, {
        dataset_id: activeDataset.id,
        metadata,
        sections: selectedSectionIds,
        format,
        include_transformation_history: includeHistory,
      })
      setSuccessMsg(`Dokumen laporan ${format.toUpperCase()} berhasil diunduh ke komputer Anda.`)
    } catch (err: any) {
      setError(err.message || 'Gagal menghasilkan file laporan.')
    } finally {
      setDownloading(false)
    }
  }

  if (!activeDataset) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-3xl mb-3">📁</div>
        <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">Tidak Ada Dataset Aktif</h3>
        <p className="text-xs text-slate-400 mt-1">
          Silakan buka atau impor dataset terlebih dahulu untuk menghasilkan laporan penelitian.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
              📑
            </span>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Generator Laporan Statistik
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Hasilkan laporan penelitian komprehensif berstandar akademik APA 7 dalam format PDF, DOCX, atau XLSX dari data aktual.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">Dataset Aktif:</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">
              {activeDataset.name}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm flex items-start gap-2.5">
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-sm flex items-start gap-2.5">
          <span>✓</span>
          <div>{successMsg}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Metadata & Pilihan Bab */}
        <div className="lg:col-span-2 space-y-5">
          {/* Metadata Penelitian */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="text-blue-600">🏛️</span>
              1. Informasi & Metadata Penelitian
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Penelitian / Skripsi / Tesis
                </label>
                <input
                  type="text"
                  value={metadata.title || ''}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  placeholder="misal: Pengaruh Kualitas Layanan terhadap Kepuasan Pelanggan..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Peneliti
                </label>
                <input
                  type="text"
                  value={metadata.researcher || ''}
                  onChange={(e) => setMetadata({ ...metadata, researcher: e.target.value })}
                  placeholder="misal: Budi Santoso, S.Kom"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institusi / Universitas / Lembaga
                </label>
                <input
                  type="text"
                  value={metadata.institution || ''}
                  onChange={(e) => setMetadata({ ...metadata, institution: e.target.value })}
                  placeholder="misal: Universitas Indonesia"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Periode Penelitian
                </label>
                <input
                  type="text"
                  value={metadata.period || ''}
                  onChange={(e) => setMetadata({ ...metadata, period: e.target.value })}
                  placeholder="misal: Semester Genap 2025/2026"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={metadata.notes || ''}
                  onChange={(e) => setMetadata({ ...metadata, notes: e.target.value })}
                  placeholder="misal: Uji signifikansi pada alpha 5%"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Daftar Periksa Bab / Analisis */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="text-blue-600">📋</span>
                2. Komponen & Bab yang Disertakan
              </h2>
              <button
                type="button"
                onClick={() =>
                  setSelectedSectionIds(
                    selectedSectionIds.length === sections.filter((s) => s.available).length
                      ? []
                      : sections.filter((s) => s.available).map((s) => s.id)
                  )
                }
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Pilih Semua yang Tersedia
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {loading && (
                <div className="py-4 text-center text-slate-400">Memeriksa modul analisis yang tersedia...</div>
              )}
              {sections.map((sec) => {
                const isChecked = selectedSectionIds.includes(sec.id)
                return (
                  <div
                    key={sec.id}
                    className={`py-3 flex items-start justify-between gap-3 ${
                      !sec.available ? 'opacity-60 bg-slate-50/50 dark:bg-slate-800/20 px-2 rounded' : ''
                    }`}
                  >
                    <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={!sec.available}
                        onChange={() => toggleSection(sec.id)}
                        className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <span>{sec.title}</span>
                          {sec.available ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium">
                              Tersedia
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-medium">
                              Belum Dijalankan
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">{sec.description}</p>
                      </div>
                    </label>

                    {!sec.available && onOpenAnalysis && (
                      <button
                        type="button"
                        onClick={onOpenAnalysis}
                        className="text-[11px] text-blue-600 hover:underline font-semibold whitespace-nowrap mt-1"
                      >
                        Jalankan Uji ➔
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Format Ekspor & Tombol Unduh */}
        <div className="space-y-5">
          {/* Format Pilihan */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="text-indigo-600">💾</span>
              3. Format Dokumen
            </h2>

            <div className="space-y-2">
              {[
                {
                  id: 'pdf',
                  name: 'PDF (ReportLab)',
                  ext: '.pdf',
                  icon: '📕',
                  desc: 'Format cetak resmi APA 7 dengan halaman judul, nomor halaman, dan tabel rapi.',
                },
                {
                  id: 'docx',
                  name: 'Word (python-docx)',
                  ext: '.docx',
                  icon: '📘',
                  desc: 'Dokumen Word terformat yang siap disalin dan diedit ke naskah skripsi/jurnal.',
                },
                {
                  id: 'xlsx',
                  name: 'Excel (openpyxl)',
                  ext: '.xlsx',
                  icon: '📗',
                  desc: 'Workbook interaktif multi-sheet (Ringkasan, Variabel, Data, dan Analisis).',
                },
              ].map((fmt) => (
                <label
                  key={fmt.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    format === fmt.id
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="report_format"
                    checked={format === fmt.id}
                    onChange={() => setFormat(fmt.id as any)}
                    className="mt-1 text-blue-600"
                  />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>{fmt.icon}</span>
                      <span>{fmt.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{fmt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={includeHistory}
                  onChange={(e) => setIncludeHistory(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Sertakan lembar riwayat audit transformasi data</span>
              </label>
            </div>
          </div>

          {/* Action Box */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Bab dipilih: <b>{selectedSectionIds.length}</b> bagian | Format: <b className="uppercase">{format}</b>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || selectedSectionIds.length === 0}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 text-white shadow-lg transition flex items-center justify-center gap-2"
            >
              {downloading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Menghasilkan Dokumen...</span>
                </>
              ) : (
                <>
                  <span>📥</span>
                  <span>Unduh Laporan {format.toUpperCase()}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePreview}
              className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
            >
              🔍 Pratinjau Ringkasan Laporan
            </button>
          </div>

          {/* Preview Box */}
          {previewData && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-2">
              <div className="font-bold text-slate-800 dark:text-slate-100">Ringkasan Struktur Laporan:</div>
              <div className="space-y-1 text-slate-600 dark:text-slate-300">
                <div>Judul: <b>{previewData.title}</b></div>
                <div>Dataset: <b>{previewData.dataset_name}</b> (N = {previewData.sample_size})</div>
                <div>Jumlah Bagian: <b>{previewData.selected_sections_count} bab</b></div>
                <div>Analisis Tersedia: {Object.keys(previewData.included_analyses || {}).join(', ') || 'Belum ada'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

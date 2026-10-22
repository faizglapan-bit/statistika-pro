import React, { useState } from 'react'
import { VariableDefinition, DuplicateDetectionResponse } from '@/types'
import { detectDuplicates, removeDuplicates } from '@/services/caseApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  datasetId: string
  variables: VariableDefinition[]
  onSuccess: (updatedDataset?: any, newDatasetId?: string) => void
}

export const DuplicateCasesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  datasetId,
  variables,
  onSuccess,
}) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [keep, setKeep] = useState<'first' | 'last'>('first')
  const [saveAsNew, setSaveAsNew] = useState(false)
  const [newDatasetName, setNewDatasetName] = useState('')

  const [detection, setDetection] = useState<DuplicateDetectionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const toggleSelectKey = (name: string) => {
    setSelectedKeys((prev) =>
      prev.includes(name) ? prev.filter((k) => k !== name) : [...prev, name]
    )
  }

  const handleDetect = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await detectDuplicates(datasetId, selectedKeys, keep)
      setDetection(res)
    } catch (err: any) {
      setError(err.message || 'Gagal mendeteksi duplikasi.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!window.confirm('Hapus baris yang terindikasi duplikat sesuai aturan yang dipilih?')) {
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await removeDuplicates(
        datasetId,
        selectedKeys,
        keep,
        saveAsNew,
        saveAsNew ? newDatasetName.trim() || undefined : undefined
      )
      onSuccess(res.dataset, res.new_dataset_id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus duplikasi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
                👥
              </span>
              Deteksi & Pembersihan Duplikasi (Duplicate Cases)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Identifikasi baris duplikat berdasarkan kolom kunci responden unik (misal: ID, NIK, No Responden).
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700">⚠️ {error}</div>}

          {/* Kolom Kunci */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Pilih Kolom Kunci Pencocokan ({selectedKeys.length === 0 ? 'Semua Kolom' : `${selectedKeys.length} dipilih`}):
              </span>
              <button
                type="button"
                onClick={() => setSelectedKeys([])}
                className="text-rose-600 hover:underline"
              >
                Gunakan Semua Kolom (Identik Penuh)
              </button>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/40 max-h-40 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
              {variables.map((v) => {
                const isSelected = selectedKeys.includes(v.name)
                return (
                  <label
                    key={v.name}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition ${
                      isSelected
                        ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-medium'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectKey(v.name)}
                      className="rounded text-rose-600"
                    />
                    <div className="truncate">
                      <div className="font-mono">{v.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{v.label || v.type}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Aturan Keep */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Aturan Penyimpanan Kasus:
              </label>
              <select
                value={keep}
                onChange={(e) => setKeep(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                <option value="first">Pertahankan Kemunculan Pertama (Keep First)</option>
                <option value="last">Pertahankan Kemunculan Terakhir (Keep Last)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Pembersihan:
              </label>
              <label className="flex items-center gap-2 pt-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={saveAsNew}
                  onChange={(e) => setSaveAsNew(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600"
                />
                <span>Simpan hasil bersih sebagai dataset baru</span>
              </label>
            </div>
          </div>

          {saveAsNew && (
            <div>
              <input
                type="text"
                value={newDatasetName}
                onChange={(e) => setNewDatasetName(e.target.value)}
                placeholder="Nama dataset baru tanpa duplikat..."
                className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white dark:bg-slate-800"
              />
            </div>
          )}

          {/* Detection Result Box */}
          {detection && (
            <div className="border border-rose-200 dark:border-rose-900/50 rounded-lg p-3.5 bg-rose-50/40 dark:bg-rose-950/20 space-y-2.5">
              <div className="flex items-center justify-between font-bold text-rose-900 dark:text-rose-200">
                <span>Hasil Deteksi Duplikasi:</span>
                <span className="text-xs">
                  {detection.duplicate_rows_count > 0 ? (
                    <span className="text-red-600 font-bold">
                      {detection.duplicate_rows_count} Baris Duplikat Terdeteksi!
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-bold">Tidak Ditemukan Baris Duplikat ✓</span>
                  )}
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                Total baris: <b>{detection.total_rows}</b> | Baris unik:{' '}
                <b className="text-emerald-600">{detection.unique_rows_count}</b> | Baris duplikat:{' '}
                <b className="text-rose-600">{detection.duplicate_rows_count}</b>
              </div>

              {detection.sample_duplicate_groups.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    Sampel Grup Duplikat:
                  </div>
                  <div className="space-y-1.5">
                    {detection.sample_duplicate_groups.map((g, idx) => (
                      <div key={idx} className="p-2 rounded bg-white dark:bg-slate-800 border text-[11px] flex justify-between items-center">
                        <span className="font-mono">{JSON.stringify(g.keys)}</span>
                        <span className="font-semibold text-rose-600">{g.count} kali muncul (ID: {g.row_ids.join(', ')})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={handleDetect}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          >
            🔍 Deteksi Duplikasi
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100">
              Batal
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={loading || !detection || detection.duplicate_rows_count === 0}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white shadow-sm"
            >
              {loading ? 'Memproses...' : 'Hapus Baris Duplikat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

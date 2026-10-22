import React, { useState } from 'react'
import { VariableDefinition, TransformationPreviewResponse } from '@/types'
import { categorizeVariable } from '@/services/transformationApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  datasetId: string
  variables: VariableDefinition[]
  onSuccess: (updatedDataset?: any, newDatasetId?: string | null) => void
}

export const CategorizeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  datasetId,
  variables,
  onSuccess,
}) => {
  const [sourceVar, setSourceVar] = useState(variables[0]?.name || '')
  const [targetVar, setTargetVar] = useState('')
  const [targetLabel, setTargetLabel] = useState('')
  const [method, setMethod] = useState<'cutpoints' | 'equal_intervals' | 'percentiles'>('cutpoints')
  const [cutpointsStr, setCutpointsStr] = useState('20, 40')
  const [intervalsCount, setIntervalsCount] = useState(3)
  const [labelsStr, setLabelsStr] = useState('Rendah, Sedang, Tinggi')
  const [saveAsNew, setSaveAsNew] = useState(false)
  const [newDatasetName, setNewDatasetName] = useState('')

  const [preview, setPreview] = useState<TransformationPreviewResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const parseCutpoints = (): number[] => {
    return cutpointsStr
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n))
  }

  const parseLabels = (): string[] => {
    return labelsStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }

  const handlePreview = async () => {
    if (!sourceVar || !targetVar.trim()) {
      setError('Variabel sumber dan nama variabel target wajib diisi.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await categorizeVariable(datasetId, {
        source_variable: sourceVar,
        target_variable: targetVar.trim(),
        target_label: targetLabel.trim() || undefined,
        method,
        cutpoints: method === 'cutpoints' ? parseCutpoints() : undefined,
        intervals_count: method !== 'cutpoints' ? intervalsCount : undefined,
        category_labels: parseLabels().length > 0 ? parseLabels() : undefined,
        preview_only: true,
      })
      setPreview(res as TransformationPreviewResponse)
    } catch (err: any) {
      setError(err.message || 'Gagal menghitung kategorisasi.')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!sourceVar || !targetVar.trim()) {
      setError('Variabel sumber dan nama variabel target wajib diisi.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await categorizeVariable(datasetId, {
        source_variable: sourceVar,
        target_variable: targetVar.trim(),
        target_label: targetLabel.trim() || undefined,
        method,
        cutpoints: method === 'cutpoints' ? parseCutpoints() : undefined,
        intervals_count: method !== 'cutpoints' ? intervalsCount : undefined,
        category_labels: parseLabels().length > 0 ? parseLabels() : undefined,
        preview_only: false,
        save_as_new_dataset: saveAsNew,
        new_dataset_name: saveAsNew ? newDatasetName.trim() || undefined : undefined,
      })
      onSuccess(undefined, (res as any).new_dataset_id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menerapkan kategorisasi.')
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
              <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                📊
              </span>
              Kategorisasi Variabel (Visual Binning / Categorize)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mengubah variabel kontinu menjadi variabel ordinal berdasarkan cutpoints, interval, atau persentil.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700">
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Variabel Sumber
              </label>
              <select
                value={sourceVar}
                onChange={(e) => setSourceVar(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                {variables.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.label || v.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Variabel Baru <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={targetVar}
                onChange={(e) => setTargetVar(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                placeholder="misal: KAT_USIA"
                className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Label Variabel
              </label>
              <input
                type="text"
                value={targetLabel}
                onChange={(e) => setTargetLabel(e.target.value)}
                placeholder="misal: Kelompok Usia Responden"
                className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Metode Pembagian
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                <option value="cutpoints">Titik Potong (Cutpoints Manual)</option>
                <option value="equal_intervals">Interval Sama Rata</option>
                <option value="percentiles">Persentil / Kuantil</option>
              </select>
            </div>
          </div>

          {method === 'cutpoints' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Daftar Titik Potong (pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={cutpointsStr}
                onChange={(e) => setCutpointsStr(e.target.value)}
                placeholder="Contoh: 20, 30, 40"
                className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white dark:bg-slate-800 font-mono"
              />
            </div>
          )}

          {method !== 'cutpoints' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Kategori Interval:
              </label>
              <input
                type="number"
                min={2}
                max={10}
                value={intervalsCount}
                onChange={(e) => setIntervalsCount(parseInt(e.target.value) || 3)}
                className="w-28 px-3 py-1.5 rounded border border-slate-300 bg-white dark:bg-slate-800"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Label Kategori (pisahkan dengan koma, opsional)
            </label>
            <input
              type="text"
              value={labelsStr}
              onChange={(e) => setLabelsStr(e.target.value)}
              placeholder="Contoh: Rendah, Sedang, Tinggi"
              className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white dark:bg-slate-800"
            />
          </div>

          {/* Opsi Simpan Dataset Baru */}
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={saveAsNew}
                onChange={(e) => setSaveAsNew(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600"
              />
              <span>Simpan hasil sebagai salinan dataset baru</span>
            </label>
            {saveAsNew && (
              <input
                type="text"
                value={newDatasetName}
                onChange={(e) => setNewDatasetName(e.target.value)}
                placeholder="Nama dataset baru..."
                className="px-2.5 py-1 text-xs rounded border border-slate-300 bg-white dark:bg-slate-800 w-56"
              />
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="border border-purple-200 dark:border-purple-900/50 rounded-lg p-3 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 dark:text-purple-200">
                  Pratinjau Hasil: <span className="font-mono">{preview.target_variable}</span>
                </span>
                <span className="text-slate-500">
                  Valid: {preview.valid_count} | Missing: {preview.missing_count}
                </span>
              </div>
              <div className="overflow-x-auto max-h-32 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 border-b">
                    <tr>
                      <th className="p-1.5">No</th>
                      <th className="p-1.5 font-mono">{sourceVar} (Asli)</th>
                      <th className="p-1.5 bg-purple-100/70 text-purple-900 font-mono">
                        {preview.target_variable} (Kategori)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview_rows.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60">
                        <td className="p-1.5 text-slate-400">{i + 1}</td>
                        <td className="p-1.5 text-slate-700 font-mono">{r[sourceVar] ?? '-'}</td>
                        <td className="p-1.5 font-bold font-mono text-purple-700 dark:text-purple-300">
                          {r[preview.target_variable] ?? <span className="text-slate-300 italic">missing</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={handlePreview}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          >
            🔍 Pratinjau
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={loading}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
            >
              {loading ? 'Memproses...' : 'Terapkan Kategorisasi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

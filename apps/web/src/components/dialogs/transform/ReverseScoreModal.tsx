import React, { useState } from 'react'
import { VariableDefinition, TransformationPreviewResponse } from '@/types'
import { reverseScoreVariables } from '@/services/transformationApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  datasetId: string
  variables: VariableDefinition[]
  onSuccess: (updatedDataset?: any, newDatasetId?: string | null) => void
}

export const ReverseScoreModal: React.FC<Props> = ({
  isOpen,
  onClose,
  datasetId,
  variables,
  onSuccess,
}) => {
  const [selectedVars, setSelectedVars] = useState<string[]>([])
  const [scaleMin, setScaleMin] = useState(1.0)
  const [scaleMax, setScaleMax] = useState(5.0)
  const [targetPrefix, setTargetPrefix] = useState('REV_')
  const [saveAsNew, setSaveAsNew] = useState(false)
  const [newDatasetName, setNewDatasetName] = useState('')

  const [preview, setPreview] = useState<TransformationPreviewResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const toggleSelectVar = (name: string) => {
    setSelectedVars((prev) =>
      prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
    )
  }

  const handlePreview = async () => {
    if (selectedVars.length === 0) {
      setError('Pilih minimal satu variabel item untuk dibalikkan skornya.')
      return
    }
    if (scaleMin >= scaleMax) {
      setError('Batas minimum skala harus lebih kecil dari batas maksimum.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await reverseScoreVariables(datasetId, {
        source_variables: selectedVars,
        scale_min: scaleMin,
        scale_max: scaleMax,
        target_prefix: targetPrefix.trim() || 'REV_',
        preview_only: true,
      })
      setPreview(res as TransformationPreviewResponse)
    } catch (err: any) {
      setError(err.message || 'Gagal mempratinjau pembalikan skor.')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (selectedVars.length === 0) {
      setError('Pilih minimal satu variabel item untuk dibalikkan skornya.')
      return
    }
    if (scaleMin >= scaleMax) {
      setError('Batas minimum skala harus lebih kecil dari batas maksimum.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await reverseScoreVariables(datasetId, {
        source_variables: selectedVars,
        scale_min: scaleMin,
        scale_max: scaleMax,
        target_prefix: targetPrefix.trim() || 'REV_',
        preview_only: false,
        save_as_new_dataset: saveAsNew,
        new_dataset_name: saveAsNew ? newDatasetName.trim() || undefined : undefined,
      })
      onSuccess(undefined, (res as any).new_dataset_id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal memproses pembalikan skor.')
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
              <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                ↕️
              </span>
              Pembalikan Skor Item (Reverse Scoring)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pembalikan skala untuk item kuesioner unfavorable: <code>skor_baru = min + max - skor_lama</code>
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
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 text-xs">
              ⚠️ {error}
            </div>
          )}

          {/* Konfigurasi Skala & Prefix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batas Bawah (Min)
              </label>
              <input
                type="number"
                value={scaleMin}
                onChange={(e) => setScaleMin(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batas Atas (Max)
              </label>
              <input
                type="number"
                value={scaleMax}
                onChange={(e) => setScaleMax(parseFloat(e.target.value) || 5)}
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prefix Nama Variabel Baru
              </label>
              <input
                type="text"
                value={targetPrefix}
                onChange={(e) => setTargetPrefix(e.target.value.toUpperCase())}
                placeholder="REV_"
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          {/* Pemilihan Variabel Item */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Pilih Item yang Dibalikkan Skornya: ({selectedVars.length} dipilih)
              </span>
              <button
                type="button"
                onClick={() => setSelectedVars(selectedVars.length === variables.length ? [] : variables.map((v) => v.name))}
                className="text-amber-600 dark:text-amber-400 hover:underline"
              >
                {selectedVars.length === variables.length ? 'Batal Pilih Semua' : 'Pilih Semua Item'}
              </button>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/40 max-h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
              {variables.map((v) => {
                const isSelected = selectedVars.includes(v.name)
                return (
                  <label
                    key={v.name}
                    className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-medium'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectVar(v.name)}
                      className="rounded text-amber-600"
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

          {/* Opsi Simpan sebagai Dataset Baru */}
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={saveAsNew}
                onChange={(e) => setSaveAsNew(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600"
              />
              <span>Simpan hasil sebagai dataset baru</span>
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
            <div className="border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 bg-amber-50/40 dark:bg-amber-950/20 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  Pratinjau Hasil Reverse: <span className="font-mono">{preview.target_variable}</span>
                </span>
                <span className="text-slate-500">
                  Valid: {preview.valid_count} | Missing: {preview.missing_count}
                </span>
              </div>
              <div className="overflow-x-auto max-h-32 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b">
                    <tr>
                      <th className="p-1.5">No</th>
                      <th className="p-1.5 bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-mono">
                        {preview.target_variable} (Dibalik)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview_rows.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60">
                        <td className="p-1.5 text-slate-400">{i + 1}</td>
                        <td className="p-1.5 font-bold font-mono text-amber-700 dark:text-amber-300">
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
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white dark:bg-slate-800 text-slate-700 hover:bg-slate-100"
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
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
            >
              {loading ? 'Memproses...' : 'Terapkan Pembalikan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

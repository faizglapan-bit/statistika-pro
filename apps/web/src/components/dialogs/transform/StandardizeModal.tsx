import React, { useState } from 'react'
import { VariableDefinition, TransformationPreviewResponse } from '@/types'
import { standardizeVariables } from '@/services/transformationApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  datasetId: string
  variables: VariableDefinition[]
  onSuccess: (updatedDataset?: any, newDatasetId?: string | null) => void
}

export const StandardizeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  datasetId,
  variables,
  onSuccess,
}) => {
  const [selectedVars, setSelectedVars] = useState<string[]>([])
  const [targetPrefix, setTargetPrefix] = useState('Z_')
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
      setError('Pilih minimal satu variabel numerik untuk distandardisasi.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await standardizeVariables(datasetId, {
        source_variables: selectedVars,
        target_prefix: targetPrefix.trim() || 'Z_',
        preview_only: true,
      })
      setPreview(res as TransformationPreviewResponse)
    } catch (err: any) {
      setError(err.message || 'Gagal menghitung standardisasi Z-score.')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (selectedVars.length === 0) {
      setError('Pilih minimal satu variabel numerik untuk distandardisasi.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await standardizeVariables(datasetId, {
        source_variables: selectedVars,
        target_prefix: targetPrefix.trim() || 'Z_',
        preview_only: false,
        save_as_new_dataset: saveAsNew,
        new_dataset_name: saveAsNew ? newDatasetName.trim() || undefined : undefined,
      })
      onSuccess(undefined, (res as any).new_dataset_id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menerapkan standardisasi.')
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
              <span className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400">
                Z
              </span>
              Standardisasi Variabel (Z-Score)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Transformasi data ke skala standar dengan mean = 0 dan SD = 1 (formula: <code>Z = (X - μ) / σ</code>)
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

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Prefix Nama Variabel Z-Score
            </label>
            <input
              type="text"
              value={targetPrefix}
              onChange={(e) => setTargetPrefix(e.target.value.toUpperCase())}
              placeholder="Z_"
              className="w-48 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
            />
          </div>

          {/* Variabel Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Pilih Variabel yang Distandardisasi ({selectedVars.length} dipilih):
              </span>
              <button
                type="button"
                onClick={() => setSelectedVars(selectedVars.length === variables.length ? [] : variables.map((v) => v.name))}
                className="text-teal-600 hover:underline"
              >
                {selectedVars.length === variables.length ? 'Batal Pilih Semua' : 'Pilih Semua Variabel'}
              </button>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/40 max-h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
              {variables.map((v) => {
                const isSelected = selectedVars.includes(v.name)
                return (
                  <label
                    key={v.name}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition ${
                      isSelected
                        ? 'border-teal-400 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-medium'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectVar(v.name)}
                      className="rounded text-teal-600"
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

          {/* Opsi Simpan Dataset Baru */}
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={saveAsNew}
                onChange={(e) => setSaveAsNew(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600"
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
            <div className="border border-teal-200 dark:border-teal-900/50 rounded-lg p-3 bg-teal-50/40 dark:bg-teal-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-900 dark:text-teal-200">
                  Pratinjau Hasil: <span className="font-mono">{preview.target_variable}</span>
                </span>
                <span className="text-slate-500">
                  Valid: {preview.valid_count} | Missing: {preview.missing_count}
                </span>
              </div>
              {preview.warnings.length > 0 && (
                <div className="text-[11px] text-amber-700">{preview.warnings.join(' • ')}</div>
              )}
              <div className="overflow-x-auto max-h-32 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 border-b">
                    <tr>
                      <th className="p-1.5">No</th>
                      <th className="p-1.5 bg-teal-100/70 text-teal-900 font-mono">
                        {preview.target_variable} (Z-Score)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview_rows.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60">
                        <td className="p-1.5 text-slate-400">{i + 1}</td>
                        <td className="p-1.5 font-bold font-mono text-teal-700 dark:text-teal-300">
                          {r[preview.target_variable] !== null && r[preview.target_variable] !== undefined
                            ? String(r[preview.target_variable])
                            : <span className="text-slate-300 italic">missing</span>}
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
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
            >
              {loading ? 'Memproses...' : 'Terapkan Z-Score'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

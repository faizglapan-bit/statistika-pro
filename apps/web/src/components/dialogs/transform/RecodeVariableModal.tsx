import React, { useState } from 'react'
import { VariableDefinition, RecodeRule, TransformationPreviewResponse } from '@/types'
import { recodeVariable } from '@/services/transformationApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  datasetId: string
  variables: VariableDefinition[]
  onSuccess: (updatedDataset?: any, newDatasetId?: string | null) => void
}

export const RecodeVariableModal: React.FC<Props> = ({
  isOpen,
  onClose,
  datasetId,
  variables,
  onSuccess,
}) => {
  const [sourceVar, setSourceVar] = useState(variables[0]?.name || '')
  const [targetVar, setTargetVar] = useState('')
  const [targetLabel, setTargetLabel] = useState('')
  const [targetType, setTargetType] = useState<'numeric' | 'string'>('numeric')
  const [rules, setRules] = useState<RecodeRule[]>([
    { rule_type: 'single', old_value: 1, new_value: 1, is_missing: false },
  ])
  const [saveAsNew, setSaveAsNew] = useState(false)
  const [newDatasetName, setNewDatasetName] = useState('')

  const [preview, setPreview] = useState<TransformationPreviewResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleAddRule = () => {
    setRules((prev) => [
      ...prev,
      { rule_type: 'single', old_value: '', new_value: '', is_missing: false },
    ])
  }

  const handleRemoveRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateRule = (index: number, patch: Partial<RecodeRule>) => {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
    )
  }

  const handlePreview = async () => {
    if (!sourceVar || !targetVar.trim() || rules.length === 0) {
      setError('Variabel sumber, target, dan minimal satu aturan recode wajib diisi.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await recodeVariable(datasetId, {
        source_variable: sourceVar,
        target_variable: targetVar.trim(),
        target_label: targetLabel.trim() || undefined,
        target_type: targetType,
        rules,
        preview_only: true,
      })
      setPreview(res as TransformationPreviewResponse)
    } catch (err: any) {
      setError(err.message || 'Gagal mempratinjau recode.')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!sourceVar || !targetVar.trim() || rules.length === 0) {
      setError('Variabel sumber, target, dan minimal satu aturan recode wajib diisi.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await recodeVariable(datasetId, {
        source_variable: sourceVar,
        target_variable: targetVar.trim(),
        target_label: targetLabel.trim() || undefined,
        target_type: targetType,
        rules,
        preview_only: false,
        save_as_new_dataset: saveAsNew,
        new_dataset_name: saveAsNew ? newDatasetName.trim() || undefined : undefined,
      })
      onSuccess(undefined, (res as any).new_dataset_id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menerapkan recode.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                🔄
              </span>
              Recode into Different Variables
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ubah nilai lama ke nilai baru ke variabel target terpisah tanpa merusak data asli.
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
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm flex items-start gap-2.5">
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          {/* Pemilihan Variabel Sumber & Target */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Variabel Sumber <span className="text-red-500">*</span>
              </label>
              <select
                value={sourceVar}
                onChange={(e) => setSourceVar(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {variables.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.label || v.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Variabel Baru <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={targetVar}
                onChange={(e) => setTargetVar(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                placeholder="misal: X1_RECODED"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Label Variabel
              </label>
              <input
                type="text"
                value={targetLabel}
                onChange={(e) => setTargetLabel(e.target.value)}
                placeholder="misal: Hasil Recode Item"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipe Data Target
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="numeric">Numerik (Skala / Angka)</option>
                <option value="string">Teks / Kategori String</option>
              </select>
            </div>
          </div>

          {/* Aturan Pemetaan (Rule Builder) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Aturan Pemetaan Nilai Lama ➔ Nilai Baru
              </span>
              <button
                type="button"
                onClick={handleAddRule}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 hover:bg-indigo-100 transition"
              >
                + Tambah Aturan
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {rules.map((r, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-wrap items-center gap-2 text-xs"
                >
                  <span className="text-slate-400 font-mono w-5">{idx + 1}.</span>
                  <select
                    value={r.rule_type}
                    onChange={(e) => handleUpdateRule(idx, { rule_type: e.target.value as any })}
                    className="p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="single">Nilai Tunggal</option>
                    <option value="range">Rentang (Min s.d Max)</option>
                    <option value="lowest_thru">Lowest s.d Nilai</option>
                    <option value="thru_highest">Nilai s.d Highest</option>
                    <option value="else">Semua Nilai Lainnya (Else)</option>
                  </select>

                  {/* Input parameter nilai lama */}
                  {r.rule_type === 'single' && (
                    <input
                      type="text"
                      placeholder="Nilai Lama"
                      value={r.old_value ?? ''}
                      onChange={(e) => handleUpdateRule(idx, { old_value: e.target.value })}
                      className="w-24 p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none"
                    />
                  )}
                  {r.rule_type === 'range' && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        placeholder="Min"
                        value={r.range_min ?? ''}
                        onChange={(e) => handleUpdateRule(idx, { range_min: parseFloat(e.target.value) || 0 })}
                        className="w-16 p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none"
                      />
                      <span>s.d</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={r.range_max ?? ''}
                        onChange={(e) => handleUpdateRule(idx, { range_max: parseFloat(e.target.value) || 0 })}
                        className="w-16 p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none"
                      />
                    </div>
                  )}
                  {r.rule_type === 'lowest_thru' && (
                    <input
                      type="number"
                      placeholder="Batas Atas"
                      value={r.range_max ?? ''}
                      onChange={(e) => handleUpdateRule(idx, { range_max: parseFloat(e.target.value) || 0 })}
                      className="w-24 p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none"
                    />
                  )}
                  {r.rule_type === 'thru_highest' && (
                    <input
                      type="number"
                      placeholder="Batas Bawah"
                      value={r.range_min ?? ''}
                      onChange={(e) => handleUpdateRule(idx, { range_min: parseFloat(e.target.value) || 0 })}
                      className="w-24 p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none"
                    />
                  )}

                  <span className="font-bold text-slate-400">➔</span>

                  <input
                    type="text"
                    placeholder="Nilai Baru"
                    value={r.new_value ?? ''}
                    onChange={(e) => handleUpdateRule(idx, { new_value: e.target.value })}
                    className="w-28 p-1.5 rounded border border-indigo-300 dark:border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-semibold outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    disabled={rules.length === 1}
                    className="text-red-500 hover:text-red-700 disabled:opacity-30 p-1 ml-auto"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Opsi Simpan sebagai Dataset Baru */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={saveAsNew}
                onChange={(e) => setSaveAsNew(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Simpan hasil sebagai salinan dataset baru</span>
            </label>
            {saveAsNew && (
              <input
                type="text"
                value={newDatasetName}
                onChange={(e) => setNewDatasetName(e.target.value)}
                placeholder="Nama dataset baru..."
                className="px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 w-64 outline-none"
              />
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="border border-indigo-200 dark:border-indigo-900/50 rounded-lg p-3 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-800 dark:text-indigo-300">
                  Pratinjau Hasil Recode: <span className="font-mono">{preview.target_variable}</span>
                </span>
                <span className="text-slate-500">
                  Valid: <b className="text-emerald-600">{preview.valid_count}</b> | Missing:{' '}
                  <b className="text-amber-600">{preview.missing_count}</b>
                </span>
              </div>
              <div className="overflow-x-auto max-h-36 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold">
                    <tr>
                      <th className="p-1.5">No</th>
                      <th className="p-1.5 font-mono">{sourceVar} (Sumber)</th>
                      <th className="p-1.5 bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 font-mono">
                        {preview.target_variable} (Baru)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview_rows.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60">
                        <td className="p-1.5 text-slate-400">{i + 1}</td>
                        <td className="p-1.5 text-slate-700 dark:text-slate-300 font-mono">{r[sourceVar] ?? '-'}</td>
                        <td className="p-1.5 font-bold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20">
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
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={handlePreview}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            🔍 Pratinjau Hasil
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
            >
              {loading ? 'Memproses...' : 'Terapkan Recode'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

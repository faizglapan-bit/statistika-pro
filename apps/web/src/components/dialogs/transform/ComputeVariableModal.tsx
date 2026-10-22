import React, { useState } from 'react'
import { VariableDefinition, TransformationPreviewResponse } from '@/types'
import { computeVariable } from '@/services/transformationApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  datasetId: string
  variables: VariableDefinition[]
  onSuccess: (updatedDataset?: any, newDatasetId?: string | null) => void
}

export const ComputeVariableModal: React.FC<Props> = ({
  isOpen,
  onClose,
  datasetId,
  variables,
  onSuccess,
}) => {
  const [targetVar, setTargetVar] = useState('')
  const [targetLabel, setTargetLabel] = useState('')
  const [expression, setExpression] = useState('')
  const [saveAsNew, setSaveAsNew] = useState(false)
  const [newDatasetName, setNewDatasetName] = useState('')

  const [preview, setPreview] = useState<TransformationPreviewResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleInsertVar = (varName: string) => {
    setExpression((prev) => (prev ? `${prev} ${varName}` : varName))
  }

  const handleInsertOp = (op: string) => {
    setExpression((prev) => (prev ? `${prev} ${op}` : op))
  }

  const handlePreview = async () => {
    if (!targetVar.trim() || !expression.trim()) {
      setError('Nama variabel target dan ekspresi matematika wajib diisi.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await computeVariable(datasetId, {
        target_variable: targetVar.trim(),
        target_label: targetLabel.trim() || undefined,
        expression: expression.trim(),
        preview_only: true,
      })
      setPreview(res as TransformationPreviewResponse)
    } catch (err: any) {
      setError(err.message || 'Gagal mengevaluasi ekspresi.')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!targetVar.trim() || !expression.trim()) {
      setError('Nama variabel target dan ekspresi matematika wajib diisi.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await computeVariable(datasetId, {
        target_variable: targetVar.trim(),
        target_label: targetLabel.trim() || undefined,
        expression: expression.trim(),
        preview_only: false,
        save_as_new_dataset: saveAsNew,
        new_dataset_name: saveAsNew ? newDatasetName.trim() || undefined : undefined,
      })
      onSuccess(undefined, (res as any).new_dataset_id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menerapkan transformasi.')
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
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </span>
              Hitung Variabel Baru (Compute Variable)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Buat variabel baru dari kalkulasi ekspresi matematika dan formula aman tanpa eval/exec.
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

          {/* Form Target Variable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Variabel Target <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={targetVar}
                onChange={(e) => setTargetVar(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                placeholder="misal: TOTAL_X, RERATA_Y"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Label Variabel (Opsional)
              </label>
              <input
                type="text"
                value={targetLabel}
                onChange={(e) => setTargetLabel(e.target.value)}
                placeholder="misal: Skor Total Konstruk Motivasi"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Workspace Formula Builder */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Kolom Variabel */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/40">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                <span>Daftar Variabel</span>
                <span className="text-[10px] text-slate-400">Klik untuk menyisipkan</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {variables.map((v) => (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => handleInsertVar(v.name)}
                    className="w-full text-left px-2 py-1 text-xs rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-200 flex items-center justify-between"
                  >
                    <span className="font-mono font-medium">{v.name}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{v.label || v.type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Kolom Editor & Keypad */}
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Editor Ekspresi Numerik
                </label>
                <textarea
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Q1 + Q2 + Q3 atau MEAN(Q1, Q2, Q3) atau IF(Q1 >= 4, 1, 0)"
                  className="w-full p-2.5 font-mono text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Keypad Cepat */}
              <div>
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Keypad Fungsi & Operator:</div>
                <div className="flex flex-wrap gap-1.5">
                  {['+', '-', '*', '/', '^', '(', ')', '==', '!=', '>=', '<=', 'AND', 'OR', 'NOT'].map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => handleInsertOp(sym)}
                      className="px-2.5 py-1 text-xs font-mono font-semibold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      {sym}
                    </button>
                  ))}
                  {['MEAN()', 'SUM()', 'SQRT()', 'LOG()', 'LN()', 'ABS()', 'IF(cond, 1, 0)'].map((fn) => (
                    <button
                      key={fn}
                      type="button"
                      onClick={() => handleInsertOp(fn)}
                      className="px-2 py-1 text-xs font-mono font-semibold rounded border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300"
                    >
                      {fn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Opsi Simpan sebagai Dataset Baru */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={saveAsNew}
                onChange={(e) => setSaveAsNew(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Simpan hasil sebagai salinan dataset baru (jangan ubah dataset aktif)</span>
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

          {/* Live Preview Section */}
          {preview && (
            <div className="border border-blue-200 dark:border-blue-900/50 rounded-lg p-3 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-800 dark:text-blue-300">
                  Pratinjau Hasil Variabel: <span className="font-mono">{preview.target_variable}</span>
                </span>
                <span className="text-slate-500">
                  Valid: <b className="text-emerald-600">{preview.valid_count}</b> | Missing:{' '}
                  <b className="text-amber-600">{preview.missing_count}</b>
                </span>
              </div>
              {preview.warnings.length > 0 && (
                <div className="text-[11px] text-amber-700 dark:text-amber-300">
                  {preview.warnings.join(' • ')}
                </div>
              )}
              <div className="overflow-x-auto max-h-36 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold">
                    <tr>
                      <th className="p-1.5">No</th>
                      <th className="p-1.5 bg-blue-100/70 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-mono">
                        {preview.target_variable} (Hasil)
                      </th>
                      {variables.slice(0, 4).map((v) => (
                        <th key={v.name} className="p-1.5 font-mono">{v.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview_rows.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60">
                        <td className="p-1.5 text-slate-400">{i + 1}</td>
                        <td className="p-1.5 font-bold font-mono text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20">
                          {r[preview.target_variable] !== null && r[preview.target_variable] !== undefined
                            ? String(r[preview.target_variable])
                            : <span className="text-slate-300 italic">missing</span>}
                        </td>
                        {variables.slice(0, 4).map((v) => (
                          <td key={v.name} className="p-1.5 text-slate-600 dark:text-slate-400 font-mono">
                            {r[v.name] ?? '-'}
                          </td>
                        ))}
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
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
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
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition flex items-center gap-1.5"
            >
              {loading ? 'Memproses...' : 'Terapkan Transformasi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

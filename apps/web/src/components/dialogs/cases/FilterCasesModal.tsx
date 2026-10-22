import React, { useState } from 'react'
import { VariableDefinition, FilterCasesResponse } from '@/types'
import { filterCases } from '@/services/caseApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  datasetId: string
  variables: VariableDefinition[]
  onApplyFilter: (matchedRowIds: (number | string)[] | null, conditionText: string | null) => void
  onNewDatasetCreated?: (newDatasetId: string) => void
}

export const FilterCasesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  datasetId,
  variables,
  onApplyFilter,
  onNewDatasetCreated,
}) => {
  const [expression, setExpression] = useState('')
  const [mode, setMode] = useState<'temporary' | 'new_dataset'>('temporary')
  const [newDatasetName, setNewDatasetName] = useState('')

  const [preview, setPreview] = useState<FilterCasesResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleInsertVar = (varName: string) => {
    setExpression((prev) => (prev ? `${prev} ${varName}` : varName))
  }

  const handleInsertOp = (op: string) => {
    setExpression((prev) => (prev ? `${prev} ${op}` : op))
  }

  const handleTestFilter = async () => {
    if (!expression.trim()) {
      setError('Kondisi filter tidak boleh kosong.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await filterCases(datasetId, {
        condition_expression: expression.trim(),
        mode: 'temporary',
      })
      setPreview(res)
    } catch (err: any) {
      setError(err.message || 'Gagal mengevaluasi kondisi filter.')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!expression.trim()) {
      setError('Kondisi filter tidak boleh kosong.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await filterCases(datasetId, {
        condition_expression: expression.trim(),
        mode,
        new_dataset_name: mode === 'new_dataset' ? newDatasetName.trim() || undefined : undefined,
      })

      if (mode === 'new_dataset' && res.new_dataset_id && onNewDatasetCreated) {
        onNewDatasetCreated(res.new_dataset_id)
      } else {
        onApplyFilter(res.matched_row_ids, expression.trim())
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menerapkan filter kasus.')
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilter = () => {
    onApplyFilter(null, null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400">
                🔍
              </span>
              Saring / Pilih Kasus (Filter & Select Cases)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pilih baris berdasarkan kondisi logika (misal: <code>USIA &gt;= 18 AND STATUS == &apos;Aktif&apos;</code>)
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

          {/* Builder */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-800/40">
              <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Variabel:</div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {variables.map((v) => (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => handleInsertVar(v.name)}
                    className="w-full text-left px-2 py-1 rounded hover:bg-cyan-100 dark:hover:bg-cyan-900/40 text-slate-700 dark:text-slate-200 font-mono flex items-center justify-between"
                  >
                    <span>{v.name}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{v.type}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-2.5">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kondisi Logika Filter:
                </label>
                <textarea
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  rows={3}
                  placeholder="Contoh: USIA >= 18 AND STATUS == 'Aktif' OR SKOR_TOTAL > 50"
                  className="w-full p-2.5 font-mono text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              {/* Operators Keypad */}
              <div className="flex flex-wrap gap-1">
                {['==', '!=', '>', '<', '>=', '<=', 'AND', 'OR', 'NOT', '(', ')'].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => handleInsertOp(op)}
                    className="px-2 py-1 rounded border border-slate-300 bg-white dark:bg-slate-800 font-mono font-semibold hover:bg-slate-100"
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/40 space-y-2">
            <div className="font-semibold text-slate-700 dark:text-slate-300">Metode Penerapan:</div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="filter_mode"
                checked={mode === 'temporary'}
                onChange={() => setMode('temporary')}
                className="text-cyan-600"
              />
              <span>
                <b>Filter Sementara:</b> Tandai dan sembunyikan baris yang tidak cocok di tabel Data Editor (tanpa menghapus data)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="filter_mode"
                checked={mode === 'new_dataset'}
                onChange={() => setMode('new_dataset')}
                className="text-cyan-600"
              />
              <span>
                <b>Buat Dataset Baru:</b> Simpan kasus yang lolos filter ke dataset baru terpisah
              </span>
            </label>
            {mode === 'new_dataset' && (
              <div className="pl-6 pt-1">
                <input
                  type="text"
                  value={newDatasetName}
                  onChange={(e) => setNewDatasetName(e.target.value)}
                  placeholder="Nama dataset baru..."
                  className="w-64 px-2.5 py-1 rounded border border-slate-300 bg-white dark:bg-slate-800"
                />
              </div>
            )}
          </div>

          {/* Test Evaluation Result */}
          {preview && (
            <div className="border border-cyan-200 dark:border-cyan-900/50 rounded-lg p-3 bg-cyan-50/40 dark:bg-cyan-950/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-cyan-900 dark:text-cyan-200">Hasil Evaluasi Filter:</span>
                <div className="text-slate-600 dark:text-slate-300 mt-0.5">
                  Lolos / Cocok: <b className="text-emerald-600">{preview.matched_cases} baris</b> dari total {preview.total_cases} baris ({preview.excluded_cases} disaring keluar)
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800">
                {Math.round((preview.matched_cases / (preview.total_cases || 1)) * 100)}% Lolos
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestFilter}
              disabled={loading}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            >
              ⚡ Uji Kondisi Filter
            </button>
            <button
              type="button"
              onClick={handleClearFilter}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
            >
              Reset Filter Grid
            </button>
          </div>

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
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm"
            >
              {loading ? 'Memproses...' : 'Terapkan Filter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

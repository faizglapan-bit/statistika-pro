import React, { useState } from 'react'
import { VariableDefinition, AdvancedAnalysisResult } from '@/types'
import { runCrosstabs } from '@/services/advancedAnalysisApi'
import {
  Table2,
  RotateCcw,
  Play,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  datasetId: string
  variables: VariableDefinition[]
  onSuccess: (result: AdvancedAnalysisResult) => void
}

export const CrosstabsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  datasetId,
  variables,
  onSuccess,
}) => {
  const [rowVar, setRowVar] = useState<string>('')
  const [colVar, setColVar] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleReset = () => {
    setRowVar('')
    setColVar('')
    setError(null)
  }

  const handleRun = async () => {
    if (!rowVar || !colVar) {
      setError('Pilih variabel baris dan variabel kolom.')
      return
    }
    if (rowVar === colVar) {
      setError('Variabel baris dan variabel kolom tidak boleh sama.')
      return
    }

    setError(null)
    setLoading(true)
    try {
      const res = await runCrosstabs(datasetId, {
        row_variable: rowVar,
        column_variable: colVar,
      })
      onSuccess(res)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menjalankan analisis Crosstabs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Table2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Tabulasi Silang & Chi-Square (Crosstabs)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tabel Kontingensi, Pearson Chi-Square, Fisher's Exact, & Cramér's V
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Variabel Baris (Row Variable)
            </label>
            <select
              value={rowVar}
              onChange={(e) => setRowVar(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- Pilih Variabel Baris --</option>
              {variables.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} {v.label ? `(${v.label})` : ''} [{v.measure}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Variabel Kolom (Column Variable)
            </label>
            <select
              value={colVar}
              onChange={(e) => setColVar(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- Pilih Variabel Kolom --</option>
              {variables.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} {v.label ? `(${v.label})` : ''} [{v.measure}]
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">Output yang Dihasilkan:</span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>Tabel Frekuensi Observasi vs Ekspektasi, Row %, Col %, Total %</li>
              <li>Pearson Chi-Square, Likelihood Ratio, & Yates' Continuity Correction</li>
              <li>Fisher's Exact Test (otomatis untuk tabel 2×2)</li>
              <li>Kekuatan Asosiasi: Phi (φ), Cramér's V, dan Koefisien Kontingensi</li>
              <li>Peringatan otomatis jika sel dengan frekuensi ekspektasi &lt; 5 melebihi 20%</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleRun}
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Jalankan Crosstabs
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

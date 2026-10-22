import React, { useState, useMemo } from 'react'
import { VariableDefinition, AdvancedAnalysisResult } from '@/types'
import { runOneWayAnova } from '@/services/advancedAnalysisApi'
import {
  Layers,
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

export const AnovaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  datasetId,
  variables,
  onSuccess,
}) => {
  const [dependentVar, setDependentVar] = useState<string>('')
  const [factorVar, setFactorVar] = useState<string>('')
  const [postHoc, setPostHoc] = useState<'auto' | 'tukey' | 'games-howell' | 'none'>('auto')
  const [confLevel, setConfLevel] = useState<number>(0.95)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const numericVars = useMemo(() => {
    return variables.filter((v) => v.type === 'numeric')
  }, [variables])

  if (!isOpen) return null

  const handleReset = () => {
    setDependentVar('')
    setFactorVar('')
    setPostHoc('auto')
    setConfLevel(0.95)
    setError(null)
  }

  const handleRun = async () => {
    if (!dependentVar) {
      setError('Pilih variabel terikat (Dependent Variable - Numerik).')
      return
    }
    if (!factorVar) {
      setError('Pilih variabel faktor (Grouping / Factor Variable).')
      return
    }
    if (dependentVar === factorVar) {
      setError('Variabel terikat dan faktor tidak boleh sama.')
      return
    }

    setError(null)
    setLoading(true)
    try {
      const res = await runOneWayAnova(datasetId, {
        dependent_variable: dependentVar,
        factor_variable: factorVar,
        post_hoc: postHoc,
        confidence_level: confLevel,
      })
      onSuccess(res)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menjalankan Analisis Varians (ANOVA).')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Analisis Varians Satu Jalur (One-Way ANOVA)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Uji Kesetaraan Rerata, Welch ANOVA, dan Uji Post-Hoc Berganda
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

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Variabel Terikat (Dependent Variable - Numerik)
            </label>
            <select
              value={dependentVar}
              onChange={(e) => setDependentVar(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Pilih Variabel Terikat --</option>
              {numericVars.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} {v.label ? `(${v.label})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Variabel Faktor (Grouping / Independent Variable)
            </label>
            <select
              value={factorVar}
              onChange={(e) => setFactorVar(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Pilih Variabel Faktor --</option>
              {variables.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} {v.label ? `(${v.label})` : ''} [{v.measure}]
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-3">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Pengaturan Uji Komparasi Berganda (Post-Hoc Tests)
            </span>
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="posthoc"
                  checked={postHoc === 'auto'}
                  onChange={() => setPostHoc('auto')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
                    Rekomendasi Cerdas Otomatis (Direkomendasikan)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Menjalankan Tukey HSD jika uji Levene homogen (p ≥ 0.05), atau Games-Howell jika varians heterogen (p &lt; 0.05).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="posthoc"
                  checked={postHoc === 'tukey'}
                  onChange={() => setPostHoc('tukey')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
                    Tukey's HSD
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Asumsi varians homogen (Equal variances assumed).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="posthoc"
                  checked={postHoc === 'games-howell'}
                  onChange={() => setPostHoc('games-howell')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
                    Games-Howell
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Robust terhadap varians tidak homogen dan ukuran sampel tidak seimbang.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="posthoc"
                  checked={postHoc === 'none'}
                  onChange={() => setPostHoc('none')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
                    Tanpa Uji Post-Hoc
                  </span>
                </div>
              </label>
            </div>
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
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Jalankan ANOVA
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

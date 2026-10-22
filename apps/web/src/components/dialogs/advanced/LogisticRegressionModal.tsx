import React, { useState } from 'react'
import { VariableDefinition, AdvancedAnalysisResult } from '@/types'
import { runLogisticRegression } from '@/services/advancedAnalysisApi'
import {
  TrendingUp,
  RotateCcw,
  Play,
  X,
  AlertTriangle,
  Loader2,
  CheckSquare,
  Square,
} from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  datasetId: string
  variables: VariableDefinition[]
  onSuccess: (result: AdvancedAnalysisResult) => void
}

export const LogisticRegressionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  datasetId,
  variables,
  onSuccess,
}) => {
  const [dependentVar, setDependentVar] = useState<string>('')
  const [independentVars, setIndependentVars] = useState<string[]>([])
  const [categoricalVars, setCategoricalVars] = useState<string[]>([])
  const [referenceCat, setReferenceCat] = useState<'first' | 'last'>('last')
  const [cutoff, setCutoff] = useState<number>(0.5)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleReset = () => {
    setDependentVar('')
    setIndependentVars([])
    setCategoricalVars([])
    setReferenceCat('last')
    setCutoff(0.5)
    setError(null)
  }

  const toggleIndepVar = (name: string) => {
    if (name === dependentVar) return
    setIndependentVars((prev) => {
      const next = prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
      // Jika dihapus dari prediktor, hapus juga dari kategorikal
      if (!next.includes(name)) {
        setCategoricalVars((c) => c.filter((cv) => cv !== name))
      }
      return next
    })
  }

  const toggleCatVar = (name: string) => {
    setCategoricalVars((prev) =>
      prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
    )
  }

  const handleRun = async () => {
    if (!dependentVar) {
      setError('Pilih variabel dependen biner (harus memiliki tepat 2 kategori).')
      return
    }
    if (independentVars.length === 0) {
      setError('Pilih minimal satu variabel prediktor (independen).')
      return
    }

    setError(null)
    setLoading(true)
    try {
      const res = await runLogisticRegression(datasetId, {
        dependent_variable: dependentVar,
        independent_variables: independentVars,
        categorical_variables: categoricalVars,
        reference_category: referenceCat,
        cutoff: cutoff,
      })
      onSuccess(res)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menjalankan Regresi Logistik Biner.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Regresi Logistik Biner (Binary Logistic Regression)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Odds Ratio Exp(B), Uji Wald, Hosmer-Lemeshow, & Tabel Klasifikasi
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
              Variabel Dependen Biner (2 Kategori, mis. 0/1 atau Ya/Tidak)
            </label>
            <select
              value={dependentVar}
              onChange={(e) => {
                const val = e.target.value
                setDependentVar(val)
                setIndependentVars((prev) => prev.filter((v) => v !== val))
                setCategoricalVars((prev) => prev.filter((v) => v !== val))
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Pilih Variabel Dependen --</option>
              {variables.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} {v.label ? `(${v.label})` : ''} [{v.measure}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Pilih Variabel Prediktor / Independen (Covariates):
            </label>
            <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-1 bg-slate-50/50 dark:bg-slate-800/30">
              {variables
                .filter((v) => v.name !== dependentVar)
                .map((v) => {
                  const isChecked = independentVars.includes(v.name)
                  return (
                    <div
                      key={v.name}
                      onClick={() => toggleIndepVar(v.name)}
                      className="flex items-center gap-2 p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded cursor-pointer text-xs"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="font-medium text-slate-800 dark:text-slate-200">{v.name}</span>
                      {v.label && <span className="text-slate-500">({v.label})</span>}
                      <span className="ml-auto text-[10px] text-slate-400 uppercase font-mono">{v.type}</span>
                    </div>
                  )
                })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Terpilih: {independentVars.length} prediktor.</p>
          </div>

          {independentVars.length > 0 && (
            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-lg space-y-3">
              <span className="text-xs font-semibold text-purple-900 dark:text-purple-200 block">
                Prediktor Kategorikal (Dummy Encoding):
              </span>
              <p className="text-[11px] text-purple-700 dark:text-purple-300">
                Centang prediktor yang berskala nominal/ordinal agar otomatis dikonversi menjadi dummy variables:
              </p>
              <div className="flex flex-wrap gap-2">
                {independentVars.map((vName) => {
                  const isCat = categoricalVars.includes(vName)
                  return (
                    <button
                      key={vName}
                      type="button"
                      onClick={() => toggleCatVar(vName)}
                      className={`px-2.5 py-1 text-xs rounded-md border font-medium transition ${
                        isCat
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {vName} {isCat ? '(Kategorikal)' : '(Kontinu)'}
                    </button>
                  )
                })}
              </div>

              {categoricalVars.length > 0 && (
                <div className="pt-2 border-t border-purple-200 dark:border-purple-900/50 flex items-center justify-between text-xs">
                  <span className="text-purple-800 dark:text-purple-300 font-medium">Kategori Referensi:</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="refCat"
                        checked={referenceCat === 'last'}
                        onChange={() => setReferenceCat('last')}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300">Terakhir (Default SPSS)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="refCat"
                        checked={referenceCat === 'first'}
                        onChange={() => setReferenceCat('first')}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300">Pertama</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 items-center pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ambang Batas Klasifikasi (Cutoff): {cutoff}
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={cutoff}
                onChange={(e) => setCutoff(parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Probabilitas prediksi ≥ {cutoff} diklasifikasikan ke dalam kategori target (1).
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
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Jalankan Regresi Logistik
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

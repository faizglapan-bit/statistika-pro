import React, { useState, useMemo } from 'react'
import { VariableDefinition, AdvancedAnalysisResult } from '@/types'
import {
  runMannWhitney,
  runWilcoxon,
  runKruskalWallis,
  runFriedman,
  runKendallTau,
} from '@/services/advancedAnalysisApi'
import {
  Activity,
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

type NonparamTab = 'mann_whitney' | 'wilcoxon' | 'kruskal' | 'friedman' | 'kendall'

export const NonparametricModal: React.FC<Props> = ({
  isOpen,
  onClose,
  datasetId,
  variables,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<NonparamTab>('mann_whitney')

  // Mann-Whitney State
  const [mwTestVar, setMwTestVar] = useState<string>('')
  const [mwGroupVar, setMwGroupVar] = useState<string>('')

  // Wilcoxon State
  const [wilcVar1, setWilcVar1] = useState<string>('')
  const [wilcVar2, setWilcVar2] = useState<string>('')

  // Kruskal-Wallis State
  const [kwDepVar, setKwDepVar] = useState<string>('')
  const [kwFactorVar, setKwFactorVar] = useState<string>('')

  // Friedman State (repeated measures checklist)
  const [friedmanVars, setFriedmanVars] = useState<string[]>([])

  // Kendall State
  const [kendallVar1, setKendallVar1] = useState<string>('')
  const [kendallVar2, setKendallVar2] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const numericVars = useMemo(() => {
    return variables.filter((v) => v.type === 'numeric')
  }, [variables])

  if (!isOpen) return null

  const handleReset = () => {
    setMwTestVar('')
    setMwGroupVar('')
    setWilcVar1('')
    setWilcVar2('')
    setKwDepVar('')
    setKwFactorVar('')
    setFriedmanVars([])
    setKendallVar1('')
    setKendallVar2('')
    setError(null)
  }

  const toggleFriedmanVar = (name: string) => {
    setFriedmanVars((prev) =>
      prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
    )
  }

  const handleRun = async () => {
    setError(null)
    setLoading(true)
    try {
      let res: AdvancedAnalysisResult
      if (activeTab === 'mann_whitney') {
        if (!mwTestVar || !mwGroupVar) {
          throw new Error('Pilih variabel uji dan variabel pengelompok.')
        }
        res = await runMannWhitney(datasetId, {
          test_variable: mwTestVar,
          grouping_variable: mwGroupVar,
        })
      } else if (activeTab === 'wilcoxon') {
        if (!wilcVar1 || !wilcVar2) {
          throw new Error('Pilih Variabel 1 dan Variabel 2 untuk uji berpasangan.')
        }
        res = await runWilcoxon(datasetId, {
          variable1: wilcVar1,
          variable2: wilcVar2,
        })
      } else if (activeTab === 'kruskal') {
        if (!kwDepVar || !kwFactorVar) {
          throw new Error('Pilih variabel terikat dan variabel faktor.')
        }
        res = await runKruskalWallis(datasetId, {
          dependent_variable: kwDepVar,
          factor_variable: kwFactorVar,
        })
      } else if (activeTab === 'friedman') {
        if (friedmanVars.length < 3) {
          throw new Error('Pilih minimal 3 variabel untuk uji pengukuran berulang Friedman.')
        }
        res = await runFriedman(datasetId, {
          variables: friedmanVars,
        })
      } else {
        if (!kendallVar1 || !kendallVar2) {
          throw new Error('Pilih kedua variabel ordinal untuk korelasi Kendall.')
        }
        res = await runKendallTau(datasetId, {
          variable1: kendallVar1,
          variable2: kendallVar2,
        })
      }

      onSuccess(res)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menjalankan uji statistik nonparametrik.')
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
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Uji Statistik Nonparametrik
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mann-Whitney, Wilcoxon, Kruskal-Wallis, Friedman, & Kendall's Tau-b
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/30 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('mann_whitney'); setError(null); }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition -mb-px ${
              activeTab === 'mann_whitney'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Mann-Whitney U
          </button>
          <button
            onClick={() => { setActiveTab('wilcoxon'); setError(null); }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition -mb-px ${
              activeTab === 'wilcoxon'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Wilcoxon Signed-Rank
          </button>
          <button
            onClick={() => { setActiveTab('kruskal'); setError(null); }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition -mb-px ${
              activeTab === 'kruskal'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Kruskal-Wallis
          </button>
          <button
            onClick={() => { setActiveTab('friedman'); setError(null); }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition -mb-px ${
              activeTab === 'friedman'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Friedman Test
          </button>
          <button
            onClick={() => { setActiveTab('kendall'); setError(null); }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition -mb-px ${
              activeTab === 'kendall'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Kendall's Tau-b
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* MANN-WHITNEY */}
          {activeTab === 'mann_whitney' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Variabel Uji (Test Variable - Numerik / Ordinal)
                </label>
                <select
                  value={mwTestVar}
                  onChange={(e) => setMwTestVar(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Pilih Variabel Uji --</option>
                  {numericVars.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} {v.label ? `(${v.label})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Variabel Kelompok (Grouping Variable - 2 Kategori)
                </label>
                <select
                  value={mwGroupVar}
                  onChange={(e) => setMwGroupVar(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Pilih Variabel Kelompok --</option>
                  {variables.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} {v.label ? `(${v.label})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* WILCOXON */}
          {activeTab === 'wilcoxon' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Pilih dua variabel berpasangan untuk menguji perbedaan peringkat median:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Variabel 1 (Sebelum / Baseline)
                  </label>
                  <select
                    value={wilcVar1}
                    onChange={(e) => setWilcVar1(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    <option value="">-- Pilih Variabel 1 --</option>
                    {numericVars.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} {v.label ? `(${v.label})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Variabel 2 (Sesudah / Follow-up)
                  </label>
                  <select
                    value={wilcVar2}
                    onChange={(e) => setWilcVar2(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    <option value="">-- Pilih Variabel 2 --</option>
                    {numericVars.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} {v.label ? `(${v.label})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* KRUSKAL-WALLIS */}
          {activeTab === 'kruskal' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Variabel Terikat (Dependent Variable - Numerik / Ordinal)
                </label>
                <select
                  value={kwDepVar}
                  onChange={(e) => setKwDepVar(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
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
                  Variabel Faktor (Grouping Variable - ≥ 2 Kategori)
                </label>
                <select
                  value={kwFactorVar}
                  onChange={(e) => setKwFactorVar(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Pilih Variabel Faktor --</option>
                  {variables.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} {v.label ? `(${v.label})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-500">
                Uji Kruskal-Wallis secara otomatis menyertakan perbandingan post-hoc Dunn's Test dengan penyesuaian Bonferroni.
              </p>
            </div>
          )}

          {/* FRIEDMAN */}
          {activeTab === 'friedman' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pilih Pengukuran Berulang (Minimal 3 Variabel):
              </label>
              <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-1 bg-slate-50/50 dark:bg-slate-800/30">
                {numericVars.map((v) => {
                  const isChecked = friedmanVars.includes(v.name)
                  return (
                    <div
                      key={v.name}
                      onClick={() => toggleFriedmanVar(v.name)}
                      className="flex items-center gap-2 p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded cursor-pointer text-xs"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="font-medium text-slate-800 dark:text-slate-200">{v.name}</span>
                      {v.label && <span className="text-slate-500">({v.label})</span>}
                    </div>
                  )
                })}
              </div>
              <p className="text-[11px] text-slate-500">
                Terpilih: {friedmanVars.length} variabel.
              </p>
            </div>
          )}

          {/* KENDALL'S TAU-B */}
          {activeTab === 'kendall' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Pilih sepasang variabel ordinal untuk korelasi konkordansi Kendall's Tau-b:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Variabel 1
                  </label>
                  <select
                    value={kendallVar1}
                    onChange={(e) => setKendallVar1(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    <option value="">-- Pilih Variabel 1 --</option>
                    {numericVars.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} {v.label ? `(${v.label})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Variabel 2
                  </label>
                  <select
                    value={kendallVar2}
                    onChange={(e) => setKendallVar2(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    <option value="">-- Pilih Variabel 2 --</option>
                    {numericVars.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} {v.label ? `(${v.label})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
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
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Jalankan Uji
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useMemo } from 'react'
import { VariableDefinition, AdvancedAnalysisResult } from '@/types'
import {
  runOneSampleTTest,
  runIndependentTTest,
  runPairedTTest,
} from '@/services/advancedAnalysisApi'
import {
  Scale,
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

type TTestTab = 'one_sample' | 'independent' | 'paired'

export const TTestModal: React.FC<Props> = ({
  isOpen,
  onClose,
  datasetId,
  variables,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<TTestTab>('one_sample')

  // One-Sample State
  const [oneVar, setOneVar] = useState<string>('')
  const [testValue, setTestValue] = useState<number>(0.0)
  const [confLevel, setConfLevel] = useState<number>(0.95)

  // Independent State
  const [indepTestVar, setIndepTestVar] = useState<string>('')
  const [indepGroupVar, setIndepGroupVar] = useState<string>('')
  const [group1Val, setGroup1Val] = useState<string>('')
  const [group2Val, setGroup2Val] = useState<string>('')

  // Paired State
  const [pairedVar1, setPairedVar1] = useState<string>('')
  const [pairedVar2, setPairedVar2] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const numericVars = useMemo(() => {
    return variables.filter((v) => v.type === 'numeric')
  }, [variables])

  if (!isOpen) return null

  const handleReset = () => {
    setOneVar('')
    setTestValue(0.0)
    setConfLevel(0.95)
    setIndepTestVar('')
    setIndepGroupVar('')
    setGroup1Val('')
    setGroup2Val('')
    setPairedVar1('')
    setPairedVar2('')
    setError(null)
  }

  const handleRun = async () => {
    setError(null)
    setLoading(true)
    try {
      let res: AdvancedAnalysisResult
      if (activeTab === 'one_sample') {
        if (!oneVar) {
          throw new Error('Pilih variabel uji untuk One-Sample t-test.')
        }
        res = await runOneSampleTTest(datasetId, {
          variable: oneVar,
          test_value: testValue,
          confidence_level: confLevel,
        })
      } else if (activeTab === 'independent') {
        if (!indepTestVar) {
          throw new Error('Pilih variabel uji (numerik) yang ingin dibandingkan.')
        }
        if (!indepGroupVar) {
          throw new Error('Pilih variabel pengelompok (kategorikal/diskrit).')
        }
        res = await runIndependentTTest(datasetId, {
          test_variable: indepTestVar,
          grouping_variable: indepGroupVar,
          group1_val: group1Val.trim() ? group1Val.trim() : undefined,
          group2_val: group2Val.trim() ? group2Val.trim() : undefined,
          confidence_level: confLevel,
        })
      } else {
        if (!pairedVar1 || !pairedVar2) {
          throw new Error('Pilih kedua variabel (Variabel 1 dan Variabel 2) untuk uji berpasangan.')
        }
        if (pairedVar1 === pairedVar2) {
          throw new Error('Variabel 1 dan Variabel 2 tidak boleh identik.')
        }
        res = await runPairedTTest(datasetId, {
          variable1: pairedVar1,
          variable2: pairedVar2,
          confidence_level: confLevel,
        })
      }

      onSuccess(res)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menjalankan uji t.')
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
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Uji Beda Rata-rata (t-test)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                One-Sample, Independent Samples, & Paired Samples t-test
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
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            onClick={() => { setActiveTab('one_sample'); setError(null); }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition -mb-px flex items-center gap-1.5 ${
              activeTab === 'one_sample'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            One-Sample t-test
          </button>
          <button
            onClick={() => { setActiveTab('independent'); setError(null); }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition -mb-px flex items-center gap-1.5 ${
              activeTab === 'independent'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Independent Samples t-test
          </button>
          <button
            onClick={() => { setActiveTab('paired'); setError(null); }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition -mb-px flex items-center gap-1.5 ${
              activeTab === 'paired'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Paired Samples t-test
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: ONE-SAMPLE */}
          {activeTab === 'one_sample' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Variabel Uji (Numerik)
                </label>
                <select
                  value={oneVar}
                  onChange={(e) => setOneVar(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Variabel --</option>
                  {numericVars.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} {v.label ? `(${v.label})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nilai Acuan Hipotesis (Test Value μ₀)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={testValue}
                    onChange={(e) => setTestValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Nilai baku acuan yang diuji terhadap rata-rata sampel.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tingkat Kepercayaan (Confidence Level)
                  </label>
                  <select
                    value={confLevel}
                    onChange={(e) => setConfLevel(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    <option value={0.90}>90% (α = 0.10)</option>
                    <option value={0.95}>95% (α = 0.05) — Standar</option>
                    <option value={0.99}>99% (α = 0.01)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INDEPENDENT SAMPLES */}
          {activeTab === 'independent' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Variabel Uji (Test Variable - Numerik)
                </label>
                <select
                  value={indepTestVar}
                  onChange={(e) => setIndepTestVar(e.target.value)}
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
                  Variabel Pengelompok (Grouping Variable)
                </label>
                <select
                  value={indepGroupVar}
                  onChange={(e) => setIndepGroupVar(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Pilih Variabel Pengelompok --</option>
                  {variables.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} {v.label ? `(${v.label})` : ''} [{v.measure}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Definisikan Nilai Kelompok (Opsional)
                </span>
                <p className="text-[11px] text-slate-500">
                  Kosongkan jika ingin sistem mendeteksi otomatis 2 kelompok pertama pada kolom.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                      Nilai Kelompok 1 (mis. "1" atau "L")
                    </label>
                    <input
                      type="text"
                      value={group1Val}
                      onChange={(e) => setGroup1Val(e.target.value)}
                      placeholder="Auto"
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                      Nilai Kelompok 2 (mis. "2" atau "P")
                    </label>
                    <input
                      type="text"
                      value={group2Val}
                      onChange={(e) => setGroup2Val(e.target.value)}
                      placeholder="Auto"
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAIRED SAMPLES */}
          {activeTab === 'paired' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Pilih sepasang variabel numerik yang diukur berulang pada responden/baris yang sama (format wide):
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Variabel 1 (Sebelum / Pre)
                  </label>
                  <select
                    value={pairedVar1}
                    onChange={(e) => setPairedVar1(e.target.value)}
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
                    Variabel 2 (Sesudah / Post)
                  </label>
                  <select
                    value={pairedVar2}
                    onChange={(e) => setPairedVar2(e.target.value)}
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
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition disabled:opacity-50"
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

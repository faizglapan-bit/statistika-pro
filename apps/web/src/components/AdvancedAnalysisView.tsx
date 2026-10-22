import React, { useState } from 'react'
import { VariableDefinition, DataRow, AdvancedAnalysisResult } from '@/types'
import {
  Scale,
  Layers,
  Activity,
  Table2,
  TrendingUp,
  BarChart2,
  ChevronRight,
  Database,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { TTestModal } from './dialogs/advanced/TTestModal'
import { AnovaModal } from './dialogs/advanced/AnovaModal'
import { NonparametricModal } from './dialogs/advanced/NonparametricModal'
import { CrosstabsModal } from './dialogs/advanced/CrosstabsModal'
import { LogisticRegressionModal } from './dialogs/advanced/LogisticRegressionModal'
import { ChartsModal } from './dialogs/advanced/ChartsModal'

interface Props {
  datasetId: string | null
  datasetName: string
  variables: VariableDefinition[]
  rows: DataRow[]
  onNavigateToOutput: (outputId?: string) => void
  onNavigateToEditor: () => void
}

export const AdvancedAnalysisView: React.FC<Props> = ({
  datasetId,
  datasetName,
  variables,
  rows,
  onNavigateToOutput,
  onNavigateToEditor,
}) => {
  const [activeModal, setActiveModal] = useState<
    'ttest' | 'anova' | 'nonparametric' | 'crosstabs' | 'logistic' | 'charts' | null
  >(null)

  const handleAnalysisSuccess = (result: AdvancedAnalysisResult) => {
    if (result.output_id) {
      onNavigateToOutput(result.output_id)
    }
  }

  const modules = [
    {
      id: 'ttest',
      title: 'Uji Beda Rata-rata (t-test)',
      desc: 'One-Sample t-test, Independent Samples t-test (Student & Welch), dan Paired Samples t-test dengan ukuran efek Cohen\'s d & Hedges\' g.',
      icon: Scale,
      color: 'bg-blue-500',
      tag: 'Parametrik',
      methods: ['One-Sample t-test', 'Independent Samples t-test', 'Paired Samples t-test', 'Levene\'s Test'],
    },
    {
      id: 'anova',
      title: 'Analisis Varians (One-Way ANOVA)',
      desc: 'Uji kesetaraan rata-rata multi-kelompok, Welch ANOVA, uji homogenitas Levene, serta komparasi berganda Tukey HSD & Games-Howell.',
      icon: Layers,
      color: 'bg-indigo-500',
      tag: 'Parametrik',
      methods: ['One-Way ANOVA', 'Welch ANOVA', 'Tukey HSD Post-Hoc', 'Games-Howell Post-Hoc'],
    },
    {
      id: 'nonparametric',
      title: 'Statistik Nonparametrik',
      desc: 'Uji distribusi independen & berpasangan tanpa asumsi normalitas (Mann-Whitney U, Wilcoxon, Kruskal-Wallis + Dunn, Friedman, Kendall Tau-b).',
      icon: Activity,
      color: 'bg-emerald-500',
      tag: 'Nonparametrik',
      methods: ['Mann-Whitney U', 'Wilcoxon Signed-Rank', 'Kruskal-Wallis + Dunn', 'Friedman Test', 'Kendall\'s Tau-b'],
    },
    {
      id: 'crosstabs',
      title: 'Tabulasi Silang & Chi-Square (Crosstabs)',
      desc: 'Tabel kontingensi frekuensi & ekspektasi, Pearson Chi-Square, Fisher\'s Exact Test, dan ukuran kekuatan asosiasi Cramér\'s V.',
      icon: Table2,
      color: 'bg-teal-500',
      tag: 'Kategorikal',
      methods: ['Tabel Kontingensi (O & E)', 'Pearson Chi-Square', 'Fisher\'s Exact Test', 'Cramér\'s V'],
    },
    {
      id: 'logistic',
      title: 'Regresi Logistik Biner (Binary Logit)',
      desc: 'Pemodelan probabilitas variabel dependen biner, rasio odds Exp(B), Uji Wald, Hosmer-Lemeshow goodness-of-fit, & Confusion Matrix.',
      icon: TrendingUp,
      color: 'bg-purple-500',
      tag: 'Regresi Lanjutan',
      methods: ['Odds Ratio Exp(B)', 'Nagelkerke R²', 'Hosmer-Lemeshow Test', 'Tabel Klasifikasi'],
    },
    {
      id: 'charts',
      title: 'Visualisasi Grafik Statistik Interaktif',
      desc: 'Visualisasi analitik berbasis komputasi matematis presisi dengan opsi ekspor gambar PNG beresolusi tinggi.',
      icon: BarChart2,
      color: 'bg-cyan-500',
      tag: 'Visualisasi',
      methods: ['Histogram & Kurva Normal', 'Boxplot & Outliers', 'Scatter Plot & OLS', 'Heatmap Korelasi', 'Normal Q-Q Plot'],
    },
  ]

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400">
                Tahap 6 — Advanced Modules
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">|</span>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span>Dataset: <strong>{datasetName}</strong> ({rows.length} baris, {variables.length} variabel)</span>
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Statistik Lanjutan (Advanced Statistics)
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Pilih modul uji parametrik, nonparametrik, model regresi lanjutan, atau visualisasi analitik untuk dijalankan pada dataset aktif Anda.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateToOutput()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              Buka Output Viewer
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="p-8 max-w-6xl mx-auto w-full flex-1">
        {!datasetId ? (
          <div className="p-8 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
              Dataset Belum Tersimpan di Backend
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-300 max-w-md mx-auto">
              Simpan dataset aktif Anda terlebih dahulu di Editor Data atau muat dataset contoh untuk mulai menjalankan analisis statistik lanjutan.
            </p>
            <button
              onClick={onNavigateToEditor}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              Kembali ke Editor Data
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m) => {
              const Icon = m.icon
              return (
                <div
                  key={m.id}
                  onClick={() => setActiveModal(m.id as any)}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl ${m.color} text-white shadow-xs`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                        {m.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {m.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                        {m.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Metode Termasuk:
                      </span>
                      <ul className="space-y-1">
                        {m.methods.slice(0, 3).map((met, idx) => (
                          <li key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-slate-400" />
                            {met}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                    <span>Buka Dialog Uji</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialog Modals */}
      {datasetId && (
        <>
          <TTestModal
            isOpen={activeModal === 'ttest'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={handleAnalysisSuccess}
          />
          <AnovaModal
            isOpen={activeModal === 'anova'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={handleAnalysisSuccess}
          />
          <NonparametricModal
            isOpen={activeModal === 'nonparametric'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={handleAnalysisSuccess}
          />
          <CrosstabsModal
            isOpen={activeModal === 'crosstabs'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={handleAnalysisSuccess}
          />
          <LogisticRegressionModal
            isOpen={activeModal === 'logistic'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={handleAnalysisSuccess}
          />
          <ChartsModal
            isOpen={activeModal === 'charts'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
          />
        </>
      )}
    </div>
  )
}

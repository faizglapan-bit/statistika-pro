import React, { useEffect, useState } from 'react'
import { MissingSummaryResponse } from '@/types'
import { getMissingSummary } from '@/services/caseApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  datasetId: string
}

export const MissingSummaryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  datasetId,
}) => {
  const [summary, setSummary] = useState<MissingSummaryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && datasetId) {
      setLoading(true)
      setError(null)
      getMissingSummary(datasetId)
        .then(setSummary)
        .catch((err) => setError(err.message || 'Gagal memuat ringkasan missing values.'))
        .finally(() => setLoading(false))
    }
  }, [isOpen, datasetId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400">
                ⚠️
              </span>
              Ringkasan Nilai Hilang (Missing-Value Summary)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Analisis proporsi missing values per variabel dan jumlah kasus terdampak tanpa imputasi otomatis.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700">⚠️ {error}</div>}

          {loading ? (
            <div className="p-10 text-center text-slate-400">Menganalisis sebaran missing values...</div>
          ) : summary ? (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center">
                  <div className="text-[11px] text-slate-500">Total Sel Data</div>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {summary.total_cells.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">{summary.total_rows} baris × {summary.total_columns} kolom</div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center">
                  <div className="text-[11px] text-slate-500">Total Sel Missing</div>
                  <div className="text-base font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                    {summary.total_missing_cells}
                  </div>
                  <div className="text-[10px] text-orange-500">{summary.overall_missing_percentage}% dari sel</div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center">
                  <div className="text-[11px] text-slate-500">Kasus Terdampak</div>
                  <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {summary.rows_with_any_missing_count}
                  </div>
                  <div className="text-[10px] text-amber-500">{summary.rows_with_any_missing_percentage}% responden</div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center">
                  <div className="text-[11px] text-slate-500">Kasus Lengkap (Valid)</div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {summary.total_rows - summary.rows_with_any_missing_count}
                  </div>
                  <div className="text-[10px] text-emerald-500">
                    {(100 - summary.rows_with_any_missing_percentage).toFixed(1)}% lengkap
                  </div>
                </div>
              </div>

              {/* Detail per Variabel */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Rincian Nilai Hilang per Variabel:
                </span>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b">
                      <tr>
                        <th className="p-2">Nama Variabel</th>
                        <th className="p-2">Label Variabel</th>
                        <th className="p-2 text-right">Valid (N)</th>
                        <th className="p-2 text-right">Missing (N)</th>
                        <th className="p-2 text-right">% Missing</th>
                        <th className="p-2 text-center">Distribusi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {summary.variables.map((v) => (
                        <tr key={v.variable_name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2 font-mono font-medium text-slate-800 dark:text-slate-100">
                            {v.variable_name}
                          </td>
                          <td className="p-2 text-slate-500 truncate max-w-xs">{v.variable_label || '-'}</td>
                          <td className="p-2 text-right text-emerald-600 font-medium">{v.valid_count}</td>
                          <td className="p-2 text-right text-orange-600 font-medium">{v.missing_count}</td>
                          <td className="p-2 text-right font-bold text-slate-700 dark:text-slate-200">
                            {v.missing_percentage}%
                          </td>
                          <td className="p-2 w-28">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-orange-500 h-2 rounded-full"
                                style={{ width: `${v.missing_percentage}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

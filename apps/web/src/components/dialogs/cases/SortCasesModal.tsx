import React, { useState } from 'react'
import { VariableDefinition, SortVariableItem } from '@/types'
import { sortCases } from '@/services/caseApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  datasetId: string
  variables: VariableDefinition[]
  onSuccess: (updatedDataset?: any, newDatasetId?: string) => void
}

export const SortCasesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  datasetId,
  variables,
  onSuccess,
}) => {
  const [sortList, setSortList] = useState<SortVariableItem[]>([
    { name: variables[0]?.name || '', ascending: true },
  ])
  const [saveAsNew, setSaveAsNew] = useState(false)
  const [newDatasetName, setNewDatasetName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleAddSortLevel = () => {
    const unpicked = variables.find((v) => !sortList.some((s) => s.name === v.name))
    if (unpicked) {
      setSortList((prev) => [...prev, { name: unpicked.name, ascending: true }])
    }
  }

  const handleRemoveLevel = (index: number) => {
    setSortList((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateLevel = (index: number, patch: Partial<SortVariableItem>) => {
    setSortList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    )
  }

  const handleApply = async () => {
    if (sortList.length === 0) {
      setError('Pilih minimal satu variabel untuk pengurutan.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await sortCases(datasetId, {
        sort_variables: sortList,
        save_as_new_dataset: saveAsNew,
        new_dataset_name: saveAsNew ? newDatasetName.trim() || undefined : undefined,
      })
      onSuccess(res.dataset, res.new_dataset_id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal mengurutkan kasus.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>↕️</span>
              Urutkan Kasus (Sort Cases)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Urutkan baris responden berdasarkan satu atau lebih variabel bertingkat.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {error && <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700">⚠️ {error}</div>}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Tingkat Pengurutan:</span>
              <button
                type="button"
                onClick={handleAddSortLevel}
                disabled={sortList.length >= variables.length}
                className="text-blue-600 font-semibold hover:underline disabled:opacity-30"
              >
                + Tambah Variabel Urut
              </button>
            </div>

            {sortList.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <span className="font-mono text-slate-400 w-4">{idx + 1}.</span>
                <select
                  value={item.name}
                  onChange={(e) => handleUpdateLevel(idx, { name: e.target.value })}
                  className="flex-1 p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-mono"
                >
                  {variables.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.label || v.type})
                    </option>
                  ))}
                </select>
                <select
                  value={item.ascending ? 'asc' : 'desc'}
                  onChange={(e) => handleUpdateLevel(idx, { ascending: e.target.value === 'asc' })}
                  className="w-32 p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-medium"
                >
                  <option value="asc">Ascending (A-Z, 0-9)</option>
                  <option value="desc">Descending (Z-A, 9-0)</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveLevel(idx)}
                  disabled={sortList.length === 1}
                  className="text-red-500 hover:text-red-700 disabled:opacity-30 px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={saveAsNew}
                onChange={(e) => setSaveAsNew(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span>Simpan ke dataset baru</span>
            </label>
            {saveAsNew && (
              <input
                type="text"
                value={newDatasetName}
                onChange={(e) => setNewDatasetName(e.target.value)}
                placeholder="Nama dataset baru..."
                className="px-2.5 py-1 text-xs rounded border border-slate-300 bg-white dark:bg-slate-800 w-48"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
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
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            {loading ? 'Mengurutkan...' : 'Urutkan Sekarang'}
          </button>
        </div>
      </div>
    </div>
  )
}

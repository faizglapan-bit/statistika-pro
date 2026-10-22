import React, { useEffect, useState } from 'react'
import { TransformationHistoryItem } from '@/types'
import {
  getTransformationHistory,
  undoTransformation,
  rollbackTransformation,
} from '@/services/transformationApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  datasetId: string
  onSuccess: (updatedDataset?: any) => void
}

export const TransformationHistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  datasetId,
  onSuccess,
}) => {
  const [history, setHistory] = useState<TransformationHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTransformationHistory(datasetId)
      setHistory(data)
    } catch (err: any) {
      setError(err.message || 'Gagal memuat riwayat transformasi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && datasetId) {
      loadHistory()
    }
  }, [isOpen, datasetId])

  if (!isOpen) return null

  const handleUndoLatest = async () => {
    if (!window.confirm('Batalkan (Undo) operasi transformasi terakhir pada dataset ini?')) {
      return
    }
    setActionLoading(true)
    setError(null)
    try {
      const res = await undoTransformation(datasetId)
      setMessage('Operasi transformasi terakhir berhasil dibatalkan (Undo).')
      onSuccess(res.dataset)
      await loadHistory()
    } catch (err: any) {
      setError(err.message || 'Gagal melakukan undo.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRollback = async (snapshotId: string, opName: string) => {
    if (!window.confirm(`Kembalikan kondisi dataset ke snapshot sebelum '${opName}'?`)) {
      return
    }
    setActionLoading(true)
    setError(null)
    try {
      const res = await rollbackTransformation(datasetId, snapshotId)
      setMessage(`Dataset berhasil dipulihkan ke versi sebelum '${opName}'.`)
      onSuccess(res.dataset)
      await loadHistory()
    } catch (err: any) {
      setError(err.message || 'Gagal melakukan rollback.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                📜
              </span>
              Riwayat Audit Transformasi & Snapshot Undo
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daftar rekam jejak operasi data yang dapat ditelusuri dan dipulihkan kembali ke kondisi semula.
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
          {message && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800">
              ✓ {message}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-600 dark:text-slate-300">
              Total tercatat: <b>{history.length} snapshot versi</b>
            </span>
            <button
              type="button"
              onClick={handleUndoLatest}
              disabled={actionLoading || history.length === 0}
              className="px-3.5 py-1.5 text-xs font-semibold rounded bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white shadow-sm flex items-center gap-1.5 transition"
            >
              ↩️ Undo Operasi Terakhir
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-8 text-center text-slate-400">Memuat riwayat transformasi...</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-lg">
              Belum ada riwayat transformasi yang dilakukan pada dataset ini.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b">
                  <tr>
                    <th className="p-2.5">Waktu</th>
                    <th className="p-2.5">Jenis Operasi</th>
                    <th className="p-2.5">Keterangan</th>
                    <th className="p-2.5">Variabel Target</th>
                    <th className="p-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.map((h, i) => (
                    <tr key={h.snapshot_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 text-slate-500 whitespace-nowrap">
                        {h.timestamp.replace('T', ' ').slice(0, 19)}
                        {i === 0 && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 text-[10px] font-semibold">
                            Terbaru
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-100">
                        {h.operation_type}
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {h.description}
                      </td>
                      <td className="p-2.5 font-mono text-blue-600 dark:text-blue-400">
                        {h.target_vars.join(', ') || '-'}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRollback(h.snapshot_id, h.operation_type)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-[11px] font-medium rounded border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
                        >
                          Pulihkan Versi Ini
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

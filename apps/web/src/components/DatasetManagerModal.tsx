import { useState, useEffect } from 'react'
import { X, FolderOpen, Trash2, Plus, Sparkles, AlertCircle } from 'lucide-react'
import { DatasetMetadata } from '@/types'
import * as datasetApi from '@/services/datasetApi'

interface DatasetManagerModalProps {
  isOpen: boolean
  activeDatasetId?: string | null
  onClose: () => void
  onSelectDataset: (id: string) => void
  onNewDataset: () => void
  onDemoReset: () => void
}

export function DatasetManagerModal({
  isOpen,
  activeDatasetId,
  onClose,
  onSelectDataset,
  onNewDataset,
  onDemoReset,
}: DatasetManagerModalProps) {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadList = async () => {
    setIsLoading(true)
    setError(null)
    const localList: DatasetMetadata[] = []

    // 1. Baca datasets dari LocalStorage browser
    try {
      const rawIndex = localStorage.getItem('statpro_local_datasets_index')
      const indexList: string[] = rawIndex ? JSON.parse(rawIndex) : []
      for (const id of indexList) {
        const raw = localStorage.getItem(`statpro_dataset_${id}`)
        if (raw) {
          const ds = JSON.parse(raw)
          localList.push({
            id: ds.id,
            name: `${ds.name} (Lokal)`,
            description: ds.description || '',
            row_count: ds.rows?.length || 0,
            variable_count: ds.variables?.length || 0,
            missing_count: 0,
            is_demo: Boolean(ds.is_demo),
            created_at: ds.created_at || new Date().toISOString(),
            updated_at: ds.updated_at || new Date().toISOString(),
          })
        }
      }
    } catch {}

    // 2. Baca dari server backend
    try {
      const serverData = await datasetApi.fetchDatasets()
      setDatasets([...localList, ...serverData])
    } catch (err: any) {
      if (localList.length > 0) {
        setDatasets(localList)
      } else {
        setError('Server backend offline. Belum ada dataset lokal yang tersimpan.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadList()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleDelete = async (id: string, name: string) => {
    const ok = window.confirm(`Apakah Anda yakin ingin menghapus dataset "${name}"?`)
    if (!ok) return

    if (id.startsWith('local_')) {
      localStorage.removeItem(`statpro_dataset_${id}`)
      try {
        const rawIndex = localStorage.getItem('statpro_local_datasets_index')
        const indexList: string[] = rawIndex ? JSON.parse(rawIndex) : []
        const filtered = indexList.filter(item => item !== id)
        localStorage.setItem('statpro_local_datasets_index', JSON.stringify(filtered))
      } catch {}
      await loadList()
      return
    }

    try {
      await datasetApi.deleteDataset(id)
      await loadList()
    } catch (err: any) {
      alert(`Gagal menghapus dataset: ${err.message}`)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderOpen className="text-blue-400" size={22} />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
                Kelola Dataset Tersimpan
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Buka, hapus, atau beralih antar dataset penelitian
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Bar */}
        <div style={{ padding: '12px 20px', background: 'rgba(30, 41, 59, 0.4)', borderBottom: '1px solid #1e293b', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => {
              onNewDataset()
              onClose()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            Dataset Baru
          </button>

          <button
            onClick={async () => {
              await onDemoReset()
              await loadList()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid #f59e0b',
              color: '#fbbf24',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={14} />
            Muat Ulang DEMO DATA
          </button>
        </div>

        {/* Content List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '6px', color: '#fca5a5', fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              Memuat daftar dataset...
            </div>
          ) : datasets.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              Belum ada dataset yang tersimpan di sistem.
            </div>
          ) : (
            datasets.map(ds => {
              const isActive = ds.id === activeDatasetId
              return (
                <div
                  key={ds.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: isActive ? 'rgba(59, 130, 246, 0.15)' : '#1e293b',
                    border: isActive ? '1px solid #3b82f6' : '1px solid #334155',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>{ds.name}</span>
                      {ds.is_demo && (
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#fbbf24', fontSize: '10px', fontWeight: 700 }}>
                          DEMO DATA
                        </span>
                      )}
                      {isActive && (
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', fontSize: '10px', fontWeight: 600 }}>
                          SEDANG DIBUKA
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '14px' }}>
                      <span>N Kasus: <strong style={{ color: '#e2e8f0' }}>{ds.row_count}</strong></span>
                      <span>K Variabel: <strong style={{ color: '#e2e8f0' }}>{ds.variable_count}</strong></span>
                      <span>Missing: <strong style={{ color: '#f87171' }}>{ds.missing_count}</strong></span>
                      <span>Diperbarui: {new Date(ds.updated_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        onSelectDataset(ds.id)
                        onClose()
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Buka
                    </button>
                    <button
                      onClick={() => handleDelete(ds.id, ds.name)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: '1px solid #475569',
                        color: '#ef4444',
                        cursor: 'pointer',
                      }}
                      title="Hapus dataset ini"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', background: '#1e293b' }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: 'transparent',
              color: '#cbd5e1',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

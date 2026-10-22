import { useState, useEffect, useMemo } from 'react'
import {
  FileOutput,
  Table2,
  Trash2,
  Printer,
  RotateCcw,
  AlertTriangle,
  Clock,
  Database,
  Search,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { AnalysisOutput, AnalysisOutputMetadata, VariableDefinition } from '@/types'
import { GenericOutputTable } from './output/GenericOutputTable'
import * as outputApi from '@/services/outputApi'

export interface OutputViewProps {
  activeDatasetId: string | null
  activeDatasetName: string
  activeDatasetUpdatedAt?: string | null
  variables?: VariableDefinition[]
  onBackToEditor: () => void
  onReRunAnalysis: (analysisType: string) => void
  initialOutput?: AnalysisOutput | null
  onNavigateToReports?: () => void
}

export function OutputView({
  activeDatasetId,
  activeDatasetName,
  activeDatasetUpdatedAt,
  onBackToEditor,
  onReRunAnalysis,
  initialOutput,
  onNavigateToReports,
}: OutputViewProps) {
  const [outputsList, setOutputsList] = useState<AnalysisOutputMetadata[]>([])
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(initialOutput?.id || null)
  const [activeOutput, setActiveOutput] = useState<AnalysisOutput | null>(initialOutput || null)
  const [filterCurrentDataset, setFilterCurrentDataset] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [isLoadingDoc, setIsLoadingDoc] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Load outputs list
  const loadList = async () => {
    setIsLoadingList(true)
    try {
      const items = await outputApi.getOutputs(filterCurrentDataset && activeDatasetId ? activeDatasetId : undefined)
      setOutputsList(items)
      if (items.length > 0 && !selectedOutputId) {
        setSelectedOutputId(items[0].id)
      }
    } catch (err: any) {
      console.error('Gagal memuat riwayat output:', err)
    } finally {
      setIsLoadingList(false)
    }
  }

  useEffect(() => {
    loadList()
  }, [filterCurrentDataset, activeDatasetId])

  // When initialOutput changes (e.g. newly created output), update active state
  useEffect(() => {
    if (initialOutput) {
      setSelectedOutputId(initialOutput.id)
      setActiveOutput(initialOutput)
      loadList()
    }
  }, [initialOutput])

  // Load active output document when selectedOutputId changes
  useEffect(() => {
    if (!selectedOutputId) {
      setActiveOutput(null)
      return
    }
    // If initialOutput matches, already loaded
    if (activeOutput && activeOutput.id === selectedOutputId) return

    let cancelled = false
    setIsLoadingDoc(true)
    outputApi.getOutputById(selectedOutputId)
      .then(doc => {
        if (!cancelled) setActiveOutput(doc)
      })
      .catch(err => {
        console.error('Error fetching output doc:', err)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDoc(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedOutputId])

  // Filtered list
  const filteredList = useMemo(() => {
    return outputsList.filter(item => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        item.title.toLowerCase().includes(q) ||
        item.dataset_name.toLowerCase().includes(q) ||
        item.analysis_type.toLowerCase().includes(q) ||
        item.variables.some(v => v.toLowerCase().includes(q))
      )
    })
  }, [outputsList, searchQuery])

  // Handle delete output
  const handleDeleteOutput = async (id: string, title: string) => {
    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus hasil analisis:\n"${title}"?\n\nTindakan ini tidak dapat dibatalkan.`)
    if (!confirmed) return

    try {
      await outputApi.deleteOutput(id)
      setStatusMessage('Hasil analisis berhasil dihapus.')
      setTimeout(() => setStatusMessage(null), 3000)
      
      setOutputsList(prev => prev.filter(item => item.id !== id))
      if (selectedOutputId === id) {
        const remaining = outputsList.filter(item => item.id !== id)
        if (remaining.length > 0) {
          setSelectedOutputId(remaining[0].id)
        } else {
          setSelectedOutputId(null)
          setActiveOutput(null)
        }
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus hasil analisis.')
    }
  }

  // Check if active output is stale
  const isStale = useMemo(() => {
    if (!activeOutput || !activeDatasetUpdatedAt || !activeOutput.dataset_updated_at) return false
    if (activeOutput.dataset_id !== activeDatasetId) return false
    return new Date(activeDatasetUpdatedAt).getTime() > new Date(activeOutput.dataset_updated_at).getTime()
  }, [activeOutput, activeDatasetUpdatedAt, activeDatasetId])

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', backgroundColor: '#0b1120' }}>
      {/* Left Sidebar: Outputs History List */}
      <div
        style={{
          width: '320px',
          backgroundColor: '#0f172a',
          borderRight: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* List Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileOutput size={18} className="text-blue-400" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>Riwayat Output</span>
            <span style={{ fontSize: '11px', background: '#334155', padding: '2px 6px', borderRadius: '10px', color: '#94a3b8' }}>
              {outputsList.length}
            </span>
          </div>
          <button
            onClick={onBackToEditor}
            title="Kembali ke Editor Data"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid #3b82f6',
              color: '#60a5fa',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Table2 size={13} />
            <span>Editor</span>
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Cari analisis atau variabel..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '6px',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#fff',
                fontSize: '12px',
              }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filterCurrentDataset}
              onChange={e => setFilterCurrentDataset(e.target.checked)}
              disabled={!activeDatasetId}
            />
            <span>Filter dataset aktif saja ({activeDatasetName || 'Tidak ada'})</span>
          </label>
        </div>

        {/* Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {isLoadingList ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
              <Loader2 size={18} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              Memuat riwayat...
            </div>
          ) : filteredList.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
              Belum ada riwayat analisis {filterCurrentDataset ? 'untuk dataset ini' : ''}. Jalankan analisis dari Editor Data untuk melihat hasil di sini.
            </div>
          ) : (
            filteredList.map(item => {
              const isSelected = selectedOutputId === item.id
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedOutputId(item.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid #3b82f6' : '1px solid transparent',
                    cursor: 'pointer',
                    marginBottom: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: '#1e293b',
                        color: '#38bdf8',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {item.analysis_type}
                    </span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      {formatTimestamp(item.created_at)}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? '#f8fafc' : '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Database size={11} /> {item.dataset_name}
                    </span>
                    <span>•</span>
                    <span>{item.variables.length} var</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Main Panel: Active Output Document */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {statusMessage && (
          <div style={{ padding: '8px 16px', background: '#065f46', color: '#a7f3d0', fontSize: '12px', textAlign: 'center' }}>
            {statusMessage}
          </div>
        )}

        {isLoadingDoc ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>
            <Loader2 size={24} className="animate-spin" style={{ marginRight: '10px' }} />
            Memuat dokumen hasil analisis...
          </div>
        ) : !activeOutput ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: '16px', padding: '32px' }}>
            <FileOutput size={48} className="text-slate-600" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                Tidak Ada Output yang Dipilih
              </div>
              <div style={{ fontSize: '13px', maxWidth: '400px' }}>
                Pilih hasil analisis dari riwayat di sisi kiri, atau buka Editor Data untuk menjalankan analisis baru.
              </div>
            </div>
            <button
              onClick={onBackToEditor}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                background: '#2563eb',
                border: 'none',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Table2 size={16} />
              <span>Buka Editor Data</span>
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {/* Top Toolbar */}
            <div
              style={{
                padding: '12px 24px',
                background: '#1e293b',
                borderBottom: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={onBackToEditor}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: '#334155',
                    border: '1px solid #475569',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
                  <span>Editor Data</span>
                </button>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                  {activeOutput.title}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  title="Cetak atau Simpan sebagai PDF"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: '#334155',
                    border: '1px solid #475569',
                    color: '#cbd5e1',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <Printer size={14} />
                  <span>Cetak / PDF</span>
                </button>

                {onNavigateToReports && (
                  <button
                    type="button"
                    onClick={onNavigateToReports}
                    title="Buat Laporan Lengkap (PDF, Word, Excel)"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                      border: '1px solid #3b82f6',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span>📑</span>
                    <span>Buat Laporan...</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onReRunAnalysis(activeOutput.analysis_type)}
                  title="Jalankan ulang analisis ini dengan data terbaru"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'rgba(37, 99, 235, 0.2)',
                    border: '1px solid #2563eb',
                    color: '#60a5fa',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Jalankan Ulang</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteOutput(activeOutput.id, activeOutput.title)}
                  title="Hapus riwayat output ini"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    color: '#f87171',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={14} />
                  <span>Hapus</span>
                </button>
              </div>
            </div>

            {/* Stale Warning Banner */}
            {isStale && (
              <div
                style={{
                  padding: '12px 24px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  borderBottom: '1px solid #f59e0b',
                  color: '#fbbf24',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} />
                  <span>
                    <strong>Peringatan Versi Dataset:</strong> Output ini dihasilkan dari versi dataset sebelumnya ({formatTimestamp(activeOutput.dataset_updated_at || activeOutput.created_at)}). Dataset telah diperbarui sejak analisis ini dijalankan.
                  </span>
                </div>
                <button
                  onClick={() => onReRunAnalysis(activeOutput.analysis_type)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: '#f59e0b',
                    border: 'none',
                    color: '#000',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Jalankan Ulang Sekarang
                </button>
              </div>
            )}

            {/* Document Header Metadata */}
            <div
              style={{
                padding: '20px 28px',
                borderBottom: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: '#2563eb',
                    color: '#fff',
                    textTransform: 'uppercase',
                  }}
                >
                  {activeOutput.analysis_type}
                </span>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  {activeOutput.title}
                </h1>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: '#94a3b8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Database size={13} />
                  <span>Dataset: <strong style={{ color: '#cbd5e1' }}>{activeOutput.dataset_name}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} />
                  <span>Waktu: <strong style={{ color: '#cbd5e1' }}>{formatTimestamp(activeOutput.created_at)}</strong></span>
                </div>
                <div>
                  <span>N Kasus: <strong style={{ color: '#38bdf8' }}>{activeOutput.sample_size}</strong></span>
                </div>
                <div>
                  <span>Variabel: <strong style={{ color: '#cbd5e1' }}>{activeOutput.variables.join(', ')}</strong></span>
                </div>
              </div>
            </div>

            {/* Tables & Results Body */}
            <div style={{ padding: '28px', flex: 1 }}>
              <GenericOutputTable output={activeOutput} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

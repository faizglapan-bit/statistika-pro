import { useState, useRef } from 'react'
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Table,
  Loader2,
} from 'lucide-react'
import { ImportPreviewResponse, VariableDefinition, Dataset } from '@/types'
import * as datasetApi from '@/services/datasetApi'

interface ImportModalProps {
  isOpen: boolean
  currentDatasetId?: string | null
  currentDatasetName?: string
  onClose: () => void
  onImportSuccess: (dataset: Dataset) => void
}

export function ImportModal({
  isOpen,
  currentDatasetId,
  currentDatasetName,
  onClose,
  onImportSuccess,
}: ImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null)
  const [sheetName, setSheetName] = useState<string>('')
  const [delimiter, setDelimiter] = useState<string>(',')
  const [hasHeaders, setHasHeaders] = useState<boolean>(true)
  const [importMode, setImportMode] = useState<'new' | 'replace'>('new')
  const [datasetName, setDatasetName] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileChange = async (file: File) => {
    setSelectedFile(file)
    setError(null)
    setPreview(null)
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    setDatasetName(baseName)

    await runPreview(file, { hasHeaders: true })
  }

  const runPreview = async (
    file: File,
    opts: { sheetName?: string; delimiter?: string; hasHeaders?: boolean } = {}
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await datasetApi.previewImport(file, {
        sheetName: opts.sheetName !== undefined ? opts.sheetName : sheetName,
        delimiter: opts.delimiter !== undefined ? opts.delimiter : delimiter,
        hasHeaders: opts.hasHeaders !== undefined ? opts.hasHeaders : hasHeaders,
      })
      setPreview(res)
      if (res.selected_sheet) setSheetName(res.selected_sheet)
      if (res.delimiter) setDelimiter(res.delimiter)
    } catch (err: any) {
      setError(err.message || 'Gagal memproses file untuk pratinjau')
      setPreview(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCommit = async () => {
    if (!preview) return
    setIsLoading(true)
    setError(null)
    try {
      const variables: VariableDefinition[] = preview.columns.map(c => ({
        name: c.name,
        type: c.detected_type,
        width: 8,
        decimals: c.detected_type === 'numeric' ? 2 : 0,
        label: c.original_name !== c.name ? c.original_name : '',
        values: {},
        missing: [],
        measure: c.detected_measure,
      }))

      const targetId = importMode === 'replace' ? (currentDatasetId || undefined) : undefined
      const committed = await datasetApi.commitImport({
        name: datasetName.trim() || 'Dataset Hasil Impor',
        target_dataset_id: targetId,
        variables,
        rows: preview.preview_rows,
      })

      onImportSuccess(committed)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menyelesaikan proses impor')
    } finally {
      setIsLoading(false)
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
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
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
            <FileSpreadsheet className="text-blue-400" size={22} />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
                Impor Data — Excel / CSV
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Pratinjau struktur data, deteksi otomatis tipe variabel, dan impor ke editor
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

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5', fontSize: '13px' }}>
              <AlertTriangle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* File Upload Box */}
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0])
              }}
              style={{
                border: '2px dashed #475569',
                borderRadius: '10px',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(30, 41, 59, 0.4)',
                transition: 'border-color 0.2s',
              }}
            >
              <Upload size={36} className="mx-auto mb-3 text-blue-400" />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                Klik untuk memilih file atau seret file ke sini
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Mendukung file Excel (.xlsx, .xls) dan CSV (.csv) — Maksimum 25 MB
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={e => {
                  if (e.target.files?.[0]) handleFileChange(e.target.files[0])
                }}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} className="text-emerald-400" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{(selectedFile.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null)
                  setPreview(null)
                }}
                style={{ padding: '4px 10px', background: '#334155', border: 'none', borderRadius: '6px', color: '#cbd5e1', fontSize: '12px', cursor: 'pointer' }}
              >
                Ganti File
              </button>
            </div>
          )}

          {/* Configuration Options */}
          {selectedFile && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: '12px', background: '#1e293b', borderRadius: '8px' }}>
              {/* Sheet Selector if Excel */}
              {preview?.file_format === 'xlsx' && (preview?.sheet_names?.length || 0) > 1 && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Pilih Worksheet</label>
                  <select
                    value={sheetName}
                    onChange={e => {
                      setSheetName(e.target.value)
                      if (selectedFile) runPreview(selectedFile, { sheetName: e.target.value })
                    }}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #475569', color: '#fff', fontSize: '12px' }}
                  >
                    {preview.sheet_names.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Delimiter if CSV */}
              {preview?.file_format === 'csv' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Delimiter CSV</label>
                  <select
                    value={delimiter}
                    onChange={e => {
                      setDelimiter(e.target.value)
                      if (selectedFile) runPreview(selectedFile, { delimiter: e.target.value })
                    }}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #475569', color: '#fff', fontSize: '12px' }}
                  >
                    <option value=",">Koma (,)</option>
                    <option value=";">Titik Koma (;)</option>
                    <option value="&#9;">Tab (\t)</option>
                    <option value="|">Pipe (|)</option>
                  </select>
                </div>
              )}

              {/* Headers Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={hasHeaders}
                    onChange={e => {
                      setHasHeaders(e.target.checked)
                      if (selectedFile) runPreview(selectedFile, { hasHeaders: e.target.checked })
                    }}
                  />
                  Baris pertama adalah nama variabel
                </label>
              </div>

              {/* Dataset Name */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Nama Dataset</label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={e => setDatasetName(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #475569', color: '#fff', fontSize: '12px' }}
                />
              </div>
            </div>
          )}

          {/* Warnings */}
          {preview?.warnings && preview.warnings.length > 0 && (
            <div style={{ padding: '10px 14px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', borderRadius: '8px', color: '#fcd34d', fontSize: '12px' }}>
              <strong>Catatan Validasi:</strong>
              <ul style={{ margin: '4px 0 0 16px', listStyleType: 'disc' }}>
                {preview.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary & Table Preview */}
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <Loader2 className="animate-spin mx-auto mb-2" size={28} />
              <div>Memproses dan menganalisis berkas data...</div>
            </div>
          ) : preview ? (
            <div>
              {/* Stats badges */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '12px' }}>
                <div style={{ padding: '6px 12px', background: '#1e293b', borderRadius: '6px', color: '#e2e8f0' }}>
                  Total Baris: <strong style={{ color: '#38bdf8' }}>{preview.total_rows}</strong>
                </div>
                <div style={{ padding: '6px 12px', background: '#1e293b', borderRadius: '6px', color: '#e2e8f0' }}>
                  Total Kolom: <strong style={{ color: '#38bdf8' }}>{preview.total_columns}</strong>
                </div>
              </div>

              {/* Preview Table */}
              <div style={{ border: '1px solid #334155', borderRadius: '8px', overflowX: 'auto', maxHeight: '240px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155', position: 'sticky', top: 0 }}>
                      <th style={{ padding: '8px 10px', width: '40px', color: '#64748b' }}>#</th>
                      {preview.columns.map(c => (
                        <th key={c.name} style={{ padding: '8px 10px', color: '#f8fafc', whiteSpace: 'nowrap' }}>
                          <div>{c.name}</div>
                          <div style={{ fontSize: '10px', color: c.detected_type === 'numeric' ? '#10b981' : '#38bdf8' }}>
                            {c.detected_type} • {c.detected_measure}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview_rows.map((row, rIdx) => (
                      <tr key={rIdx} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '6px 10px', color: '#64748b' }}>{rIdx + 1}</td>
                        {preview.columns.map(c => (
                          <td key={c.name} style={{ padding: '6px 10px', color: row[c.name] === null ? '#64748b' : '#cbd5e1', whiteSpace: 'nowrap' }}>
                            {row[c.name] === null ? '•' : String(row[c.name])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {/* Import Destination Option */}
          {preview && (
            <div style={{ padding: '12px', background: '#1e293b', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>Tujuan Impor:</div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'new'}
                    onChange={() => setImportMode('new')}
                  />
                  Buat sebagai Dataset Baru
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                  />
                  Gantikan Dataset Saat Ini {currentDatasetName ? `(${currentDatasetName})` : ''}
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            background: '#1e293b',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: 'transparent',
              color: '#cbd5e1',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Batal
          </button>
          <button
            onClick={handleCommit}
            disabled={!preview || isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              borderRadius: '6px',
              border: 'none',
              background: (!preview || isLoading) ? '#334155' : '#2563eb',
              color: '#fff',
              fontWeight: 500,
              fontSize: '13px',
              cursor: (!preview || isLoading) ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Table size={16} />}
            Konfirmasi Impor Data
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { X, Plus, Trash2, Check } from 'lucide-react'

interface ValueLabelsModalProps {
  variableName: string
  initialValues: Record<string, string>
  isOpen: boolean
  onClose: () => void
  onSave: (values: Record<string, string>) => void
}

export function ValueLabelsModal({
  variableName,
  initialValues,
  isOpen,
  onClose,
  onSave,
}: ValueLabelsModalProps) {
  const [values, setValues] = useState<Record<string, string>>({ ...initialValues })
  const [valKey, setValKey] = useState('')
  const [valLabel, setValLabel] = useState('')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleAddOrUpdate = () => {
    const k = valKey.trim()
    const l = valLabel.trim()
    if (!k) {
      setError('Nilai (Value) tidak boleh kosong')
      return
    }
    if (!l) {
      setError('Label tidak boleh kosong')
      return
    }
    setValues(prev => ({ ...prev, [k]: l }))
    setValKey('')
    setValLabel('')
    setSelectedKey(null)
    setError(null)
  }

  const handleSelect = (k: string) => {
    setSelectedKey(k)
    setValKey(k)
    setValLabel(values[k] || '')
    setError(null)
  }

  const handleRemove = (k: string) => {
    setValues(prev => {
      const copy = { ...prev }
      delete copy[k]
      return copy
    })
    if (selectedKey === k) {
      setSelectedKey(null)
      setValKey('')
      setValLabel('')
    }
  }

  const handleSave = () => {
    onSave(values)
    onClose()
  }

  const entries = Object.entries(values).sort((a, b) => {
    const na = Number(a[0])
    const nb = Number(b[0])
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return a[0].localeCompare(b[0])
  })

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
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--color-bg-secondary, #1e293b)',
          border: '1px solid var(--color-border-subtle, #334155)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--color-border-subtle, #334155)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
              Value Labels — {variableName}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Definisikan label kategori jawaban kuesioner
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
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '6px', fontSize: '12px', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          {/* Form Input */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                Nilai (Value)
              </label>
              <input
                type="text"
                value={valKey}
                onChange={e => setValKey(e.target.value)}
                placeholder="mis. 1"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: '#0f172a',
                  border: '1px solid #475569',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                Label
              </label>
              <input
                type="text"
                value={valLabel}
                onChange={e => setValLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddOrUpdate()}
                placeholder="mis. Sangat Tidak Setuju"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: '#0f172a',
                  border: '1px solid #475569',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
            </div>
            <button
              onClick={handleAddOrUpdate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                fontWeight: 500,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <Plus size={15} />
              {selectedKey ? 'Ubah' : 'Tambah'}
            </button>
          </div>

          {/* Listbox */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
              Daftar Nilai Kategori ({entries.length})
            </label>
            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {entries.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                  Belum ada label nilai yang ditentukan.
                </div>
              ) : (
                entries.map(([k, lbl]) => (
                  <div
                    key={k}
                    onClick={() => handleSelect(k)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      background: selectedKey === k ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      border: selectedKey === k ? '1px solid #3b82f6' : '1px solid transparent',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ fontWeight: 600, color: '#38bdf8', minWidth: '32px' }}>{k}</span>
                      <span style={{ color: '#94a3b8' }}>=</span>
                      <span style={{ color: '#e2e8f0' }}>{lbl}</span>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleRemove(k)
                      }}
                      style={{
                        padding: '4px',
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--color-border-subtle, #334155)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            background: 'rgba(255,255,255,0.01)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '7px 16px',
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
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 18px',
              borderRadius: '6px',
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 500,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <Check size={16} />
            Simpan Nilai
          </button>
        </div>
      </div>
    </div>
  )
}

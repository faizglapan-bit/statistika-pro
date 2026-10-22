import { useState } from 'react'
import { X, Check } from 'lucide-react'

interface MissingValuesModalProps {
  variableName: string
  initialMissing: string[]
  isOpen: boolean
  onClose: () => void
  onSave: (missing: string[]) => void
}

export function MissingValuesModal({
  variableName,
  initialMissing,
  isOpen,
  onClose,
  onSave,
}: MissingValuesModalProps) {
  const [mode, setMode] = useState<'none' | 'discrete'>((initialMissing && initialMissing.length > 0) ? 'discrete' : 'none')
  const [val1, setVal1] = useState(initialMissing[0] || '')
  const [val2, setVal2] = useState(initialMissing[1] || '')
  const [val3, setVal3] = useState(initialMissing[2] || '')

  if (!isOpen) return null

  const handleSave = () => {
    if (mode === 'none') {
      onSave([])
    } else {
      const list = [val1.trim(), val2.trim(), val3.trim()].filter(v => v !== '')
      onSave(list)
    }
    onClose()
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
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
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
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
              Missing Values — {variableName}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Tentukan nilai khusus yang dianggap missing
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

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#e2e8f0', cursor: 'pointer' }}>
            <input
              type="radio"
              name="missingMode"
              checked={mode === 'none'}
              onChange={() => setMode('none')}
            />
            Tidak ada missing values khusus (hanya sel kosong)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#e2e8f0', cursor: 'pointer' }}>
            <input
              type="radio"
              name="missingMode"
              checked={mode === 'discrete'}
              onChange={() => setMode('discrete')}
            />
            Nilai missing diskrit (hingga 3 kode nilai)
          </label>

          {mode === 'discrete' && (
            <div style={{ paddingLeft: '24px', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="mis. 99"
                value={val1}
                onChange={e => setVal1(e.target.value)}
                style={{
                  width: '80px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: '#0f172a',
                  border: '1px solid #475569',
                  color: '#fff',
                  fontSize: '13px',
                  textAlign: 'center',
                }}
              />
              <input
                type="text"
                placeholder="mis. 999"
                value={val2}
                onChange={e => setVal2(e.target.value)}
                style={{
                  width: '80px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: '#0f172a',
                  border: '1px solid #475569',
                  color: '#fff',
                  fontSize: '13px',
                  textAlign: 'center',
                }}
              />
              <input
                type="text"
                placeholder="mis. -1"
                value={val3}
                onChange={e => setVal3(e.target.value)}
                style={{
                  width: '80px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: '#0f172a',
                  border: '1px solid #475569',
                  color: '#fff',
                  fontSize: '13px',
                  textAlign: 'center',
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #334155',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
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
            Terapkan
          </button>
        </div>
      </div>
    </div>
  )
}

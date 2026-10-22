import { useState } from 'react'
import { VariableDefinition, VariableType, VariableMeasure } from '@/types'
import { ValueLabelsModal } from './ValueLabelsModal'
import { MissingValuesModal } from './MissingValuesModal'
import { Plus, Trash2, MoreHorizontal, HelpCircle } from 'lucide-react'

interface VariableViewProps {
  variables: VariableDefinition[]
  onUpdateVariable: (index: number, newDef: VariableDefinition) => boolean
  onAddVariable: () => void
  onDeleteVariable: (varName: string) => void
}

export function VariableView({
  variables,
  onUpdateVariable,
  onAddVariable,
  onDeleteVariable,
}: VariableViewProps) {
  const [activeModalVarIdx, setActiveModalVarIdx] = useState<number | null>(null)
  const [modalType, setModalType] = useState<'values' | 'missing' | null>(null)

  const handleOpenValues = (idx: number) => {
    setActiveModalVarIdx(idx)
    setModalType('values')
  }

  const handleOpenMissing = (idx: number) => {
    setActiveModalVarIdx(idx)
    setModalType('missing')
  }

  const handleCloseModal = () => {
    setActiveModalVarIdx(null)
    setModalType(null)
  }

  const formatValuesPreview = (values: Record<string, string>): string => {
    const keys = Object.keys(values || {})
    if (keys.length === 0) return 'None'
    const first = keys[0]
    const label = values[first]
    if (keys.length === 1) return `{${first}, ${label}}`
    return `{${first}, ${label}...}`
  }

  const formatMissingPreview = (missing: string[]): string => {
    if (!missing || missing.length === 0) return 'None'
    return missing.join(', ')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#0b1120' }}>
      {/* Table Container */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#1e293b', borderBottom: '2px solid #334155', position: 'sticky', top: 0, zIndex: 10 }}>
              <th style={{ padding: '10px 12px', width: '50px', color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>#</th>
              <th style={{ padding: '10px 12px', width: '160px', color: '#f8fafc', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '10px 12px', width: '130px', color: '#f8fafc', fontWeight: 600 }}>Type</th>
              <th style={{ padding: '10px 12px', width: '90px', color: '#f8fafc', fontWeight: 600 }}>Width</th>
              <th style={{ padding: '10px 12px', width: '100px', color: '#f8fafc', fontWeight: 600 }}>Decimals</th>
              <th style={{ padding: '10px 12px', minWidth: '220px', color: '#f8fafc', fontWeight: 600 }}>Label</th>
              <th style={{ padding: '10px 12px', width: '160px', color: '#f8fafc', fontWeight: 600 }}>Values</th>
              <th style={{ padding: '10px 12px', width: '120px', color: '#f8fafc', fontWeight: 600 }}>Missing</th>
              <th style={{ padding: '10px 12px', width: '130px', color: '#f8fafc', fontWeight: 600 }}>Measure</th>
              <th style={{ padding: '10px 12px', width: '60px', textAlign: 'center', color: '#94a3b8' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {variables.map((v, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid #1e293b',
                  background: idx % 2 === 0 ? 'rgba(15, 23, 42, 0.6)' : 'rgba(30, 41, 59, 0.3)',
                  transition: 'background 0.15s ease',
                }}
              >
                {/* Row Index */}
                <td style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>
                  {idx + 1}
                </td>

                {/* Name */}
                <td style={{ padding: '6px 10px' }}>
                  <input
                    type="text"
                    value={v.name}
                    onChange={e => onUpdateVariable(idx, { ...v, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#38bdf8',
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  />
                </td>

                {/* Type */}
                <td style={{ padding: '6px 10px' }}>
                  <select
                    value={v.type}
                    onChange={e => {
                      const newType = e.target.value as VariableType
                      onUpdateVariable(idx, {
                        ...v,
                        type: newType,
                        decimals: newType === 'string' ? 0 : v.decimals,
                        measure: newType === 'string' ? 'nominal' : v.measure,
                      })
                    }}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#e2e8f0',
                      fontSize: '13px',
                    }}
                  >
                    <option value="numeric">Numeric</option>
                    <option value="string">String</option>
                    <option value="boolean">Boolean</option>
                  </select>
                </td>

                {/* Width */}
                <td style={{ padding: '6px 10px' }}>
                  <input
                    type="number"
                    min={1}
                    max={255}
                    value={v.width}
                    onChange={e => onUpdateVariable(idx, { ...v, width: Math.max(1, parseInt(e.target.value) || 8) })}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#e2e8f0',
                      fontSize: '13px',
                      textAlign: 'center',
                    }}
                  />
                </td>

                {/* Decimals */}
                <td style={{ padding: '6px 10px' }}>
                  <input
                    type="number"
                    min={0}
                    max={16}
                    disabled={v.type === 'string'}
                    value={v.decimals}
                    onChange={e => onUpdateVariable(idx, { ...v, decimals: Math.max(0, parseInt(e.target.value) || 0) })}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      background: v.type === 'string' ? '#1e293b' : '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: v.type === 'string' ? '#64748b' : '#e2e8f0',
                      fontSize: '13px',
                      textAlign: 'center',
                      cursor: v.type === 'string' ? 'not-allowed' : 'text',
                    }}
                  />
                </td>

                {/* Label */}
                <td style={{ padding: '6px 10px' }}>
                  <input
                    type="text"
                    value={v.label}
                    placeholder="Deskripsi variabel kuesioner..."
                    onChange={e => onUpdateVariable(idx, { ...v, label: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#e2e8f0',
                      fontSize: '13px',
                    }}
                  />
                </td>

                {/* Values (Button modal) */}
                <td style={{ padding: '6px 10px' }}>
                  <button
                    onClick={() => handleOpenValues(idx)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: Object.keys(v.values || {}).length > 0 ? '#38bdf8' : '#94a3b8',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>
                      {formatValuesPreview(v.values)}
                    </span>
                    <MoreHorizontal size={14} />
                  </button>
                </td>

                {/* Missing (Button modal) */}
                <td style={{ padding: '6px 10px' }}>
                  <button
                    onClick={() => handleOpenMissing(idx)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: (v.missing && v.missing.length > 0) ? '#f59e0b' : '#94a3b8',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>
                      {formatMissingPreview(v.missing)}
                    </span>
                    <MoreHorizontal size={14} />
                  </button>
                </td>

                {/* Measure */}
                <td style={{ padding: '6px 10px' }}>
                  <select
                    value={v.measure}
                    onChange={e => onUpdateVariable(idx, { ...v, measure: e.target.value as VariableMeasure })}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#e2e8f0',
                      fontSize: '13px',
                    }}
                  >
                    <option value="scale">Scale</option>
                    <option value="ordinal">Ordinal</option>
                    <option value="nominal">Nominal</option>
                  </select>
                </td>

                {/* Actions */}
                <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                  <button
                    onClick={() => onDeleteVariable(v.name)}
                    disabled={variables.length <= 1}
                    title={variables.length <= 1 ? 'Minimal satu variabel diperlukan' : `Hapus variabel ${v.name}`}
                    style={{
                      padding: '5px',
                      background: 'transparent',
                      border: 'none',
                      color: variables.length <= 1 ? '#475569' : '#ef4444',
                      cursor: variables.length <= 1 ? 'not-allowed' : 'pointer',
                      borderRadius: '4px',
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Add Variable */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid #334155',
          background: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={onAddVariable}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid #3b82f6',
            color: '#60a5fa',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Plus size={15} />
          Tambah Variabel Baru
        </button>
        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <HelpCircle size={14} />
          Setiap perubahan variabel otomatis disinkronkan ke Data View
        </div>
      </div>

      {/* Modals */}
      {modalType === 'values' && activeModalVarIdx !== null && (
        <ValueLabelsModal
          variableName={variables[activeModalVarIdx].name}
          initialValues={variables[activeModalVarIdx].values || {}}
          isOpen={true}
          onClose={handleCloseModal}
          onSave={newVals => {
            onUpdateVariable(activeModalVarIdx, {
              ...variables[activeModalVarIdx],
              values: newVals,
            })
          }}
        />
      )}

      {modalType === 'missing' && activeModalVarIdx !== null && (
        <MissingValuesModal
          variableName={variables[activeModalVarIdx].name}
          initialMissing={variables[activeModalVarIdx].missing || []}
          isOpen={true}
          onClose={handleCloseModal}
          onSave={newMissing => {
            onUpdateVariable(activeModalVarIdx, {
              ...variables[activeModalVarIdx],
              missing: newMissing,
            })
          }}
        />
      )}
    </div>
  )
}

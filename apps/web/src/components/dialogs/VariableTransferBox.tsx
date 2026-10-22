import { useState } from 'react'
import { ChevronRight, ChevronLeft, Hash, Type, BarChart2 } from 'lucide-react'
import { VariableDefinition } from '@/types'

export interface VariableTransferBoxProps {
  allVariables: VariableDefinition[]
  selectedVarNames: string[]
  onChangeSelected: (newSelected: string[]) => void
  targetTitle?: string
  onlyNumeric?: boolean
}

export function VariableTransferBox({
  allVariables,
  selectedVarNames,
  onChangeSelected,
  targetTitle = 'Variabel Terpilih',
  onlyNumeric = true,
}: VariableTransferBoxProps) {
  const [highlightedAvailable, setHighlightedAvailable] = useState<string | null>(null)
  const [highlightedTarget, setHighlightedTarget] = useState<string | null>(null)

  // Filter available variables (not yet in target, optionally numeric only)
  const availableVars = allVariables.filter(v => {
    if (selectedVarNames.includes(v.name)) return false
    if (onlyNumeric && v.type !== 'numeric') return false
    return true
  })

  // Selected variable objects
  const targetVars = selectedVarNames
    .map(name => allVariables.find(v => v.name === name))
    .filter((v): v is VariableDefinition => Boolean(v))

  const handleMoveToTarget = () => {
    if (!highlightedAvailable) return
    onChangeSelected([...selectedVarNames, highlightedAvailable])
    setHighlightedAvailable(null)
  }

  const handleMoveToAvailable = () => {
    if (!highlightedTarget) return
    onChangeSelected(selectedVarNames.filter(n => n !== highlightedTarget))
    setHighlightedTarget(null)
  }

  const handleDoubleClickAvailable = (varName: string) => {
    if (!selectedVarNames.includes(varName)) {
      onChangeSelected([...selectedVarNames, varName])
    }
  }

  const handleDoubleClickTarget = (varName: string) => {
    onChangeSelected(selectedVarNames.filter(n => n !== varName))
  }

  const renderIcon = (v: VariableDefinition) => {
    if (v.type === 'string') return <Type size={13} className="text-emerald-400 flex-shrink-0" />
    if (v.measure === 'scale') return <Hash size={13} className="text-blue-400 flex-shrink-0" />
    return <BarChart2 size={13} className="text-amber-400 flex-shrink-0" />
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 1fr', gap: '12px', alignItems: 'center' }}>
      {/* Left List: Available Variables */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '260px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
          Variabel Dataset ({availableVars.length})
        </div>
        <div
          style={{
            flex: 1,
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '6px',
            overflowY: 'auto',
            padding: '4px',
          }}
        >
          {availableVars.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
              Tidak ada variabel tersisa.
            </div>
          ) : (
            availableVars.map(v => {
              const isSelected = highlightedAvailable === v.name
              return (
                <div
                  key={v.name}
                  onClick={() => setHighlightedAvailable(v.name)}
                  onDoubleClick={() => handleDoubleClickAvailable(v.name)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                    border: isSelected ? '1px solid #3b82f6' : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                    userSelect: 'none',
                  }}
                >
                  {renderIcon(v)}
                  <span style={{ fontWeight: 600 }}>{v.name}</span>
                  {v.label && (
                    <span style={{ color: '#94a3b8', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      [{v.label}]
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Center Controls: Transfer Arrows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={handleMoveToTarget}
          disabled={!highlightedAvailable}
          title="Pindahkan ke daftar target"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            background: highlightedAvailable ? '#2563eb' : '#1e293b',
            border: '1px solid #475569',
            color: highlightedAvailable ? '#fff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: highlightedAvailable ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
          }}
        >
          <ChevronRight size={18} />
        </button>

        <button
          type="button"
          onClick={handleMoveToAvailable}
          disabled={!highlightedTarget}
          title="Keluarkan dari daftar target"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            background: highlightedTarget ? '#ef4444' : '#1e293b',
            border: '1px solid #475569',
            color: highlightedTarget ? '#fff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: highlightedTarget ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
          }}
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Right List: Target Variables */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '260px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '6px' }}>
          {targetTitle} ({targetVars.length})
        </div>
        <div
          style={{
            flex: 1,
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '6px',
            overflowY: 'auto',
            padding: '4px',
          }}
        >
          {targetVars.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
              Pilih variabel di kiri lalu klik &gt; atau double-click.
            </div>
          ) : (
            targetVars.map(v => {
              const isSelected = highlightedTarget === v.name
              return (
                <div
                  key={v.name}
                  onClick={() => setHighlightedTarget(v.name)}
                  onDoubleClick={() => handleDoubleClickTarget(v.name)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                    userSelect: 'none',
                  }}
                >
                  {renderIcon(v)}
                  <span style={{ fontWeight: 600 }}>{v.name}</span>
                  {v.label && (
                    <span style={{ color: '#94a3b8', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      [{v.label}]
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

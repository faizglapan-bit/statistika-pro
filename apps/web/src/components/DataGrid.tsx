import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { DataRow, VariableDefinition } from '@/types'
import { Ruler, BarChart2, PieChart, Plus, Trash2 } from 'lucide-react'

interface DataGridProps {
  variables: VariableDefinition[]
  rows: DataRow[]
  selectedCell: { rowId: number; colKey: string } | null
  onCellSelect: (cell: { rowId: number; colKey: string } | null) => void
  onCellChange: (rowId: number, colKey: string, value: string) => void
  onAddRow: () => void
  onDeleteRow: (rowId: number) => void
  onAddColumn: () => void
  onPasteFromClipboard: (startRowIdx: number, startColKey: string, text: string) => void
  matchedRowIds?: (number | string)[] | null
  filterConditionText?: string | null
  onClearFilter?: () => void
}

const ROW_HEIGHT = 32
const OVERSCAN = 15

export function DataGrid({
  variables,
  rows,
  selectedCell,
  onCellSelect,
  onCellChange,
  onAddRow,
  onDeleteRow,
  onAddColumn,
  onPasteFromClipboard,
  matchedRowIds,
  filterConditionText,
  onClearFilter,
}: DataGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(600)
  const [editingCell, setEditingCell] = useState<{ rowId: number; colKey: string } | null>(null)
  const [editValue, setEditValue] = useState('')

  // Monitor container resize
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const updateSize = () => setContainerHeight(el.clientHeight || 600)
    updateSize()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(updateSize)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  const [hideFilteredRows, setHideFilteredRows] = useState(false)

  const activeDisplayRows = useMemo(() => {
    if (!matchedRowIds || !hideFilteredRows) return rows
    return rows.filter((r) => matchedRowIds.includes(r.id))
  }, [rows, matchedRowIds, hideFilteredRows])

  // Virtual windowing calculations
  const totalRows = activeDisplayRows.length
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const endIndex = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN)
  const visibleRows = useMemo(() => {
    return activeDisplayRows.slice(startIndex, endIndex).map((row, idx) => ({
      row,
      actualIndex: startIndex + idx,
      isExcluded: matchedRowIds ? !matchedRowIds.includes(row.id) : false,
    }))
  }, [activeDisplayRows, startIndex, endIndex, matchedRowIds])

  const topPadding = startIndex * ROW_HEIGHT
  const bottomPadding = Math.max(0, (totalRows - endIndex) * ROW_HEIGHT)

  // Start editing cell
  const startEditing = useCallback((rowId: number, colKey: string, initialVal?: string) => {
    const row = rows.find(r => r.id === rowId)
    const val = initialVal !== undefined ? initialVal : (row ? String(row[colKey] ?? '') : '')
    setEditingCell({ rowId, colKey })
    setEditValue(val)
  }, [rows])

  // Commit edit
  const commitEdit = useCallback(() => {
    if (editingCell) {
      onCellChange(editingCell.rowId, editingCell.colKey, editValue)
      setEditingCell(null)
    }
  }, [editingCell, editValue, onCellChange])

  // Cancel edit
  const cancelEdit = useCallback(() => {
    setEditingCell(null)
  }, [])

  // Auto-focus input when editing
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault()
        commitEdit()
        // Pindah ke baris berikutnya
        const currentIdx = rows.findIndex(r => r.id === editingCell.rowId)
        if (currentIdx + 1 < rows.length) {
          onCellSelect({ rowId: rows[currentIdx + 1].id, colKey: editingCell.colKey })
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancelEdit()
      } else if (e.key === 'Tab') {
        e.preventDefault()
        commitEdit()
        const colIdx = variables.findIndex(v => v.name === editingCell.colKey)
        const nextColIdx = e.shiftKey ? colIdx - 1 : colIdx + 1
        if (nextColIdx >= 0 && nextColIdx < variables.length) {
          onCellSelect({ rowId: editingCell.rowId, colKey: variables[nextColIdx].name })
        }
      }
      return
    }

    if (!selectedCell) return

    const currentRowIdx = rows.findIndex(r => r.id === selectedCell.rowId)
    const currentColIdx = variables.findIndex(v => v.name === selectedCell.colKey)
    if (currentRowIdx === -1 || currentColIdx === -1) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (currentRowIdx + 1 < rows.length) {
        onCellSelect({ rowId: rows[currentRowIdx + 1].id, colKey: selectedCell.colKey })
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (currentRowIdx - 1 >= 0) {
        onCellSelect({ rowId: rows[currentRowIdx - 1].id, colKey: selectedCell.colKey })
      }
    } else if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault()
      if (currentColIdx + 1 < variables.length) {
        onCellSelect({ rowId: selectedCell.rowId, colKey: variables[currentColIdx + 1].name })
      } else if (e.key === 'Tab' && currentRowIdx + 1 < rows.length) {
        onCellSelect({ rowId: rows[currentRowIdx + 1].id, colKey: variables[0].name })
      }
    } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault()
      if (currentColIdx - 1 >= 0) {
        onCellSelect({ rowId: selectedCell.rowId, colKey: variables[currentColIdx - 1].name })
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      startEditing(selectedCell.rowId, selectedCell.colKey)
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      onCellChange(selectedCell.rowId, selectedCell.colKey, '')
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Mulai mengetik langsung mengganti nilai sel
      startEditing(selectedCell.rowId, selectedCell.colKey, e.key)
    }
  }, [editingCell, commitEdit, cancelEdit, rows, variables, selectedCell, onCellSelect, startEditing, onCellChange])

  // Paste handler
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain')
    if (!text || !selectedCell) return
    const rowIdx = rows.findIndex(r => r.id === selectedCell.rowId)
    if (rowIdx === -1) return

    // Jika paste mengandung tab atau newline, lakukan spreadsheet paste
    if (text.includes('\t') || text.includes('\n')) {
      e.preventDefault()
      onPasteFromClipboard(rowIdx, selectedCell.colKey, text)
    }
  }, [selectedCell, rows, onPasteFromClipboard])

  const renderMeasureIcon = (measure: string) => {
    if (measure === 'nominal') return <span title="Nominal" style={{ display: 'flex' }}><PieChart size={13} color="#38bdf8" /></span>
    if (measure === 'ordinal') return <span title="Ordinal" style={{ display: 'flex' }}><BarChart2 size={13} color="#f59e0b" /></span>
    return <span title="Scale" style={{ display: 'flex' }}><Ruler size={13} color="#10b981" /></span>
  }

  const formatCellValue = (val: any, decimals: number, type: string) => {
    if (val === null || val === undefined || val === '') return ''
    if (type === 'numeric' && typeof val === 'number') {
      return val.toFixed(decimals)
    }
    return String(val)
  }

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        outline: 'none',
        background: '#0b1120',
      }}
    >
      {/* Banner Filter Aktif (Jika Ada) */}
      {matchedRowIds && (
        <div
          style={{
            padding: '6px 16px',
            background: 'rgba(6, 182, 212, 0.15)',
            borderBottom: '1px solid #06b6d4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#67e8f9',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔍 <b>Filter Sementara Aktif:</b> <code>{filterConditionText || 'Kondisi Aktif'}</code></span>
            <span>({matchedRowIds.length} dari {rows.length} baris terpilih)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setHideFilteredRows((prev) => !prev)}
              style={{
                padding: '3px 10px',
                borderRadius: '4px',
                background: '#0891b2',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {hideFilteredRows ? 'Tampilkan Baris Tersaring (Redup)' : 'Sembunyikan Baris Tersaring'}
            </button>
            {onClearFilter && (
              <button
                onClick={onClearFilter}
                style={{
                  padding: '3px 10px',
                  borderRadius: '4px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                Hapus Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Spreadsheet Virtualized Scroll Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <div style={{ minWidth: 'max-content' }}>
          {/* Table Header */}
          <div
            style={{
              display: 'flex',
              position: 'sticky',
              top: 0,
              zIndex: 30,
              background: '#1e293b',
              borderBottom: '2px solid #334155',
            }}
          >
            {/* Corner header for row numbers */}
            <div
              style={{
                width: '60px',
                minWidth: '60px',
                padding: '8px 4px',
                textAlign: 'center',
                color: '#64748b',
                fontWeight: 600,
                fontSize: '12px',
                borderRight: '1px solid #334155',
                position: 'sticky',
                left: 0,
                zIndex: 35,
                background: '#1e293b',
              }}
            >
              #
            </div>

            {/* Variable Headers */}
            {variables.map(v => (
              <div
                key={v.name}
                style={{
                  width: `${Math.max(v.width * 14, 110)}px`,
                  minWidth: `${Math.max(v.width * 14, 110)}px`,
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRight: '1px solid #334155',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: 600,
                  userSelect: 'none',
                }}
                title={v.label ? `${v.name} — ${v.label}` : v.name}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  {renderMeasureIcon(v.measure)}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.name}
                  </span>
                </div>
                {v.label && (
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.label}
                  </span>
                )}
              </div>
            ))}

            {/* Add Column Button */}
            <div
              onClick={onAddColumn}
              style={{
                width: '40px',
                minWidth: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.05)',
                borderRight: '1px solid #334155',
              }}
              title="Tambah Variabel Baru"
            >
              <Plus size={15} />
            </div>
          </div>

          {/* Virtual Padding Top */}
          <div style={{ height: `${topPadding}px` }} />

          {/* Render Visible Rows */}
          {visibleRows.map(({ row, actualIndex, isExcluded }) => {
            return (
              <div
                key={row.id}
                style={{
                  display: 'flex',
                  height: `${ROW_HEIGHT}px`,
                  borderBottom: '1px solid #1e293b',
                  background: actualIndex % 2 === 0 ? '#0b1120' : 'rgba(15, 23, 42, 0.7)',
                  opacity: isExcluded ? 0.35 : 1,
                  textDecoration: isExcluded ? 'line-through' : 'none',
                }}
              >
                {/* Row Number Sticky Column */}
                <div
                  style={{
                    width: '60px',
                    minWidth: '60px',
                    height: `${ROW_HEIGHT}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 6px',
                    color: '#64748b',
                    fontSize: '11px',
                    fontWeight: 500,
                    borderRight: '1px solid #334155',
                    position: 'sticky',
                    left: 0,
                    zIndex: 20,
                    background: actualIndex % 2 === 0 ? '#0b1120' : '#0f172a',
                    userSelect: 'none',
                  }}
                >
                  <span>{actualIndex + 1}</span>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      onDeleteRow(row.id)
                    }}
                    style={{
                      padding: '2px',
                      background: 'transparent',
                      border: 'none',
                      color: '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                    title="Hapus baris ini"
                  >
                    <Trash2 size={12} className="hover:text-red-400" />
                  </button>
                </div>

                {/* Cells */}
                {variables.map(v => {
                  const isSelected = selectedCell?.rowId === row.id && selectedCell?.colKey === v.name
                  const isEditing = editingCell?.rowId === row.id && editingCell?.colKey === v.name
                  const cellVal = row[v.name]
                  const formatted = formatCellValue(cellVal, v.decimals, v.type)
                  const isMissing = cellVal === null || cellVal === undefined || cellVal === '' || v.missing?.includes(String(cellVal))

                  return (
                    <div
                      key={v.name}
                      onClick={() => onCellSelect({ rowId: row.id, colKey: v.name })}
                      onDoubleClick={() => startEditing(row.id, v.name)}
                      style={{
                        width: `${Math.max(v.width * 14, 110)}px`,
                        minWidth: `${Math.max(v.width * 14, 110)}px`,
                        height: `${ROW_HEIGHT}px`,
                        padding: '0 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: v.type === 'numeric' ? 'flex-end' : 'flex-start',
                        borderRight: '1px solid #1e293b',
                        background: isSelected ? 'rgba(59, 130, 246, 0.2)' : isMissing ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                        outline: isSelected ? '2px solid #3b82f6' : 'none',
                        outlineOffset: '-2px',
                        fontSize: '13px',
                        color: isMissing ? '#64748b' : '#f1f5f9',
                        fontStyle: isMissing ? 'italic' : 'normal',
                        cursor: 'cell',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          style={{
                            width: '100%',
                            height: '24px',
                            padding: '2px 4px',
                            background: '#020617',
                            border: '1px solid #60a5fa',
                            borderRadius: '2px',
                            color: '#fff',
                            fontSize: '13px',
                            textAlign: v.type === 'numeric' ? 'right' : 'left',
                            outline: 'none',
                          }}
                        />
                      ) : (
                        <span>{isMissing ? '•' : formatted}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* Virtual Padding Bottom */}
          <div style={{ height: `${bottomPadding}px` }} />
        </div>
      </div>

      {/* Quick Add Row Button */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #334155',
          background: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={onAddRow}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid #3b82f6',
            color: '#60a5fa',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          Tambah Kasus / Baris
        </button>
        <div style={{ fontSize: '11px', color: '#64748b' }}>
          💡 Klik sel & tekan Enter untuk mengedit • Paste data Excel dengan Ctrl+V
        </div>
      </div>
    </div>
  )
}

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  DataRow,
  DataColumn,
  VariableDefinition,
  ProjectState,
  Dataset,
} from '@/types'
import * as datasetApi from '@/services/datasetApi'

const DEFAULT_VARIABLES: VariableDefinition[] = [
  { name: 'VAR00001', type: 'numeric', width: 8, decimals: 2, label: '', values: {}, missing: [], measure: 'scale' },
  { name: 'VAR00002', type: 'numeric', width: 8, decimals: 2, label: '', values: {}, missing: [], measure: 'scale' },
  { name: 'VAR00003', type: 'numeric', width: 8, decimals: 2, label: '', values: {}, missing: [], measure: 'scale' },
]

export function useDataEditor() {
  const [datasetId, setDatasetId] = useState<string | null>(null)
  const [datasetName, setDatasetName] = useState<string>('Dataset Baru')
  const [variables, setVariables] = useState<VariableDefinition[]>(DEFAULT_VARIABLES)
  const [rows, setRows] = useState<DataRow[]>([])
  const [isDemo, setIsDemo] = useState(false)
  const [isSaved, setIsSaved] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ rowId: number; colKey: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'data-view' | 'variable-view'>('data-view')
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  // Clear status message after 5 seconds
  useEffect(() => {
    if (!statusMessage) return
    const timer = setTimeout(() => setStatusMessage(null), 5000)
    return () => clearTimeout(timer)
  }, [statusMessage])

  // Hitung missing values
  const missingCount = useMemo(() => {
    const missingLookup: Record<string, Set<string>> = {}
    variables.forEach(v => {
      missingLookup[v.name] = new Set(v.missing || [])
    })

    let count = 0
    rows.forEach(row => {
      variables.forEach(v => {
        const val = row[v.name]
        if (val === null || val === undefined || val === '' || String(val).trim() === '') {
          count++
        } else if (missingLookup[v.name]?.has(String(val))) {
          count++
        }
      })
    })
    return count
  }, [variables, rows])

  // Kolom yang kompatibel untuk Data View
  const columns: DataColumn[] = useMemo(() => {
    return variables.map(v => ({
      key: v.name,
      label: v.label ? `${v.name} [${v.label}]` : v.name,
      type: v.type,
      width: Math.max(v.width * 14, 110),
      measure: v.measure,
      decimals: v.decimals,
    }))
  }, [variables])

  // Inisialisasi awal: Muat dataset dari server jika ada
  const initFromDataset = useCallback((ds: Dataset) => {
    setDatasetId(ds.id)
    setDatasetName(ds.name)
    setVariables(ds.variables && ds.variables.length > 0 ? ds.variables : DEFAULT_VARIABLES)
    setRows(ds.rows || [])
    setIsDemo(ds.is_demo || false)
    setIsSaved(true)
    setLastSaved(new Date())
    setSelectedCell(null)
  }, [])

  // Muat dataset awal saat start jika belum ada
  useEffect(() => {
    let isMounted = true
    async function loadInitial() {
      try {
        const list = await datasetApi.fetchDatasets()
        if (!isMounted) return
        if (list && list.length > 0) {
          const ds = await datasetApi.fetchDataset(list[0].id)
          if (isMounted) initFromDataset(ds)
        }
      } catch (err) {
        // Mode offline: gunakan default lokal
        console.warn('Backend belum siap atau offline, menggunakan dataset lokal.', err)
      }
    }
    loadInitial()
    return () => { isMounted = false }
  }, [initFromDataset])

  const addRow = useCallback(() => {
    setRows(prev => {
      const newId = prev.length > 0 ? Math.max(...prev.map(r => r.id)) + 1 : 1
      const newRow: DataRow = { id: newId }
      variables.forEach(v => { newRow[v.name] = null })
      return [...prev, newRow]
    })
    setIsSaved(false)
  }, [variables])

  const deleteRow = useCallback((rowId: number) => {
    setRows(prev => prev.filter(r => r.id !== rowId))
    setIsSaved(false)
  }, [])

  const addColumn = useCallback(() => {
    setVariables(prev => {
      const nextNum = prev.length + 1
      const padded = String(nextNum).padStart(5, '0')
      const newVar: VariableDefinition = {
        name: `VAR${padded}`,
        type: 'numeric',
        width: 8,
        decimals: 2,
        label: '',
        values: {},
        missing: [],
        measure: 'scale',
      }
      return [...prev, newVar]
    })
    setRows(prev => {
      const nextNum = variables.length + 1
      const varName = `VAR${String(nextNum).padStart(5, '0')}`
      return prev.map(row => ({ ...row, [varName]: null }))
    })
    setIsSaved(false)
  }, [variables.length])

  const deleteColumn = useCallback((varName: string) => {
    if (variables.length <= 1) {
      setStatusMessage({ type: 'error', text: 'Dataset harus memiliki setidaknya satu variabel.' })
      return
    }
    setVariables(prev => prev.filter(v => v.name.toLowerCase() !== varName.toLowerCase()))
    setRows(prev => prev.map(r => {
      const copy = { ...r }
      delete copy[varName]
      return copy
    }))
    setIsSaved(false)
  }, [variables.length])

  const updateCell = useCallback((rowId: number, colKey: string, value: string) => {
    const targetVar = variables.find(v => v.name === colKey)
    let parsedValue: string | number | null = null

    if (value === '' || value === null || value === undefined) {
      parsedValue = null
    } else if (targetVar?.type === 'numeric') {
      const num = Number(value)
      parsedValue = isNaN(num) ? value : num
    } else {
      parsedValue = value
    }

    setRows(prev =>
      prev.map(row =>
        row.id === rowId ? { ...row, [colKey]: parsedValue } : row
      )
    )
    setIsSaved(false)
  }, [variables])

  // Menempel data tabel dari clipboard Excel
  const pasteFromClipboard = useCallback((startRowIdx: number, startColKey: string, text: string) => {
    if (!text) return
    const lines = text.split(/\r?\n/).filter(line => line.length > 0)
    if (lines.length === 0) return

    const startColIdx = variables.findIndex(v => v.name === startColKey)
    if (startColIdx === -1) return

    setRows(prev => {
      const newRows = [...prev]
      // Tambahkan baris baru jika paste melebihi jumlah baris saat ini
      const requiredRows = startRowIdx + lines.length
      while (newRows.length < requiredRows) {
        const nextId = newRows.length > 0 ? Math.max(...newRows.map(r => r.id)) + 1 : 1
        const emptyRow: DataRow = { id: nextId }
        variables.forEach(v => { emptyRow[v.name] = null })
        newRows.push(emptyRow)
      }

      lines.forEach((line, rOffset) => {
        const targetRow = newRows[startRowIdx + rOffset]
        const cells = line.split('\t')
        cells.forEach((val, cOffset) => {
          const varIdx = startColIdx + cOffset
          if (varIdx < variables.length) {
            const vDef = variables[varIdx]
            const cleanVal = val.trim()
            if (cleanVal === '') {
              targetRow[vDef.name] = null
            } else if (vDef.type === 'numeric' && !isNaN(Number(cleanVal))) {
              targetRow[vDef.name] = Number(cleanVal)
            } else {
              targetRow[vDef.name] = cleanVal
            }
          }
        })
      })

      return newRows
    })
    setIsSaved(false)
    setStatusMessage({ type: 'success', text: `Berhasil menempel ${lines.length} baris data dari Excel.` })
  }, [variables])

  const updateVariable = useCallback((index: number, newDef: VariableDefinition) => {
    // Validasi nama variabel
    const cleanName = newDef.name.trim()
    if (!cleanName) {
      setStatusMessage({ type: 'error', text: 'Nama variabel tidak boleh kosong.' })
      return false
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(cleanName)) {
      setStatusMessage({ type: 'error', text: 'Nama variabel harus diawali huruf/underscore dan hanya alfanumerik.' })
      return false
    }
    const duplicate = variables.some((v, i) => i !== index && v.name.toLowerCase() === cleanName.toLowerCase())
    if (duplicate) {
      setStatusMessage({ type: 'error', text: `Nama variabel '${cleanName}' sudah digunakan.` })
      return false
    }

    const oldName = variables[index].name
    setVariables(prev => {
      const next = [...prev]
      next[index] = { ...newDef, name: cleanName }
      return next
    })

    // Jika nama variabel berubah, perbarui key di seluruh baris
    if (oldName !== cleanName) {
      setRows(prev => prev.map(r => {
        const copy = { ...r }
        copy[cleanName] = copy[oldName]
        delete copy[oldName]
        return copy
      }))
    }

    setIsSaved(false)
    return true
  }, [variables])

  const saveDataset = useCallback(async () => {
    setIsLoading(true)
    try {
      if (datasetId) {
        const updated = await datasetApi.updateDataset(datasetId, {
          name: datasetName,
          variables,
          rows,
        })
        initFromDataset(updated)
        setStatusMessage({ type: 'success', text: `Dataset '${datasetName}' berhasil disimpan.` })
      } else {
        const created = await datasetApi.createDataset({
          name: datasetName,
          variables,
          rows,
        })
        initFromDataset(created)
        setStatusMessage({ type: 'success', text: `Dataset baru '${datasetName}' berhasil dibuat dan disimpan.` })
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal menyimpan dataset ke server.' })
    } finally {
      setIsLoading(false)
    }
  }, [datasetId, datasetName, variables, rows, initFromDataset])

  const newProject = useCallback(() => {
    setDatasetId(null)
    setDatasetName('Dataset Baru')
    setVariables(DEFAULT_VARIABLES)
    setRows([])
    setIsDemo(false)
    setIsSaved(true)
    setLastSaved(null)
    setSelectedCell(null)
    setStatusMessage({ type: 'info', text: 'Dataset baru telah dibuat.' })
  }, [])

  const loadDemo = useCallback(async () => {
    setIsLoading(true)
    try {
      const demo = await datasetApi.seedDemoData(true)
      initFromDataset(demo)
      setStatusMessage({ type: 'success', text: 'DEMO DATA berhasil dimuat ke editor.' })
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal memuat DEMO DATA.' })
    } finally {
      setIsLoading(false)
    }
  }, [initFromDataset])

  const loadDatasetById = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      const ds = await datasetApi.fetchDataset(id)
      initFromDataset(ds)
      setStatusMessage({ type: 'success', text: `Dataset '${ds.name}' berhasil dimuat.` })
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal memuat dataset.' })
    } finally {
      setIsLoading(false)
    }
  }, [initFromDataset])

  const clearData = useCallback(() => {
    setRows([])
    setIsSaved(false)
  }, [])

  const project: ProjectState = useMemo(() => ({
    id: datasetId || undefined,
    name: datasetName,
    isSaved,
    lastSaved,
    isDemo,
  }), [datasetId, datasetName, isSaved, lastSaved, isDemo])

  return {
    datasetId,
    datasetName,
    setDatasetName,
    variables,
    rows,
    columns,
    project,
    isSaved,
    isDemo,
    isLoading,
    statusMessage,
    missingCount,
    activeTab,
    setActiveTab,
    selectedCell,
    setSelectedCell,
    addRow,
    addColumn,
    deleteRow,
    deleteColumn,
    updateCell,
    updateVariable,
    pasteFromClipboard,
    clearData,
    saveDataset,
    newProject,
    loadDemo,
    loadDatasetById,
    initFromDataset,
    setStatusMessage,
    // Compat with previous signature
    updateColumnLabel: (key: string, label: string) => {
      const idx = variables.findIndex(v => v.name === key)
      if (idx !== -1) updateVariable(idx, { ...variables[idx], label })
    },
  }
}

import {
  Dataset,
  DatasetMetadata,
  VariableDefinition,
  DataRow,
  ImportPreviewResponse,
} from '@/types'
import { buildApiUrl } from './apiConfig'

const API_BASE = buildApiUrl('/api/datasets')

export async function fetchDatasets(): Promise<DatasetMetadata[]> {
  const res = await fetch(`${API_BASE}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal memuat daftar dataset')
  }
  return res.json()
}

export async function fetchDataset(id: string): Promise<Dataset> {
  const res = await fetch(`${API_BASE}/${id}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Dataset ${id} tidak ditemukan`)
  }
  return res.json()
}

export async function createDataset(payload: {
  name: string
  description?: string
  variables?: VariableDefinition[]
  rows?: DataRow[]
}): Promise<Dataset> {
  const res = await fetch(`${API_BASE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal membuat dataset baru')
  }
  return res.json()
}

export async function updateDataset(
  id: string,
  payload: {
    name?: string
    description?: string
    variables?: VariableDefinition[]
    rows?: DataRow[]
  }
): Promise<Dataset> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal menyimpan dataset')
  }
  return res.json()
}

export async function deleteDataset(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal menghapus dataset')
  }
  return res.json()
}

export async function previewImport(
  file: File,
  options: {
    sheetName?: string
    delimiter?: string
    hasHeaders?: boolean
  } = {}
): Promise<ImportPreviewResponse> {
  const formData = new FormData()
  formData.append('file', file)
  if (options.sheetName) formData.append('sheet_name', options.sheetName)
  if (options.delimiter) formData.append('delimiter', options.delimiter)
  formData.append('has_headers', String(options.hasHeaders !== false))

  const res = await fetch(`${API_BASE}/preview-import`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal membuat preview impor')
  }
  return res.json()
}

export async function commitImport(payload: {
  name: string
  target_dataset_id?: string
  variables: VariableDefinition[]
  rows: DataRow[]
}): Promise<Dataset> {
  const res = await fetch(`${API_BASE}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal menyelesaikan impor')
  }
  return res.json()
}

export async function seedDemoData(force = true): Promise<Dataset> {
  const res = await fetch(`${API_BASE}/demo/seed?force=${force}`, {
    method: 'POST',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal memuat DEMO DATA')
  }
  return res.json()
}

export function getExportCsvUrl(id: string): string {
  return `${API_BASE}/${id}/export/csv`
}

export function getExportXlsxUrl(id: string): string {
  return `${API_BASE}/${id}/export/xlsx`
}

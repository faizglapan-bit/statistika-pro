import {
  SortCasesPayload,
  FilterCasesPayload,
  FilterCasesResponse,
  DuplicateDetectionResponse,
  MissingSummaryResponse,
  Dataset,
} from '@/types'
import { buildApiUrl } from './apiConfig'

const API_BASE = buildApiUrl('/api/cases')

export async function sortCases(
  datasetId: string,
  payload: SortCasesPayload
): Promise<{ success: boolean; message: string; dataset?: Dataset; new_dataset_id?: string }> {
  const res = await fetch(`${API_BASE}/${datasetId}/sort`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal mengurutkan kasus')
  }
  return res.json()
}

export async function filterCases(
  datasetId: string,
  payload: FilterCasesPayload
): Promise<FilterCasesResponse> {
  const res = await fetch(`${API_BASE}/${datasetId}/filter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal mengevaluasi filter kasus')
  }
  return res.json()
}

export async function detectDuplicates(
  datasetId: string,
  keyVariables: string[],
  keep: 'first' | 'last' | 'none' = 'first'
): Promise<DuplicateDetectionResponse> {
  const res = await fetch(`${API_BASE}/${datasetId}/detect-duplicates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key_variables: keyVariables, keep }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal mendeteksi duplikasi')
  }
  return res.json()
}

export async function removeDuplicates(
  datasetId: string,
  keyVariables: string[],
  keep: 'first' | 'last' = 'first',
  saveAsNewDataset: boolean = false,
  newDatasetName?: string
): Promise<{ success: boolean; message: string; removed_count: number; dataset?: Dataset; new_dataset_id?: string }> {
  const res = await fetch(`${API_BASE}/${datasetId}/remove-duplicates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key_variables: keyVariables,
      keep,
      save_as_new_dataset: saveAsNewDataset,
      new_dataset_name: newDatasetName,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal menghapus duplikasi')
  }
  return res.json()
}

export async function getMissingSummary(datasetId: string): Promise<MissingSummaryResponse> {
  const res = await fetch(`${API_BASE}/${datasetId}/missing-summary`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal memuat ringkasan missing values')
  }
  return res.json()
}

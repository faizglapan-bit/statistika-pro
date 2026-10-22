import {
  ComputeVariablePayload,
  RecodeVariablePayload,
  ReverseScorePayload,
  CompositeScorePayload,
  StandardizePayload,
  CategorizePayload,
  TransformationPreviewResponse,
  TransformationApplyResponse,
  TransformationHistoryItem,
  Dataset,
} from '@/types'
import { buildApiUrl } from './apiConfig'

const API_BASE = buildApiUrl('/api/transformations')

export async function computeVariable(
  datasetId: string,
  payload: ComputeVariablePayload
): Promise<TransformationPreviewResponse | TransformationApplyResponse> {
  const res = await fetch(`${API_BASE}/${datasetId}/compute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal menghitung variabel baru')
  }
  return res.json()
}

export async function recodeVariable(
  datasetId: string,
  payload: RecodeVariablePayload
): Promise<TransformationPreviewResponse | TransformationApplyResponse> {
  const res = await fetch(`${API_BASE}/${datasetId}/recode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal merecode variabel')
  }
  return res.json()
}

export async function reverseScoreVariables(
  datasetId: string,
  payload: ReverseScorePayload
): Promise<TransformationPreviewResponse | TransformationApplyResponse> {
  const res = await fetch(`${API_BASE}/${datasetId}/reverse-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal membalikkan skor instrumen')
  }
  return res.json()
}

export async function compositeScoreVariables(
  datasetId: string,
  payload: CompositeScorePayload
): Promise<TransformationPreviewResponse | TransformationApplyResponse> {
  const res = await fetch(`${API_BASE}/${datasetId}/composite-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal menghitung skor komposit')
  }
  return res.json()
}

export async function standardizeVariables(
  datasetId: string,
  payload: StandardizePayload
): Promise<TransformationPreviewResponse | TransformationApplyResponse> {
  const res = await fetch(`${API_BASE}/${datasetId}/standardize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal melakukan standardisasi Z-score')
  }
  return res.json()
}

export async function categorizeVariable(
  datasetId: string,
  payload: CategorizePayload
): Promise<TransformationPreviewResponse | TransformationApplyResponse> {
  const res = await fetch(`${API_BASE}/${datasetId}/categorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal mengkategorisasikan variabel')
  }
  return res.json()
}

export async function getTransformationHistory(
  datasetId: string
): Promise<TransformationHistoryItem[]> {
  const res = await fetch(`${API_BASE}/${datasetId}/history`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal memuat riwayat transformasi')
  }
  return res.json()
}

export async function undoTransformation(
  datasetId: string
): Promise<{ success: boolean; message: string; dataset: Dataset }> {
  const res = await fetch(`${API_BASE}/${datasetId}/undo`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal melakukan undo')
  }
  return res.json()
}

export async function rollbackTransformation(
  datasetId: string,
  snapshotId: string
): Promise<{ success: boolean; message: string; dataset: Dataset }> {
  const res = await fetch(`${API_BASE}/${datasetId}/rollback/${snapshotId}`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal memulihkan versi snapshot')
  }
  return res.json()
}

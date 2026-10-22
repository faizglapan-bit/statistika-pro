import { AnalysisOutput, AnalysisOutputCreate, AnalysisOutputMetadata } from '@/types'
import { buildApiUrl } from './apiConfig'

const API_BASE = buildApiUrl('/api/outputs')

export async function getOutputs(datasetId?: string): Promise<AnalysisOutputMetadata[]> {
  const url = datasetId ? `${API_BASE}?dataset_id=${encodeURIComponent(datasetId)}` : API_BASE
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal memuat daftar riwayat analisis')
  }
  return res.json()
}

export async function getOutputById(outputId: string): Promise<AnalysisOutput> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(outputId)}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal memuat dokumen hasil analisis')
  }
  return res.json()
}

export async function saveOutput(payload: AnalysisOutputCreate): Promise<AnalysisOutput> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal menyimpan hasil analisis ke backend')
  }
  return res.json()
}

export async function deleteOutput(outputId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(outputId)}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal menghapus hasil analisis')
  }
}

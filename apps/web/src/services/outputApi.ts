import { AnalysisOutput, AnalysisOutputCreate, AnalysisOutputMetadata } from '@/types'
import { buildApiUrl } from './apiConfig'

const API_BASE = buildApiUrl('/api/outputs')

function saveLocalOutput(output: AnalysisOutput) {
  try {
    localStorage.setItem(`statpro_output_${output.id}`, JSON.stringify(output))
    const rawIndex = localStorage.getItem('statpro_local_outputs_index')
    const indexList: string[] = rawIndex ? JSON.parse(rawIndex) : []
    if (!indexList.includes(output.id)) {
      indexList.unshift(output.id) // Most recent first
      localStorage.setItem('statpro_local_outputs_index', JSON.stringify(indexList))
    }
  } catch {}
}

function getLocalOutputs(datasetId?: string): AnalysisOutputMetadata[] {
  const list: AnalysisOutputMetadata[] = []
  try {
    const rawIndex = localStorage.getItem('statpro_local_outputs_index')
    const indexList: string[] = rawIndex ? JSON.parse(rawIndex) : []
    for (const id of indexList) {
      const raw = localStorage.getItem(`statpro_output_${id}`)
      if (raw) {
        const item: AnalysisOutput = JSON.parse(raw)
        if (!datasetId || item.dataset_id === datasetId) {
          list.push({
            id: item.id,
            title: item.title,
            analysis_type: item.analysis_type,
            dataset_id: item.dataset_id,
            dataset_name: item.dataset_name,
            dataset_updated_at: item.dataset_updated_at,
            sample_size: item.sample_size,
            variables: item.variables,
            created_at: item.created_at,
          })
        }
      }
    }
  } catch {}
  return list
}

export async function getOutputs(datasetId?: string): Promise<AnalysisOutputMetadata[]> {
  const localItems = getLocalOutputs(datasetId)

  try {
    const url = datasetId ? `${API_BASE}?dataset_id=${encodeURIComponent(datasetId)}` : API_BASE
    const res = await fetch(url)
    if (res.ok) {
      const serverItems: AnalysisOutputMetadata[] = await res.json()
      // Gabungkan tanpa duplikasi ID
      const seen = new Set(localItems.map(i => i.id))
      for (const s of serverItems) {
        if (!seen.has(s.id)) {
          localItems.push(s)
          seen.add(s.id)
        }
      }
    }
  } catch {}

  return localItems
}

export async function getOutputById(outputId: string): Promise<AnalysisOutput> {
  // 1. Cek LocalStorage terlebih dahulu
  const raw = localStorage.getItem(`statpro_output_${outputId}`)
  if (raw) {
    try {
      return JSON.parse(raw)
    } catch {}
  }

  // 2. Coba fetch ke server
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(outputId)}`)
    if (res.ok) {
      return res.json()
    }
  } catch {}

  if (raw) return JSON.parse(raw)
  throw new Error('Dokumen hasil analisis tidak ditemukan.')
}

export async function saveOutput(payload: AnalysisOutputCreate): Promise<AnalysisOutput> {
  const localOutput: AnalysisOutput = {
    ...payload,
    id: `output_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
  }

  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const serverOutput = await res.json()
      saveLocalOutput(serverOutput)
      return serverOutput
    }
  } catch {}

  // Fallback: simpan di LocalStorage
  saveLocalOutput(localOutput)
  return localOutput
}

export async function deleteOutput(outputId: string): Promise<void> {
  // Hapus dari LocalStorage
  localStorage.removeItem(`statpro_output_${outputId}`)
  try {
    const rawIndex = localStorage.getItem('statpro_local_outputs_index')
    const indexList: string[] = rawIndex ? JSON.parse(rawIndex) : []
    const filtered = indexList.filter(id => id !== outputId)
    localStorage.setItem('statpro_local_outputs_index', JSON.stringify(filtered))
  } catch {}

  // Hapus dari server jika online
  try {
    await fetch(`${API_BASE}/${encodeURIComponent(outputId)}`, {
      method: 'DELETE',
    })
  } catch {}
}

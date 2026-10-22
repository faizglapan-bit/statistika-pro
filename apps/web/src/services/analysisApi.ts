import { buildApiUrl } from './apiConfig'
import { Dataset } from '@/types'
import {
  calculateDescriptive,
  calculateValidity,
  calculateReliability,
  calculateCorrelation,
  calculateRegression,
} from './clientStatsEngine'

const API_BASE = buildApiUrl('/api/analysis')

// Helper untuk mengambil dataset lokal dari LocalStorage
function getLocalDataset(datasetId: string): Dataset {
  try {
    const directRaw = localStorage.getItem(`statpro_dataset_${datasetId}`)
    if (directRaw) return JSON.parse(directRaw)

    const rawIndex = localStorage.getItem('statpro_local_datasets_index')
    const indexList: string[] = rawIndex ? JSON.parse(rawIndex) : []
    for (const id of indexList) {
      const raw = localStorage.getItem(`statpro_dataset_${id}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.id === datasetId || parsed.name === datasetId) {
          return parsed
        }
      }
    }
  } catch {}

  throw new Error('Dataset tidak ditemukan di memori browser. Silakan klik "Simpan" pada Editor Data terlebih dahulu.')
}

export async function runDescriptive(datasetId: string, variables: string[]) {
  // 1. Coba request ke server
  try {
    const res = await fetch(`${API_BASE}/descriptive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_id: datasetId, variables }),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {}

  // 2. Fallback offline client-side calculation
  const dataset = getLocalDataset(datasetId)
  return calculateDescriptive(dataset, variables)
}

export async function runValidity(
  datasetId: string,
  items: string[],
  method: 'pearson' | 'spearman' = 'pearson',
  scoreType: 'sum' | 'mean' = 'sum'
) {
  try {
    const res = await fetch(`${API_BASE}/validity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_id: datasetId, items, method, score_type: scoreType }),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {}

  const dataset = getLocalDataset(datasetId)
  return calculateValidity(dataset, items)
}

export async function runReliability(datasetId: string, items: string[]) {
  try {
    const res = await fetch(`${API_BASE}/reliability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_id: datasetId, items }),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {}

  const dataset = getLocalDataset(datasetId)
  return calculateReliability(dataset, items)
}

export async function runCorrelation(
  datasetId: string,
  variables: string[],
  method: 'pearson' | 'spearman' = 'pearson',
  missingPolicy: 'pairwise' | 'listwise' = 'pairwise'
) {
  try {
    const res = await fetch(`${API_BASE}/correlation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataset_id: datasetId,
        variables,
        method,
        missing_policy: missingPolicy,
      }),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {}

  const dataset = getLocalDataset(datasetId)
  return calculateCorrelation(dataset, variables, method)
}

export async function runRegression(
  datasetId: string,
  dependentVariable: string,
  independentVariables: string[],
  includeDiagnostics = true,
  confidenceLevel = 0.95
) {
  try {
    const res = await fetch(`${API_BASE}/regression`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataset_id: datasetId,
        dependent_variable: dependentVariable,
        independent_variables: independentVariables,
        include_intercept: true,
        include_diagnostics: includeDiagnostics,
        confidence_level: confidenceLevel,
      }),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {}

  const dataset = getLocalDataset(datasetId)
  return calculateRegression(dataset, dependentVariable, independentVariables)
}

export async function runDiagnostics(
  datasetId: string,
  dependentVariable: string,
  independentVariables: string[]
) {
  try {
    const res = await fetch(`${API_BASE}/diagnostics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataset_id: datasetId,
        dependent_variable: dependentVariable,
        independent_variables: independentVariables,
        include_intercept: true,
      }),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {}

  const dataset = getLocalDataset(datasetId)
  return calculateRegression(dataset, dependentVariable, independentVariables)
}

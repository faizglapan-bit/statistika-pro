import { buildApiUrl } from './apiConfig'

const API_BASE = buildApiUrl('/api/analysis')

export async function runDescriptive(datasetId: string, variables: string[]) {
  const res = await fetch(`${API_BASE}/descriptive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_id: datasetId, variables }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal menghitung statistik deskriptif')
  }
  return res.json()
}

export async function runValidity(
  datasetId: string,
  items: string[],
  method: 'pearson' | 'spearman' = 'pearson',
  scoreType: 'sum' | 'mean' = 'sum'
) {
  const res = await fetch(`${API_BASE}/validity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_id: datasetId, items, method, score_type: scoreType }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal menghitung uji validitas item')
  }
  return res.json()
}

export async function runReliability(datasetId: string, items: string[]) {
  const res = await fetch(`${API_BASE}/reliability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_id: datasetId, items }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal menghitung reliabilitas Cronbach\'s Alpha')
  }
  return res.json()
}

export async function runCorrelation(
  datasetId: string,
  variables: string[],
  method: 'pearson' | 'spearman' = 'pearson',
  missingPolicy: 'pairwise' | 'listwise' = 'pairwise'
) {
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal menghitung korelasi')
  }
  return res.json()
}

export async function runRegression(
  datasetId: string,
  dependentVariable: string,
  independentVariables: string[],
  includeDiagnostics = true,
  confidenceLevel = 0.95
) {
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal mengestimasi regresi OLS')
  }
  return res.json()
}

export async function runDiagnostics(
  datasetId: string,
  dependentVariable: string,
  independentVariables: string[]
) {
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal menghitung diagnostik regresi')
  }
  return res.json()
}

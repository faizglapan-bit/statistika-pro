/**
 * API Service untuk Modul Statistik Lanjutan (Tahap 6) — Statistika Pro
 */

import {
  OneSampleTTestPayload,
  IndependentTTestPayload,
  PairedTTestPayload,
  AnovaPayload,
  MannWhitneyPayload,
  WilcoxonPayload,
  KruskalWallisPayload,
  FriedmanPayload,
  KendallTauPayload,
  CrosstabsPayload,
  LogisticRegressionPayload,
  ChartRequestPayload,
  AdvancedAnalysisResult,
} from '@/types'
import { buildApiUrl } from './apiConfig'

const BASE_URL = buildApiUrl('/api/advanced-analysis')

async function handleResponse<T>(res: Response, defaultError: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || defaultError)
  }
  return res.json()
}

// 1. T-TESTS
export async function runOneSampleTTest(
  datasetId: string,
  payload: OneSampleTTestPayload
): Promise<AdvancedAnalysisResult> {
  const res = await fetch(`${BASE_URL}/${datasetId}/t-test/one-sample`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<AdvancedAnalysisResult>(res, 'Gagal menjalankan One-Sample t-test')
}

export async function runIndependentTTest(
  datasetId: string,
  payload: IndependentTTestPayload
): Promise<AdvancedAnalysisResult> {
  const res = await fetch(`${BASE_URL}/${datasetId}/t-test/independent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<AdvancedAnalysisResult>(res, 'Gagal menjalankan Independent Samples t-test')
}

export async function runPairedTTest(
  datasetId: string,
  payload: PairedTTestPayload
): Promise<AdvancedAnalysisResult> {
  const res = await fetch(`${BASE_URL}/${datasetId}/t-test/paired`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<AdvancedAnalysisResult>(res, 'Gagal menjalankan Paired Samples t-test')
}

// 2. ANOVA
export async function runOneWayAnova(
  datasetId: string,
  payload: AnovaPayload
): Promise<AdvancedAnalysisResult> {
  const res = await fetch(`${BASE_URL}/${datasetId}/anova/one-way`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<AdvancedAnalysisResult>(res, 'Gagal menjalankan One-Way ANOVA')
}

// 3. NONPARAMETRIK
export async function runMannWhitney(
  datasetId: string,
  payload: MannWhitneyPayload
): Promise<AdvancedAnalysisResult> {
  const res = await fetch(`${BASE_URL}/${datasetId}/nonparametric/mann-whitney`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<AdvancedAnalysisResult>(res, 'Gagal menjalankan uji Mann-Whitney U')
}

export async function runWilcoxon(
  datasetId: string,
  payload: WilcoxonPayload
): Promise<AdvancedAnalysisResult> {
  const res = await fetch(`${BASE_URL}/${datasetId}/nonparametric/wilcoxon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<AdvancedAnalysisResult>(res, 'Gagal menjalankan uji Wilcoxon')
}

export async function runKruskalWallis(
  datasetId: string,
  payload: KruskalWallisPayload
): Promise<AdvancedAnalysisResult> {
  const res = await fetch(`${BASE_URL}/${datasetId}/nonparametric/kruskal-wallis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<AdvancedAnalysisResult>(res, 'Gagal menjalankan uji Kruskal-Wallis')
}

export async function runFriedman(
  datasetId: string,
  payload: FriedmanPayload
): Promise<AdvancedAnalysisResult> {
  const res = await fetch(`${BASE_URL}/${datasetId}/nonparametric/friedman`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<AdvancedAnalysisResult>(res, 'Gagal menjalankan uji Friedman')
}

export async function runKendallTau(
  datasetId: string,
  payload: KendallTauPayload
): Promise<AdvancedAnalysisResult> {
  const res = await fetch(`${BASE_URL}/${datasetId}/nonparametric/kendall-tau`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<AdvancedAnalysisResult>(res, "Gagal menjalankan korelasi Kendall's Tau-b")
}

// 4. CROSSTABS
export async function runCrosstabs(
  datasetId: string,
  payload: CrosstabsPayload
): Promise<AdvancedAnalysisResult> {
  const res = await fetch(`${BASE_URL}/${datasetId}/crosstabs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<AdvancedAnalysisResult>(res, 'Gagal menjalankan analisis Crosstabs')
}

// 5. REGRESI LOGISTIK BINER
export async function runLogisticRegression(
  datasetId: string,
  payload: LogisticRegressionPayload
): Promise<AdvancedAnalysisResult> {
  const res = await fetch(`${BASE_URL}/${datasetId}/logistic-regression`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<AdvancedAnalysisResult>(res, 'Gagal menjalankan Regresi Logistik Biner')
}

// 6. CHARTS & VISUALISASI
export async function fetchChartData(
  datasetId: string,
  payload: ChartRequestPayload
): Promise<any> {
  const res = await fetch(`${BASE_URL}/${datasetId}/charts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<any>(res, 'Gagal mengambil data grafik statistik')
}

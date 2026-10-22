import {
  AvailableSectionsResponse,
  ReportGeneratePayload,
} from '@/types'
import { buildApiUrl } from './apiConfig'

const API_BASE = buildApiUrl('/api/reports')

export async function getReportAvailableSections(
  datasetId: string
): Promise<AvailableSectionsResponse> {
  const res = await fetch(`${API_BASE}/${datasetId}/available-sections`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal memeriksa bagian laporan yang tersedia')
  }
  return res.json()
}

export async function previewReport(
  datasetId: string,
  payload: ReportGeneratePayload
): Promise<Record<string, any>> {
  const res = await fetch(`${API_BASE}/${datasetId}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal memuat pratinjau laporan')
  }
  return res.json()
}

export async function downloadReport(
  datasetId: string,
  payload: ReportGeneratePayload
): Promise<void> {
  const format = payload.format || 'pdf'
  const endpoint = `${API_BASE}/${datasetId}/export/${format}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Gagal mengunduh dokumen laporan ${format.toUpperCase()}`)
  }

  // Ambil blob dan unduh via browser
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url

  let ext = 'pdf'
  if (format === 'docx') ext = 'docx'
  if (format === 'xlsx') ext = 'xlsx'

  a.download = `Laporan_Statistik_${new Date().toISOString().slice(0, 10)}.${ext}`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

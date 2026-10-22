import {
  ProjectMetadata,
  ProjectDetail,
  ProjectCreatePayload,
  ProjectUpdatePayload,
} from '@/types'
import { buildApiUrl } from './apiConfig'

const API_BASE = buildApiUrl('/api/projects')

export async function fetchProjects(): Promise<ProjectMetadata[]> {
  const res = await fetch(`${API_BASE}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal memuat daftar proyek')
  }
  return res.json()
}

export async function fetchProject(id: string): Promise<ProjectDetail> {
  const res = await fetch(`${API_BASE}/${id}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Proyek ${id} tidak ditemukan`)
  }
  return res.json()
}

export async function createProject(payload: ProjectCreatePayload): Promise<ProjectDetail> {
  const res = await fetch(`${API_BASE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal membuat proyek baru')
  }
  return res.json()
}

export async function saveProject(id: string, payload: ProjectUpdatePayload): Promise<ProjectDetail> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal menyimpan perubahan proyek')
  }
  return res.json()
}

export async function duplicateProject(id: string, newName?: string): Promise<ProjectDetail> {
  const url = newName ? `${API_BASE}/${id}/duplicate?new_name=${encodeURIComponent(newName)}` : `${API_BASE}/${id}/duplicate`
  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal menggandakan proyek')
  }
  return res.json()
}

export async function deleteProject(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal menghapus proyek')
  }
  return res.json()
}

export function getExportStatProUrl(id: string): string {
  return `${API_BASE}/${id}/export`
}

export async function importStatPro(file: File): Promise<ProjectDetail> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/import`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gagal mengimpor berkas .statpro')
  }
  return res.json()
}

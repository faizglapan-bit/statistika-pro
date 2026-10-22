import React, { useState, useEffect } from 'react'
import {
  ProjectMetadata,
  ProjectDetail,
} from '@/types'
import {
  fetchProjects,
  fetchProject,
  createProject,
  duplicateProject,
  deleteProject,
  getExportStatProUrl,
  importStatPro,
} from '@/services/projectApi'
import {
  FolderKanban,
  Plus,
  Download,
  Upload,
  Copy,
  Trash2,
  Check,
  X,
  Loader2,
  Calendar,
  Database,
  FileText,
  AlertCircle,
  Search,
} from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  currentProjectId: string | null
  onSelectProject: (project: ProjectDetail) => void
}

export const ProjectManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentProjectId,
  onSelectProject,
}) => {
  const [projects, setProjects] = useState<ProjectMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // New Project Form state
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  // Delete confirmation
  const [deleteCandidate, setDeleteCandidate] = useState<ProjectMetadata | null>(null)

  const loadProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProjects()
      setProjects(data)
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar proyek')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadProjects()
      setIsCreating(false)
      setDeleteCandidate(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    setActionLoading('creating')
    setError(null)
    try {
      const created = await createProject({
        name: newName.trim(),
        description: newDesc.trim(),
      })
      onSelectProject(created)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal membuat proyek')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDuplicate = async (proj: ProjectMetadata) => {
    setActionLoading(`dup-${proj.id}`)
    try {
      await duplicateProject(proj.id)
      await loadProjects()
    } catch (err: any) {
      setError(err.message || 'Gagal menggandakan proyek')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return
    setActionLoading(`del-${deleteCandidate.id}`)
    try {
      await deleteProject(deleteCandidate.id)
      setDeleteCandidate(null)
      await loadProjects()
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus proyek')
    } finally {
      setActionLoading(null)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setActionLoading('importing')
    setError(null)
    try {
      const imported = await importStatPro(file)
      onSelectProject(imported)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal mengimpor file .statpro')
    } finally {
      setActionLoading(null)
      e.target.value = ''
    }
  }

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9990,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid #1e293b',
            backgroundColor: '#1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <FolderKanban size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Manajer Proyek Analisis (.statpro)
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Kelola paket riset, simpan konfigurasi analisis, dan ekspor arsip mandiri.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar Bar */}
        <div
          style={{
            padding: '12px 24px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: '#0b1120',
          }}
        >
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
            />
            <input
              type="text"
              placeholder="Cari proyek..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 32px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Import Button */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#1e293b',
                color: '#cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Unggah paket berkas .statpro"
            >
              <Upload size={14} />
              <span>Impor .statpro</span>
              <input
                type="file"
                accept=".statpro,.zip"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>

            {/* Create New Project Button */}
            <button
              onClick={() => setIsCreating(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              <span>Proyek Baru</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '10px 24px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              borderBottom: '1px solid #ef4444',
              color: '#f87171',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* New Project Form Overlay */}
        {isCreating && (
          <form
            onSubmit={handleCreateSubmit}
            style={{
              padding: '16px 24px',
              backgroundColor: '#1e293b',
              borderBottom: '1px solid #334155',
            }}
          >
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', margin: '0 0 10px 0' }}>
              Buat Proyek Penelitian Baru
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Nama Proyek *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Analisis Kinerja Pegawai 2026"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #475569',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Deskripsi Singkat (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Catatan latar belakang atau tujuan riset"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #475569',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  background: 'transparent',
                  color: '#cbd5e1',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={actionLoading === 'creating'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: actionLoading === 'creating' ? 'not-allowed' : 'pointer',
                }}
              >
                {actionLoading === 'creating' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                <span>Simpan Proyek</span>
              </button>
            </div>
          </form>
        )}

        {/* Delete Confirmation Box */}
        {deleteCandidate && (
          <div
            style={{
              padding: '14px 24px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              borderBottom: '1px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#fca5a5' }}>
                Hapus permanen proyek "{deleteCandidate.name}"?
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#f87171' }}>
                Tindakan ini tidak dapat dibatalkan. Berkas proyek lokal akan dibersihkan.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setDeleteCandidate(null)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: '1px solid #475569',
                  background: 'transparent',
                  color: '#cbd5e1',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        )}

        {/* Projects List Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ fontSize: '13px' }}>Memuat daftar proyek...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <FolderKanban size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                {searchQuery ? 'Tidak ada proyek yang sesuai dengan pencarian.' : 'Belum ada proyek tersimpan.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredProjects.map(proj => {
                const isActive = proj.id === currentProjectId
                return (
                  <div
                    key={proj.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      backgroundColor: isActive ? 'rgba(37, 99, 235, 0.1)' : '#1e293b',
                      border: isActive ? '1px solid #3b82f6' : '1px solid #334155',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                          {proj.name}
                        </span>
                        {isActive && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(59, 130, 246, 0.25)',
                              color: '#60a5fa',
                              border: '1px solid #3b82f6',
                            }}
                          >
                            AKTIF
                          </span>
                        )}
                      </div>

                      {proj.description && (
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 6px 0' }}>
                          {proj.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: '#64748b' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Database size={12} />
                          {proj.dataset_name || 'Tanpa Dataset'} ({proj.row_count} baris, {proj.variable_count} kolom)
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FileText size={12} />
                          {proj.output_count} analisis
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          Diperbarui: {new Date(proj.updated_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={async () => {
                          const full = await fetchProject(proj.id)
                          onSelectProject(full)
                          onClose()
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: isActive ? '1px solid #3b82f6' : '1px solid #475569',
                          backgroundColor: isActive ? '#2563eb' : '#0f172a',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {isActive ? 'Buka' : 'Pilih'}
                      </button>

                      {/* Export .statpro */}
                      <a
                        href={getExportStatProUrl(proj.id)}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          border: '1px solid #334155',
                          backgroundColor: '#0f172a',
                          color: '#cbd5e1',
                          textDecoration: 'none',
                        }}
                        title="Ekspor arsip .statpro"
                      >
                        <Download size={13} />
                      </a>

                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicate(proj)}
                        disabled={actionLoading === `dup-${proj.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          border: '1px solid #334155',
                          backgroundColor: '#0f172a',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                        }}
                        title="Gandakan proyek"
                      >
                        {actionLoading === `dup-${proj.id}` ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteCandidate(proj)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          border: '1px solid #334155',
                          backgroundColor: '#0f172a',
                          color: '#f87171',
                          cursor: 'pointer',
                        }}
                        title="Hapus proyek"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

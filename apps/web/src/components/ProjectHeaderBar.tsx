import React, { useState, useEffect } from 'react'
import {
  FolderKanban,
  Save,
  Download,
  Plus,
  Copy,
  ChevronDown,
  Loader2,
  FolderOpen,
} from 'lucide-react'
import { getExportStatProUrl } from '@/services/projectApi'

interface Props {
  projectName: string
  projectId: string | null
  isDirty: boolean
  isSaving: boolean
  onSaveProject: () => void
  onOpenProjectManager: () => void
  onNewProject: () => void
  onDuplicateProject: () => void
  onUpdateProjectName: (name: string) => void
}

export const ProjectHeaderBar: React.FC<Props> = ({
  projectName,
  projectId,
  isDirty,
  isSaving,
  onSaveProject,
  onOpenProjectManager,
  onNewProject,
  onDuplicateProject,
  onUpdateProjectName,
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState(projectName)

  useEffect(() => {
    setTempTitle(projectName)
  }, [projectName])

  // Ctrl+S / Cmd+S shortcut for Quick Save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (isDirty && !isSaving) {
          onSaveProject()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDirty, isSaving, onSaveProject])

  const handleTitleSubmit = () => {
    if (tempTitle.trim() && tempTitle.trim() !== projectName) {
      onUpdateProjectName(tempTitle.trim())
    }
    setEditingTitle(false)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 16px',
        backgroundColor: '#090d16',
        borderBottom: '1px solid #1e293b',
        height: '42px',
        userSelect: 'none',
      }}
    >
      {/* Left: Project Branding & Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onOpenProjectManager}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: '#60a5fa',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 700,
          }}
          title="Buka Manajer Proyek (.statpro)"
        >
          <FolderKanban size={16} />
          <span style={{ color: '#94a3b8', fontWeight: 500 }}>Proyek:</span>
        </button>

        {/* Editable Title */}
        {editingTitle ? (
          <input
            type="text"
            autoFocus
            value={tempTitle}
            onChange={e => setTempTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={e => {
              if (e.key === 'Enter') handleTitleSubmit()
              if (e.key === 'Escape') {
                setTempTitle(projectName)
                setEditingTitle(false)
              }
            }}
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#f8fafc',
              backgroundColor: '#1e293b',
              border: '1px solid #3b82f6',
              borderRadius: '4px',
              padding: '2px 8px',
              outline: 'none',
              minWidth: '220px',
            }}
          />
        ) : (
          <div
            onClick={() => setEditingTitle(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid transparent',
              transition: 'all 0.15s ease',
            }}
            className="hover:border-slate-700 hover:bg-slate-800"
            title="Klik untuk mengubah nama proyek"
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              {projectName}
            </span>
          </div>
        )}

        {/* Dirty State Indicator Badge */}
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '12px',
            backgroundColor: isDirty ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: isDirty ? '1px solid #eab308' : '1px solid #10b981',
            color: isDirty ? '#facc15' : '#34d399',
          }}
          title={isDirty ? 'Ada perubahan belum disimpan (tekan Ctrl+S untuk simpan)' : 'Semua perubahan tersimpan'}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isDirty ? '#facc15' : '#10b981',
            }}
          />
          {isDirty ? 'Belum Disimpan' : 'Tersimpan'}
        </span>
      </div>

      {/* Right: Quick Save & Actions Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
        {/* Quick Save Button */}
        <button
          onClick={onSaveProject}
          disabled={!isDirty || isSaving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: isDirty ? '#2563eb' : '#1e293b',
            border: isDirty ? '1px solid #3b82f6' : '1px solid #334155',
            color: isDirty ? '#ffffff' : '#64748b',
            fontSize: '12px',
            fontWeight: 600,
            cursor: !isDirty || isSaving ? 'default' : 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Simpan Proyek & Dataset (Ctrl+S)"
        >
          {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          <span>Simpan Proyek</span>
          <kbd
            style={{
              fontSize: '10px',
              padding: '1px 4px',
              borderRadius: '3px',
              backgroundColor: 'rgba(0,0,0,0.25)',
              marginLeft: '2px',
            }}
          >
            Ctrl+S
          </kbd>
        </button>

        {/* Project Dropdown Trigger */}
        <button
          onClick={() => setShowMenu(prev => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '6px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            color: '#cbd5e1',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
          title="Opsi Proyek"
        >
          <span>Aksi</span>
          <ChevronDown size={13} />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '4px',
              width: '200px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
              zIndex: 9995,
              overflow: 'hidden',
              padding: '4px 0',
            }}
          >
            <button
              onClick={() => {
                setShowMenu(false)
                onOpenProjectManager()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                color: '#cbd5e1',
                fontSize: '12px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
              className="hover:bg-slate-700"
            >
              <FolderOpen size={14} />
              <span>Buka Manajer Proyek...</span>
            </button>

            <button
              onClick={() => {
                setShowMenu(false)
                onNewProject()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                color: '#cbd5e1',
                fontSize: '12px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
              className="hover:bg-slate-700"
            >
              <Plus size={14} />
              <span>Proyek Baru</span>
            </button>

            <button
              onClick={() => {
                setShowMenu(false)
                onDuplicateProject()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                color: '#cbd5e1',
                fontSize: '12px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
              className="hover:bg-slate-700"
            >
              <Copy size={14} />
              <span>Gandakan Proyek Ini</span>
            </button>

            <div style={{ height: '1px', backgroundColor: '#334155', margin: '4px 0' }} />

            {projectId && (
              <a
                href={getExportStatProUrl(projectId)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowMenu(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  color: '#60a5fa',
                  fontSize: '12px',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
                className="hover:bg-slate-700"
              >
                <Download size={14} />
                <span>Ekspor Arsip (.statpro)</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

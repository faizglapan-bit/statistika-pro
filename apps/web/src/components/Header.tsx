import { useLanguage } from '@/contexts/LanguageContext'
import { BackendStatus, ProjectState } from '@/types'
import { Plus, Globe, Save, Circle } from 'lucide-react'
import clsx from 'clsx'

interface HeaderProps {
  backendStatus: BackendStatus
  project: ProjectState
  onNewProject: () => void
  onOpenSettings?: () => void
}

export function Header({ backendStatus, project, onNewProject, onOpenSettings }: HeaderProps) {
  const { language, toggleLanguage, t } = useLanguage()

  return (
    <header
      className="flex items-center justify-between flex-shrink-0"
      style={{
        height: '48px',
        background: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border-subtle)',
        padding: '0 16px',
        gap: '12px',
      }}
    >
      {/* Left: App title */}
      <div className="flex items-center gap-3">
        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
          {t('appName')}
        </div>
        <div
          style={{
            height: '16px',
            width: '1px',
            background: 'var(--color-border)',
          }}
        />
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.name}
        </div>
      </div>

      {/* Center: Save status */}
      <div className="flex items-center gap-1.5" style={{ flex: 1, justifyContent: 'center' }}>
        <Circle
          size={6}
          fill={project.isSaved ? 'var(--color-status-success)' : 'var(--color-status-warning)'}
          stroke="none"
        />
        <span
          style={{
            fontSize: '11px',
            color: project.isSaved ? 'var(--color-status-success)' : 'var(--color-status-warning)',
            fontWeight: 500,
          }}
        >
          {project.isSaved ? t('saved') : t('unsaved')}
        </span>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Backend status */}
        <div
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 transition-all duration-150"
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border-subtle)',
            cursor: onOpenSettings ? 'pointer' : 'default',
          }}
          title={backendStatus === 'online' ? 'Backend API berjalan (Klik untuk membuka Pengaturan)' : 'Backend API tidak tersedia (Klik untuk menghubungkan)'}
        >
          <div
            className={clsx('status-dot', {
              online: backendStatus === 'online',
              offline: backendStatus === 'offline',
              checking: backendStatus === 'checking',
            })}
          />
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {backendStatus === 'online'
              ? t('backendOnline')
              : backendStatus === 'offline'
              ? t('backendOffline')
              : t('backendChecking')}
          </span>
        </div>

        {/* Language toggle */}
        <button
          id="btn-toggle-language"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 transition-all duration-150"
          style={{
            padding: '5px 10px',
            borderRadius: '6px',
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 600,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-subtle)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)'
          }}
          title={`Switch to ${language === 'id' ? 'English' : 'Bahasa Indonesia'}`}
          aria-label={`Ganti bahasa ke ${language === 'id' ? 'English' : 'Indonesia'}`}
        >
          <Globe size={12} />
          <span>{language === 'id' ? 'ID' : 'EN'}</span>
        </button>

        {/* Save button (visual only at Stage 1) */}
        <button
          id="btn-save"
          className="flex items-center gap-1.5 transition-all duration-150"
          style={{
            padding: '5px 10px',
            borderRadius: '6px',
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border-subtle)',
            color: project.isSaved ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
            cursor: project.isSaved ? 'default' : 'pointer',
            fontSize: '11px',
            fontWeight: 500,
          }}
          disabled={project.isSaved}
          title="Simpan proyek (Ctrl+S)"
          aria-label="Simpan proyek"
        >
          <Save size={12} />
          <span>Save</span>
        </button>

        {/* New project button */}
        <button
          id="btn-new-project"
          onClick={onNewProject}
          className="flex items-center gap-1.5 transition-all duration-150"
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(59,130,246,0.4)'
            ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(59,130,246,0.3)'
            ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
          }}
          title={t('newProject')}
          aria-label={t('newProject')}
        >
          <Plus size={13} />
          <span>{t('newProject')}</span>
        </button>
      </div>
    </header>
  )
}

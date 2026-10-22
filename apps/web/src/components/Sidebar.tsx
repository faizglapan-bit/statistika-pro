import { MenuId, MenuItem } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { BackendStatus } from '@/types'
import {
  LayoutDashboard,
  Table2,
  ListOrdered,
  BarChart3,
  FileOutput,
  FileText,
  Settings,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import clsx from 'clsx'

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    labelId: 'Dashboard',
    labelEn: 'Dashboard',
    icon: 'LayoutDashboard',
    comingSoon: false,
    description: { id: 'Ringkasan proyek dan status', en: 'Project summary and status' },
  },
  {
    id: 'data-editor',
    labelId: 'Editor Data',
    labelEn: 'Data Editor',
    icon: 'Table2',
    comingSoon: false,
    description: { id: 'Input dan kelola data', en: 'Input and manage data' },
  },
  {
    id: 'variable-view',
    labelId: 'Tampilan Variabel',
    labelEn: 'Variable View',
    icon: 'ListOrdered',
    comingSoon: false,
    description: { id: 'Konfigurasi variabel', en: 'Variable configuration' },
  },
  {
    id: 'analysis',
    labelId: 'Analisis Statistik',
    labelEn: 'Statistical Analysis',
    icon: 'BarChart3',
    comingSoon: false,
    description: { id: 'Uji statistik & regresi', en: 'Statistical tests & regression' },
  },
  {
    id: 'advanced-analysis',
    labelId: 'Statistik Lanjutan',
    labelEn: 'Advanced Statistics',
    icon: 'Sparkles',
    comingSoon: false,
    description: { id: 'Uji beda, ANOVA, nonparametrik & logistik', en: 'T-tests, ANOVA, nonparametrics & logit' },
  },
  {
    id: 'output',
    labelId: 'Output Viewer',
    labelEn: 'Output Viewer',
    icon: 'FileOutput',
    comingSoon: false,
    description: { id: 'Lihat hasil analisis', en: 'View analysis results' },
  },
  {
    id: 'reports',
    labelId: 'Generator Laporan',
    labelEn: 'Report Generator',
    icon: 'FileText',
    comingSoon: false,
    description: { id: 'Buat laporan statistik PDF/Word/Excel', en: 'Generate statistical reports' },
  },
  {
    id: 'settings',
    labelId: 'Pengaturan',
    labelEn: 'Settings',
    icon: 'Settings',
    comingSoon: false,
    description: { id: 'Konfigurasi koneksi API & penyimpanan', en: 'API connection & storage settings' },
  },
]

const iconMap: Record<string, React.ComponentType<React.SVGAttributes<SVGElement> & { size?: number }>> = {
  LayoutDashboard,
  Table2,
  ListOrdered,
  BarChart3,
  FileOutput,
  FileText,
  Settings,
  Sparkles,
}

interface SidebarProps {
  activeMenu: MenuId
  onMenuChange: (id: MenuId) => void
  backendStatus: BackendStatus
}

export function Sidebar({ activeMenu, onMenuChange, backendStatus }: SidebarProps) {
  const { language } = useLanguage()

  return (
    <aside
      className="flex flex-col"
      style={{
        width: '220px',
        minWidth: '220px',
        background: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border-subtle)',
        height: '100%',
      }}
      aria-label="Navigasi utama"
    >
      {/* Logo */}
      <div
        style={{
          padding: '18px 16px 14px',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
            }}
          >
            <span style={{ color: 'white', fontWeight: 700, fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
              SP
            </span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
              Statistika Pro
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
              v1.0.0-alpha
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1" style={{ padding: '8px 8px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '4px' }}>
          {MENU_ITEMS.map((item) => {
            const Icon = iconMap[item.icon]
            const isActive = activeMenu === item.id
            const label = language === 'id' ? item.labelId : item.labelEn

            return (
              <button
                key={item.id}
                id={`menu-${item.id}`}
                onClick={() => onMenuChange(item.id)}
                className={clsx(
                  'w-full flex items-center gap-2.5 rounded-lg transition-all duration-150 group',
                  'relative text-left'
                )}
                style={{
                  padding: '8px 10px',
                  marginBottom: '2px',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(20,184,166,0.12) 100%)'
                    : 'transparent',
                  border: isActive
                    ? '1px solid rgba(59,130,246,0.25)'
                    : '1px solid transparent',
                  color: isActive
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-hover)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)'
                  }
                }}
                aria-current={isActive ? 'page' : undefined}
                title={item.description[language]}
              >
                {/* Active indicator */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '18px',
                      borderRadius: '0 2px 2px 0',
                      background: 'linear-gradient(180deg, #3b82f6, #14b8a6)',
                    }}
                  />
                )}

                <Icon
                  size={16}
                  className={clsx(
                    'flex-shrink-0 transition-colors',
                    isActive ? 'text-blue-400' : 'text-current'
                  )}
                  style={{ color: isActive ? 'var(--color-accent-primary)' : undefined }}
                />

                <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400, flex: 1 }}>
                  {label}
                </span>

                {item.comingSoon && (
                  <span className="badge-coming-soon" aria-label="Segera hadir">
                    {language === 'id' ? 'Soon' : 'Soon'}
                  </span>
                )}

                {!item.comingSoon && isActive && (
                  <ChevronRight size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Bottom status */}
      <div
        style={{
          padding: '12px 12px',
          borderTop: '1px solid var(--color-border-subtle)',
        }}
      >
        <div
          className="flex items-center gap-2"
          style={{
            padding: '8px 10px',
            borderRadius: '8px',
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          <div
            className={clsx('status-dot', {
              online: backendStatus === 'online',
              offline: backendStatus === 'offline',
              checking: backendStatus === 'checking',
            })}
          />
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            {backendStatus === 'online'
              ? 'API Terhubung'
              : backendStatus === 'offline'
              ? 'API Terputus'
              : 'Memeriksa API...'}
          </span>
        </div>
      </div>
    </aside>
  )
}

import { useLanguage } from '@/contexts/LanguageContext'
import { BackendStatus } from '@/types'
import { MenuId } from '@/types'
import {
  LayoutDashboard,
  Table2,
  ArrowRight,
  Server,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart3,
  ListOrdered,
  FileOutput,
  FileText,
  Settings,
} from 'lucide-react'
import clsx from 'clsx'

interface DashboardViewProps {
  backendStatus: BackendStatus
  onNavigate: (id: MenuId) => void
  onCheckHealth: () => void
}

const FEATURES_AVAILABLE = [
  { icon: LayoutDashboard, nameId: 'Dashboard', nameEn: 'Dashboard', descId: 'Ringkasan status proyek', descEn: 'Project status summary' },
  { icon: Table2, nameId: 'Editor Data', nameEn: 'Data Editor', descId: 'Input & kelola data statistik (Data View)', descEn: 'Input & manage statistical data' },
  { icon: ListOrdered, nameId: 'Tampilan Variabel', nameEn: 'Variable View', descId: 'Konfigurasi tipe, label, & nilai variabel', descEn: 'Configure variable types, labels & values' },
  { icon: BarChart3, nameId: 'Analisis Statistik', nameEn: 'Statistical Analysis', descId: 'Deskriptif, validitas, reliabilitas, korelasi, regresi OLS', descEn: 'Descriptives, validity, reliability, correlation, OLS regression' },
  { icon: FileOutput, nameId: 'Output Viewer', nameEn: 'Output Viewer', descId: 'Riwayat & visualisasi hasil analisis ala SPSS', descEn: 'Analysis history & SPSS-style table visualization' },
]

const FEATURES_COMING = [
  { icon: FileText, nameId: 'Laporan', nameEn: 'Reports', descId: 'Ekspor laporan PDF & Word', descEn: 'Export PDF & Word reports' },
  { icon: Settings, nameId: 'Pengaturan', nameEn: 'Settings', descId: 'Konfigurasi tema & bahasa', descEn: 'Theme & language configuration' },
]

export function DashboardView({ backendStatus, onNavigate, onCheckHealth }: DashboardViewProps) {
  const { language } = useLanguage()

  const statusColor =
    backendStatus === 'online' ? 'var(--color-status-success)' :
    backendStatus === 'offline' ? 'var(--color-status-error)' :
    'var(--color-status-warning)'

  const StatusIcon =
    backendStatus === 'online' ? CheckCircle2 :
    backendStatus === 'offline' ? XCircle :
    Loader2

  return (
    <div
      className="flex flex-col gap-6 animate-fade-in"
      style={{ padding: '24px', overflowY: 'auto', height: '100%' }}
    >
      {/* Welcome banner */}
      <div
        style={{
          borderRadius: '12px',
          padding: '28px 32px',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(20,184,166,0.08) 50%, rgba(99,102,241,0.06) 100%)',
          border: '1px solid rgba(59,130,246,0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', right: '-20px', top: '-20px',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'rgba(59,130,246,0.06)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', right: '30px', bottom: '-30px',
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(20,184,166,0.06)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
            {language === 'id' ? '👋 Selamat Datang di Statistika Pro' : '👋 Welcome to Statistika Pro'}
          </h1>
          <p style={{ margin: '8px 0 20px', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            {language === 'id'
              ? 'Platform analisis statistik profesional berbasis web. Olah data, analisis, dan buat laporan dengan mudah.'
              : 'Professional web-based statistical analysis platform. Process data, analyze, and create reports with ease.'}
          </p>
          <button
            id="btn-open-data-editor"
            onClick={() => onNavigate('data-editor')}
            className="flex items-center gap-2 transition-all duration-150"
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 2px 12px rgba(59,130,246,0.35)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(59,130,246,0.45)'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(59,130,246,0.35)'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
            }}
          >
            <Table2 size={14} />
            {language === 'id' ? 'Buka Editor Data' : 'Open Data Editor'}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Available features */}
        <div
          style={{
            borderRadius: '10px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-subtle)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} style={{ color: 'var(--color-status-success)' }} />
              <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                {language === 'id' ? 'Fitur Tersedia' : 'Available Features'}
              </span>
            </div>
          </div>
          <div style={{ padding: '8px 8px' }}>
            {FEATURES_AVAILABLE.map((feat) => {
              const Icon = feat.icon
              return (
                <div
                  key={feat.nameId}
                  className="flex items-center gap-3 rounded-lg"
                  style={{ padding: '10px 10px' }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '7px', flexShrink: 0,
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} style={{ color: 'var(--color-status-success)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {language === 'id' ? feat.nameId : feat.nameEn}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {language === 'id' ? feat.descId : feat.descEn}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Service status */}
        <div
          style={{
            borderRadius: '10px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-subtle)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div className="flex items-center gap-2">
              <Server size={14} style={{ color: 'var(--color-accent-primary)' }} />
              <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                {language === 'id' ? 'Status Layanan' : 'Service Status'}
              </span>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            <div
              className="flex items-center justify-between rounded-lg"
              style={{
                padding: '12px 14px',
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border-subtle)',
                marginBottom: '10px',
              }}
            >
              <div className="flex items-center gap-2.5">
                <StatusIcon
                  size={16}
                  style={{ color: statusColor }}
                  className={clsx({ 'animate-spin': backendStatus === 'checking' })}
                />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {language === 'id' ? 'API Backend (FastAPI)' : 'Backend API (FastAPI)'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    http://127.0.0.1:8000
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: statusColor }}>
                {backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : '...'}
              </span>
            </div>

            {backendStatus === 'offline' && (
              <div style={{ marginBottom: '10px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {language === 'id'
                    ? 'Backend tidak terhubung. Jalankan server FastAPI terlebih dahulu.'
                    : 'Backend not connected. Start the FastAPI server first.'}
                </p>
                <code style={{
                  display: 'block', fontSize: '10px', padding: '6px 8px', borderRadius: '5px',
                  background: 'var(--color-bg-primary)', color: 'var(--color-text-teal)',
                  fontFamily: 'var(--font-mono)', border: '1px solid var(--color-border-subtle)',
                }}>
                  cd apps/api && uvicorn main:app --reload
                </code>
              </div>
            )}

            <button
              id="btn-check-health"
              onClick={onCheckHealth}
              style={{
                width: '100%', padding: '7px', borderRadius: '6px', fontSize: '11px',
                fontWeight: 500, cursor: 'pointer',
                background: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)'}
            >
              {language === 'id' ? '⟳ Periksa Koneksi' : '⟳ Check Connection'}
            </button>
          </div>
        </div>
      </div>

      {/* Coming soon features */}
      <div
        style={{
          borderRadius: '10px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-subtle)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>
            {language === 'id' ? '🚧 Segera Hadir' : '🚧 Coming Soon'}
          </span>
        </div>
        <div
          className="grid gap-1"
          style={{ padding: '8px', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
        >
          {FEATURES_COMING.map((feat) => {
            const Icon = feat.icon
            return (
              <div
                key={feat.nameId}
                className="flex items-center gap-2.5 rounded-lg"
                style={{
                  padding: '10px 12px',
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border-subtle)',
                  opacity: 0.7,
                }}
              >
                <Icon size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                    {language === 'id' ? feat.nameId : feat.nameEn}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    {language === 'id' ? feat.descId : feat.descEn}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

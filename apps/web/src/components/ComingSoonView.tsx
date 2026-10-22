import { useLanguage } from '@/contexts/LanguageContext'
import { MenuId } from '@/types'
import {
  Clock,
  FlaskConical,
  ListOrdered,
  FileOutput,
  FileText,
  Settings,
  ArrowLeft,
} from 'lucide-react'

const COMING_SOON_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ size?: number }>
    nameId: string
    nameEn: string
    descId: string
    descEn: string
    plannedId: string[]
    plannedEn: string[]
    eta: string
  }
> = {
  'variable-view': {
    icon: ListOrdered,
    nameId: 'Tampilan Variabel',
    nameEn: 'Variable View',
    descId: 'Kelola konfigurasi lengkap setiap variabel dalam dataset Anda.',
    descEn: 'Manage complete configuration for each variable in your dataset.',
    plannedId: ['Nama dan label variabel', 'Tipe data (numerik, string, tanggal)', 'Lebar kolom dan desimal', 'Missing values', 'Level pengukuran (nominal, ordinal, interval, rasio)'],
    plannedEn: ['Variable name and label', 'Data type (numeric, string, date)', 'Column width and decimals', 'Missing values', 'Measurement level (nominal, ordinal, interval, ratio)'],
    eta: 'Tahap 2',
  },
  analysis: {
    icon: FlaskConical,
    nameId: 'Analisis Statistik',
    nameEn: 'Statistical Analysis',
    descId: 'Jalankan berbagai uji statistik dan analisis data secara langsung di browser.',
    descEn: 'Run various statistical tests and data analysis directly in the browser.',
    plannedId: ['Statistik deskriptif (mean, median, SD)', 'Uji-t satu sampel & dua sampel', 'ANOVA satu arah & dua arah', 'Korelasi Pearson & Spearman', 'Regresi linear sederhana & berganda', 'Uji Chi-Square', 'Uji normalitas (Shapiro-Wilk, K-S)'],
    plannedEn: ['Descriptive statistics (mean, median, SD)', 'One-sample & two-sample t-test', 'One-way & two-way ANOVA', 'Pearson & Spearman correlation', 'Simple & multiple linear regression', 'Chi-Square test', 'Normality tests (Shapiro-Wilk, K-S)'],
    eta: 'Tahap 3',
  },
  output: {
    icon: FileOutput,
    nameId: 'Output Viewer',
    nameEn: 'Output Viewer',
    descId: 'Tampilkan hasil analisis dalam format tabel dan grafik profesional.',
    descEn: 'Display analysis results in professional table and chart format.',
    plannedId: ['Tabel output terformat', 'Grafik batang, garis, dan kotak', 'Interpretasi otomatis', 'Export gambar & PDF'],
    plannedEn: ['Formatted output tables', 'Bar, line, and box charts', 'Automatic interpretation', 'Image & PDF export'],
    eta: 'Tahap 4',
  },
  reports: {
    icon: FileText,
    nameId: 'Laporan',
    nameEn: 'Reports',
    descId: 'Buat laporan statistik profesional yang siap dipublikasikan.',
    descEn: 'Generate professional statistical reports ready for publication.',
    plannedId: ['Template laporan APA Style', 'Export ke PDF dan Word', 'Tabel dan grafik terintegrasi', 'Catatan metodologi otomatis'],
    plannedEn: ['APA Style report templates', 'Export to PDF and Word', 'Integrated tables and charts', 'Automatic methodology notes'],
    eta: 'Tahap 5',
  },
  settings: {
    icon: Settings,
    nameId: 'Pengaturan',
    nameEn: 'Settings',
    descId: 'Konfigurasikan preferensi dan tampilan aplikasi.',
    descEn: 'Configure application preferences and appearance.',
    plannedId: ['Ganti tema (gelap/terang)', 'Pilih bahasa antarmuka', 'Atur URL backend', 'Preferensi format angka', 'Manajemen data'],
    plannedEn: ['Change theme (dark/light)', 'Select interface language', 'Set backend URL', 'Number format preferences', 'Data management'],
    eta: 'Tahap 2',
  },
}

interface ComingSoonViewProps {
  menuId: MenuId
  onBack: () => void
}

export function ComingSoonView({ menuId, onBack }: ComingSoonViewProps) {
  const { language } = useLanguage()
  const config = COMING_SOON_CONFIG[menuId]

  if (!config) return null

  const Icon = config.icon
  const name = language === 'id' ? config.nameId : config.nameEn
  const desc = language === 'id' ? config.descId : config.descEn
  const planned = language === 'id' ? config.plannedId : config.plannedEn

  return (
    <div
      className="flex flex-col items-center justify-center animate-fade-in"
      style={{ height: '100%', padding: '40px 32px' }}
    >
      <div
        style={{
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Back button */}
        <div style={{ textAlign: 'left', marginBottom: '32px' }}>
          <button
            id={`btn-back-from-${menuId}`}
            onClick={onBack}
            className="flex items-center gap-1.5 transition-colors"
            style={{
              background: 'none', border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer', fontSize: '12px',
              padding: '4px 0',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)'}
          >
            <ArrowLeft size={13} />
            {language === 'id' ? 'Kembali ke Dashboard' : 'Back to Dashboard'}
          </button>
        </div>

        {/* Icon */}
        <div
          style={{
            width: '72px', height: '72px', borderRadius: '16px', margin: '0 auto 20px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(59,130,246,0.1) 100%)',
            border: '1px solid rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon size={32} />
        </div>

        {/* Title */}
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {name}
        </h1>

        {/* ETA badge */}
        <div style={{ marginBottom: '12px' }}>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
              background: 'rgba(99,102,241,0.12)', color: '#a5b4fc',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
          >
            <Clock size={11} />
            {config.eta}
          </span>
        </div>

        <p style={{ margin: '0 0 28px', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          {desc}
        </p>

        {/* Planned features */}
        <div
          style={{
            textAlign: 'left',
            borderRadius: '10px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-subtle)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {language === 'id' ? '📋 Fitur yang Direncanakan' : '📋 Planned Features'}
            </span>
          </div>
          <ul style={{ margin: 0, padding: '8px 0', listStyle: 'none' }}>
            {planned.map((feat, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2.5"
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  borderBottom: idx < planned.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                }}
              >
                <span style={{ color: 'var(--color-accent-teal)', fontSize: '10px' }}>◆</span>
                {feat}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

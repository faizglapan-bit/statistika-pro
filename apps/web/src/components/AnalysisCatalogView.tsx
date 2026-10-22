import {
  Layers,
  CheckCircle2,
  ShieldCheck,
  Activity,
  TrendingUp,
  AlertCircle,
  Database,
  Play,
} from 'lucide-react'
import { VariableDefinition } from '@/types'

export interface AnalysisCatalogViewProps {
  datasetId: string | null
  datasetName: string
  variables: VariableDefinition[]
  onOpenDialog: (type: 'descriptive' | 'validity' | 'reliability' | 'correlation' | 'regression' | 'diagnostics') => void
  onNavigateToEditor: () => void
}

export function AnalysisCatalogView({
  datasetId,
  datasetName,
  variables,
  onOpenDialog,
  onNavigateToEditor,
}: AnalysisCatalogViewProps) {
  const numericVars = variables.filter(v => v.type === 'numeric')

  const analyses = [
    {
      id: 'descriptive' as const,
      title: 'Statistik Deskriptif',
      icon: Layers,
      color: '#3b82f6',
      desc: 'Ringkasan tendensi sentral (Mean, Median, Mode), variabilitas sampel (Std Dev, Variance, SEM), nilai ekstrim (Min, Max), serta kemiringan (Skewness & Kurtosis).',
      requirements: 'Minimal 1 variabel numerik',
      isReady: numericVars.length >= 1,
    },
    {
      id: 'validity' as const,
      title: 'Uji Validitas Item',
      icon: CheckCircle2,
      color: '#10b981',
      desc: 'Uji validitas butir angket menggunakan Pearson Product Moment atau Spearman Rank. Menghitung r-hitung total dan Corrected Item-Total correlation (r > 0.3).',
      requirements: 'Minimal 2 item indikator',
      isReady: numericVars.length >= 2,
    },
    {
      id: 'reliability' as const,
      title: 'Uji Reliabilitas (Cronbach\'s Alpha)',
      icon: ShieldCheck,
      color: '#06b6d4',
      desc: 'Evaluasi konsistensi internal skala instrumen penelitian. Menghasilkan skor Cronbach\'s Alpha keseluruhan dan tabel Item-Total Statistics jika item dihapus.',
      requirements: 'Minimal 2 item indikator',
      isReady: numericVars.length >= 2,
    },
    {
      id: 'correlation' as const,
      title: 'Matriks Korelasi Bivariat',
      icon: Activity,
      color: '#8b5cf6',
      desc: 'Analisis derajat asosiasi linier antar variabel numerik (Pearson & Spearman Rank) lengkap dengan p-value 2-tailed, N observasi, dan bintang signifikansi (* / **).',
      requirements: 'Minimal 2 variabel numerik',
      isReady: numericVars.length >= 2,
    },
    {
      id: 'regression' as const,
      title: 'Regresi Linear Berganda (OLS)',
      icon: TrendingUp,
      color: '#f59e0b',
      desc: 'Estimasi Ordinary Least Squares (OLS) dengan Model Summary (R, R², Adj R²), persamaan regresi otomatis, tabel ANOVA F-test, dan tabel koefisien lengkap (B, Beta, t, p, CI 95%).',
      requirements: '1 variabel dependen (Y) + minimal 1 variabel independen (X)',
      isReady: numericVars.length >= 2,
    },
    {
      id: 'diagnostics' as const,
      title: 'Uji Asumsi Klasik OLS',
      icon: AlertCircle,
      color: '#ec4899',
      desc: 'Pengujian kepatuhan asumsi klasik regresi OLS: Normalitas residual (Shapiro-Wilk), Multikolinearitas (VIF & Tolerance), Heteroskedastisitas (Breusch-Pagan & Glejser), dan Autokorelasi (Durbin-Watson).',
      requirements: '1 variabel dependen (Y) + minimal 1 variabel independen (X)',
      isReady: numericVars.length >= 2,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: '#0b1120', padding: '24px 32px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            Katalog Analisis Statistik
          </h1>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            Pilih metode analisis terapan. Setiap modul membuka dialog konfigurasi variabel ala SPSS.
          </div>
        </div>

        {/* Dataset Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: '#1e293b',
            border: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} className="text-blue-400" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                {datasetName || 'Belum Ada Dataset'}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {numericVars.length} variabel numerik tersedia
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToEditor}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid #3b82f6',
              color: '#60a5fa',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Buka Editor
          </button>
        </div>
      </div>

      {/* Warning if no dataset */}
      {!datasetId && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid #f59e0b',
            color: '#fbbf24',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span>
              <strong>Perhatian:</strong> Dataset belum disimpan atau masih kosong. Harap muat Demo Data atau simpan dataset di Editor Data sebelum menjalankan analisis.
            </span>
          </div>
          <button
            onClick={onNavigateToEditor}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#f59e0b',
              border: 'none',
              color: '#000',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Buka Editor Data
          </button>
        </div>
      )}

      {/* Grid of 6 Analysis Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {analyses.map(item => {
          const Icon = item.icon
          return (
            <div
              key={item.id}
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: `rgba(${item.color === '#3b82f6' ? '59, 130, 246' : item.color === '#10b981' ? '16, 185, 129' : item.color === '#06b6d4' ? '6, 182, 212' : item.color === '#8b5cf6' ? '139, 92, 246' : item.color === '#f59e0b' ? '245, 158, 11' : '236, 72, 153'}, 0.2)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.color,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                      {item.title}
                    </h3>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Syarat: {item.requirements}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                  {item.desc}
                </p>
              </div>

              <div style={{ paddingTop: '12px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: item.isReady ? '#34d399' : '#f87171',
                  }}
                >
                  {item.isReady ? '✓ Siap Dianalisis' : 'Variabel Belum Cukup'}
                </span>

                <button
                  onClick={() => onOpenDialog(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '6px',
                    background: '#2563eb',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Play size={13} />
                  <span>Buka Dialog</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

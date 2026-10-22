import { useState, useMemo } from 'react'
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Play,
  CheckSquare,
  Square,
  Layers,
  ShieldCheck,
  TrendingUp,
  Activity,
  Loader2,
} from 'lucide-react'
import { VariableDefinition, DataRow } from '@/types'
import * as analysisApi from '@/services/analysisApi'

interface AnalysisViewProps {
  datasetId: string | null
  datasetName: string
  variables: VariableDefinition[]
  rows: DataRow[]
}

type AnalysisTab = 'descriptive' | 'validity' | 'reliability' | 'correlation' | 'regression'

export function AnalysisView({ datasetId, datasetName, variables, rows }: AnalysisViewProps) {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('descriptive')
  const [selectedVars, setSelectedVars] = useState<string[]>([])
  const [dependentVar, setDependentVar] = useState<string>('')
  const [method, setMethod] = useState<'pearson' | 'spearman'>('pearson')
  const [scoreType, setScoreType] = useState<'sum' | 'mean'>('sum')
  const [missingPolicy, setMissingPolicy] = useState<'pairwise' | 'listwise'>('pairwise')
  const [includeDiagnostics, setIncludeDiagnostics] = useState<boolean>(true)

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any | null>(null)

  // Filter variabel numerik
  const numericVars = useMemo(() => {
    return variables.filter(v => v.type === 'numeric')
  }, [variables])

  // Toggle selection
  const toggleVar = (varName: string) => {
    setSelectedVars(prev =>
      prev.includes(varName) ? prev.filter(v => v !== varName) : [...prev, varName]
    )
  }

  const selectAll = () => {
    setSelectedVars(numericVars.map(v => v.name))
  }

  const clearSelection = () => {
    setSelectedVars([])
  }

  // Jalankan analisis
  const handleRunAnalysis = async () => {
    if (!datasetId) {
      setError('Dataset belum tersimpan ke server. Silakan simpan dataset di Editor Data terlebih dahulu.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      if (activeTab === 'descriptive') {
        if (selectedVars.length === 0) throw new Error('Pilih minimal satu variabel untuk analisis deskriptif.')
        const res = await analysisApi.runDescriptive(datasetId, selectedVars)
        setResult(res)
      } else if (activeTab === 'validity') {
        if (selectedVars.length < 2) throw new Error('Uji validitas instrumen membutuhkan minimal 2 item variabel.')
        const res = await analysisApi.runValidity(datasetId, selectedVars, method, scoreType)
        setResult(res)
      } else if (activeTab === 'reliability') {
        if (selectedVars.length < 2) throw new Error('Uji reliabilitas Cronbach\'s Alpha membutuhkan minimal 2 item variabel.')
        const res = await analysisApi.runReliability(datasetId, selectedVars)
        setResult(res)
      } else if (activeTab === 'correlation') {
        if (selectedVars.length < 2) throw new Error('Analisis korelasi membutuhkan minimal 2 variabel.')
        const res = await analysisApi.runCorrelation(datasetId, selectedVars, method, missingPolicy)
        setResult(res)
      } else if (activeTab === 'regression') {
        if (!dependentVar) throw new Error('Pilih satu variabel dependen (Y).')
        const indep = selectedVars.filter(v => v !== dependentVar)
        if (indep.length === 0) throw new Error('Pilih minimal satu variabel independen (X) yang berbeda dari Y.')
        const res = await analysisApi.runRegression(datasetId, dependentVar, indep, includeDiagnostics)
        setResult(res)
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses analisis statistik.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#0b1120' }}>
      {/* Header Info */}
      <div
        style={{
          padding: '12px 20px',
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 className="text-blue-400" size={22} />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
              Analisis Statistik — {datasetName}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Statistical Engine terapan: Uji Deskriptif, Validitas, Reliabilitas, Korelasi, dan Regresi OLS
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#94a3b8' }}>
          <span>N Kasus: <strong style={{ color: '#f8fafc' }}>{rows.length}</strong></span>
          <span>Variabel Numerik: <strong style={{ color: '#38bdf8' }}>{numericVars.length}</strong></span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div
        style={{
          display: 'flex',
          background: '#0f172a',
          borderBottom: '1px solid #334155',
          padding: '0 16px',
          gap: '4px',
          flexShrink: 0,
        }}
      >
        {[
          { id: 'descriptive', label: 'Statistik Deskriptif', icon: Layers },
          { id: 'validity', label: 'Uji Validitas Item', icon: CheckCircle2 },
          { id: 'reliability', label: 'Reliabilitas Alpha', icon: ShieldCheck },
          { id: 'correlation', label: 'Korelasi Matrix', icon: Activity },
          { id: 'regression', label: 'Regresi Linear & Diagnostik', icon: TrendingUp },
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as AnalysisTab)
                setError(null)
                setResult(null)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: isActive ? '#1e293b' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                color: isActive ? '#38bdf8' : '#94a3b8',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Body: 2 Columns Layout (Config & Results) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel: Variable Selector & Parameters */}
        <div
          style={{
            width: '320px',
            background: 'rgba(15, 23, 42, 0.7)',
            borderRight: '1px solid #334155',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
            Konfigurasi Analisis
          </div>

          {/* Regression Dependent Variable Select */}
          {activeTab === 'regression' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                Variabel Dependen (Y)
              </label>
              <select
                value={dependentVar}
                onChange={e => setDependentVar(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  color: '#fff',
                  fontSize: '13px',
                }}
              >
                <option value="">-- Pilih Variabel Y --</option>
                {numericVars.map(v => (
                  <option key={v.name} value={v.name}>
                    {v.name} {v.label ? `[${v.label}]` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Variable Checklist */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '180px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8' }}>
                {activeTab === 'regression' ? 'Variabel Independen (X)' : 'Pilih Variabel'} ({selectedVars.length})
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={selectAll}
                  style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontSize: '11px', cursor: 'pointer' }}
                >
                  Pilih Semua
                </button>
                <span style={{ color: '#475569' }}>•</span>
                <button
                  onClick={clearSelection}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}
                >
                  Reset
                </button>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                maxHeight: '220px',
                overflowY: 'auto',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {numericVars.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                  Tidak ada variabel numerik ditemukan di dataset.
                </div>
              ) : (
                numericVars.map(v => {
                  const isChecked = selectedVars.includes(v.name)
                  const isDep = activeTab === 'regression' && dependentVar === v.name
                  return (
                    <div
                      key={v.name}
                      onClick={() => !isDep && toggleVar(v.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        background: isChecked ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        cursor: isDep ? 'not-allowed' : 'pointer',
                        opacity: isDep ? 0.4 : 1,
                        fontSize: '12px',
                      }}
                    >
                      {isChecked ? (
                        <CheckSquare size={15} className="text-blue-400 flex-shrink-0" />
                      ) : (
                        <Square size={15} className="text-slate-500 flex-shrink-0" />
                      )}
                      <span style={{ fontWeight: 600, color: '#f8fafc' }}>{v.name}</span>
                      {v.label && (
                        <span style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          — {v.label}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Extra Parameters */}
          {(activeTab === 'validity' || activeTab === 'correlation') && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                Metode Korelasi
              </label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value as any)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', background: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '12px' }}
              >
                <option value="pearson">Pearson (Parametrik)</option>
                <option value="spearman">Spearman Rank (Non-parametrik)</option>
              </select>
            </div>
          )}

          {activeTab === 'validity' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                Kalkulasi Total Skor
              </label>
              <select
                value={scoreType}
                onChange={e => setScoreType(e.target.value as any)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', background: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '12px' }}
              >
                <option value="sum">Penjumlahan Item (Sum)</option>
                <option value="mean">Rata-Rata Item (Mean)</option>
              </select>
            </div>
          )}

          {activeTab === 'correlation' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                Kebijakan Missing Values
              </label>
              <select
                value={missingPolicy}
                onChange={e => setMissingPolicy(e.target.value as any)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', background: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '12px' }}
              >
                <option value="pairwise">Pairwise Deletion (Lapor N per pasangan)</option>
                <option value="listwise">Listwise Deletion (Complete cases)</option>
              </select>
            </div>
          )}

          {activeTab === 'regression' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeDiagnostics}
                  onChange={e => setIncludeDiagnostics(e.target.checked)}
                />
                Sertakan Diagnostik (VIF, Glejser, Breusch-Pagan, Shapiro-Wilk)
              </label>
            </div>
          )}

          {/* Action Run Button */}
          <button
            onClick={handleRunAnalysis}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              background: isLoading ? '#334155' : '#2563eb',
              border: 'none',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '4px',
            }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Jalankan Analisis
          </button>
        </div>

        {/* Right Panel: Analysis Results Display */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Error Message */}
          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5', fontSize: '13px' }}>
              <AlertTriangle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Empty Prompt */}
          {!result && !isLoading && !error && (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#64748b', maxWidth: '400px' }}>
              <BarChart3 size={48} className="mx-auto mb-3 text-slate-600" />
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Siap Melakukan Analisis
              </div>
              <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
                Pilih variabel dari panel kiri, atur parameter pengujian, lalu klik <strong>Jalankan Analisis</strong> untuk melihat hasil statistik terapan.
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8' }}>
              <Loader2 size={36} className="animate-spin mx-auto mb-3 text-blue-400" />
              <div style={{ fontSize: '14px', fontWeight: 500 }}>Memproses perhitungan statistical engine...</div>
            </div>
          )}

          {/* 1. Results: Descriptive */}
          {result && activeTab === 'descriptive' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                Tabel Statistik Deskriptif (N = {result.sample_size})
              </div>
              <div style={{ border: '1px solid #334155', borderRadius: '8px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                      <th style={{ padding: '10px 12px', color: '#f8fafc' }}>Variabel</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>N Valid</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>Missing</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>Mean</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>Std. Deviation</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>Varians</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>Min</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>Max</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>Skewness</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>Kurtosis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((r: any) => (
                      <tr key={r.name} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#38bdf8' }}>{r.name}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{r.n_valid}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: r.n_missing > 0 ? '#f87171' : '#64748b' }}>{r.n_missing}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{r.mean.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{r.std_dev.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{r.variance.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{r.min.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{r.max.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{r.skewness.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{r.kurtosis.formatted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Results: Validity */}
          {result && activeTab === 'validity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                Hasil Uji Validitas Item ({result.method} Correlation, N = {result.sample_size})
              </div>
              <div style={{ border: '1px solid #334155', borderRadius: '8px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                      <th style={{ padding: '10px 12px', color: '#f8fafc' }}>Item Pertanyaan</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>r Total</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>Corrected r</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>Sig. (p-value)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: '#f8fafc' }}>Status Evaluasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((it: any) => (
                      <tr key={it.item} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#38bdf8' }}>{it.item}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{it.r_total.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0', fontWeight: 600 }}>{it.r_corrected.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{it.p_value.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: it.is_valid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: it.is_valid ? '#34d399' : '#f87171',
                              border: it.is_valid ? '1px solid #10b981' : '1px solid #ef4444',
                            }}
                          >
                            {it.is_valid ? 'Valid (r > 0.3)' : 'Perlu Evaluasi'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '12px 14px', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                💡 <strong>Catatan:</strong> {result.interpretation}
              </div>
            </div>
          )}

          {/* 3. Results: Reliability */}
          {result && activeTab === 'reliability' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Cronbach's Alpha (k = {result.item_count} item, N = {result.sample_size})</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#38bdf8' }}>{result.cronbach_alpha.formatted}</div>
                </div>
                <div style={{ padding: '6px 12px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38bdf8', borderRadius: '6px', color: '#38bdf8', fontSize: '12px', fontWeight: 600 }}>
                  Reliabilitas Teruji
                </div>
              </div>

              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                Item-Total Statistics
              </div>
              <div style={{ border: '1px solid #334155', borderRadius: '8px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                      <th style={{ padding: '10px 12px', color: '#f8fafc' }}>Item Dihapus</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>Scale Mean if Deleted</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>Scale Variance if Deleted</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>Corrected Item-Total Corr</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>Cronbach's Alpha if Deleted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.item_deleted_stats.map((it: any) => (
                      <tr key={it.item} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#38bdf8' }}>{it.item}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{it.scale_mean_if_deleted.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{it.scale_var_if_deleted.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{it.corrected_item_total_corr.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#34d399', fontWeight: 600 }}>{it.alpha_if_deleted.formatted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '12px 14px', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                🛡️ <strong>Interpretasi:</strong> {result.interpretation}
              </div>
            </div>
          )}

          {/* 4. Results: Correlation */}
          {result && activeTab === 'correlation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                Matriks Korelasi {result.method} ({result.missing_policy} deletion)
              </div>
              <div style={{ border: '1px solid #334155', borderRadius: '8px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: '#f8fafc' }}>Variabel</th>
                      {result.variables.map((v: string) => (
                        <th key={v} style={{ padding: '10px 12px', color: '#f8fafc' }}>{v}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.variables.map((v1: string) => (
                      <tr key={v1} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#38bdf8', textAlign: 'left' }}>{v1}</td>
                        {result.variables.map((v2: string) => {
                          const cell = result.matrix.find((c: any) => c.var1 === v1 && c.var2 === v2)
                          return (
                            <td key={v2} style={{ padding: '10px 12px', color: '#e2e8f0', background: v1 === v2 ? 'rgba(30, 41, 59, 0.3)' : 'transparent' }}>
                              <div style={{ fontWeight: 600 }}>
                                {cell?.correlation.formatted} {cell?.significance_star}
                              </div>
                              {v1 !== v2 && (
                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                  p = {cell?.p_value.formatted} (N={cell?.n_pairs})
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                * Signifikan pada p &lt; 0.05 • ** Signifikan pada p &lt; 0.01 (2-tailed).
              </div>
            </div>
          )}

          {/* 5. Results: Regression & Diagnostics */}
          {result && activeTab === 'regression' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Model Summary */}
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                Ringkasan Model Regresi OLS (Y = {result.dependent_variable})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>R (Korelasi Berganda)</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{result.r.formatted}</div>
                </div>
                <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>R Square (R²)</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8' }}>{result.r_squared.formatted}</div>
                </div>
                <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Adjusted R²</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{result.adj_r_squared.formatted}</div>
                </div>
                <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Std. Error of Estimate</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{result.std_error_estimate.formatted}</div>
                </div>
                <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>F-Hitung (Sig.)</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#34d399' }}>
                    {result.f_stat.formatted} <span style={{ fontSize: '11px', color: '#94a3b8' }}>({result.p_value_model.formatted})</span>
                  </div>
                </div>
              </div>

              {/* Persamaan Regresi */}
              <div style={{ padding: '10px 14px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '6px', fontSize: '13px', color: '#93c5fd' }}>
                <strong>Persamaan Regresi:</strong> <code>{result.equation}</code>
              </div>

              {/* ANOVA Table */}
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                Tabel ANOVA
              </div>
              <div style={{ border: '1px solid #334155', borderRadius: '8px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                      <th style={{ padding: '8px 12px', color: '#f8fafc' }}>Model</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Sum of Squares</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>df</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Mean Square</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>F</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Sig.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.anova.map((row: any) => (
                      <tr key={row.source} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#38bdf8' }}>{row.source}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{row.sum_of_squares.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{row.df}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{row.mean_square.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{row.f.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{row.p_value.formatted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Coefficients Table */}
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                Tabel Koefisien Regresi
              </div>
              <div style={{ border: '1px solid #334155', borderRadius: '8px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                      <th style={{ padding: '8px 12px', color: '#f8fafc' }}>Model Prediktor</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Unstandardized B</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Std. Error</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Standardized Beta</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>t-Statistik</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Sig. (p)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>95% CI Lower</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>95% CI Upper</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.coefficients.map((c: any) => (
                      <tr key={c.variable} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#38bdf8' }}>{c.variable}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{c.b.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8' }}>{c.std_error.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#34d399', fontWeight: 600 }}>{c.beta.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{c.t.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{c.p_value.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8' }}>{c.ci_lower.formatted}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8' }}>{c.ci_upper.formatted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Diagnostics Section */}
              {result.diagnostics && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                    Diagnostik Asumsi Klasik OLS
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                    {/* Normalitas */}
                    <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
                        1. Normalitas Residual
                      </div>
                      <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                        Uji {result.diagnostics.shapiro_wilk.test_name?.formatted || 'Shapiro-Wilk'}: Stat = {result.diagnostics.shapiro_wilk.statistic?.formatted}, p = {result.diagnostics.shapiro_wilk.p_value?.formatted}
                      </div>
                    </div>

                    {/* Multikolinearitas */}
                    <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
                        2. Multikolinearitas (VIF)
                      </div>
                      <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                        {Object.entries(result.diagnostics.vif).map(([k, v]: [string, any]) => (
                          <div key={k}>{k}: VIF = {v.formatted} ({v.note})</div>
                        ))}
                      </div>
                    </div>

                    {/* Heteroskedastisitas */}
                    <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
                        3. Heteroskedastisitas
                      </div>
                      <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                        Breusch-Pagan: LM = {result.diagnostics.breusch_pagan.lm_stat?.formatted}, p = {result.diagnostics.breusch_pagan.p_value?.formatted}
                      </div>
                    </div>

                    {/* Autokorelasi */}
                    <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
                        4. Autokorelasi
                      </div>
                      <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                        Durbin-Watson = {result.diagnostics.durbin_watson.formatted}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Interpretation */}
              <div style={{ padding: '12px 14px', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                📈 <strong>Interpretasi Model:</strong> {result.interpretation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

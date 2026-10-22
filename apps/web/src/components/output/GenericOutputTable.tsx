import { useRef, useState } from 'react'
import { Copy, Check, Info, AlertTriangle } from 'lucide-react'
import { AnalysisOutput } from '@/types'

export interface GenericOutputTableProps {
  output: AnalysisOutput
}

export function GenericOutputTable({ output }: GenericOutputTableProps) {
  const [copied, setCopied] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)

  const handleCopyTable = async () => {
    if (!tableRef.current) return
    try {
      const text = tableRef.current.innerText
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const { analysis_type, results, interpretation, warnings } = output

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Action: Copy Table */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button
          type="button"
          onClick={handleCopyTable}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(51, 65, 85, 0.5)',
            border: copied ? '1px solid #10b981' : '1px solid #475569',
            color: copied ? '#34d399' : '#cbd5e1',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Tabel Tersalin!' : 'Salin Tabel (TSV)'}</span>
        </button>
      </div>

      <div ref={tableRef} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Warnings if any */}
        {warnings && warnings.length > 0 && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid #f59e0b',
              color: '#fbbf24',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              <AlertTriangle size={15} />
              <span>Catatan / Peringatan Metodologis:</span>
            </div>
            {warnings.map((w, idx) => (
              <div key={idx} style={{ paddingLeft: '22px' }}>• {w}</div>
            ))}
          </div>
        )}

        {/* 1. DESCRIPTIVE */}
        {analysis_type === 'descriptive' && results?.results && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
              Descriptive Statistics (N = {results.sample_size})
            </div>
            <div style={{ border: '1px solid #334155', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '8px 12px', color: '#f8fafc' }}>Variabel</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>N Valid</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Missing</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Mean</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Median</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Mode</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Std Dev</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Variance</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Std Error</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Min</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Max</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Skewness</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Kurtosis</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.map((r: any) => (
                    <tr key={r.name} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#38bdf8' }}>{r.name}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{r.n_valid}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8' }}>{r.n_missing}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0', fontWeight: 600 }}>{r.mean.formatted}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{r.median.formatted}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{r.mode.formatted}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{r.std_dev.formatted}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{r.variance.formatted}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8' }}>{r.sem.formatted}</td>
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

        {/* 2. VALIDITY */}
        {analysis_type === 'validity' && results?.items && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
              Item-Total Validity ({results.method?.toUpperCase()} Correlation, N = {results.sample_size})
            </div>
            <div style={{ border: '1px solid #334155', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '10px 12px', color: '#f8fafc' }}>Item Indikator</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>r-Hitung Total</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>Corrected r-Total</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f8fafc' }}>Sig. (p-value)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#f8fafc' }}>Status Evaluasi</th>
                  </tr>
                </thead>
                <tbody>
                  {results.items.map((it: any) => (
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
                          {it.is_valid ? 'Valid (r > 0.3)' : 'Gugur / Perlu Evaluasi'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. RELIABILITY */}
        {analysis_type === 'reliability' && results?.cronbach_alpha && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>Cronbach's Alpha (k = {results.item_count} item, N = {results.sample_size})</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#38bdf8' }}>{results.cronbach_alpha.formatted}</div>
              </div>
              <div style={{ padding: '6px 12px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38bdf8', borderRadius: '6px', color: '#38bdf8', fontSize: '12px', fontWeight: 600 }}>
                {parseFloat(results.cronbach_alpha.formatted) >= 0.70 ? 'Tinggi / Sangat Reliabel' : parseFloat(results.cronbach_alpha.formatted) >= 0.60 ? 'Cukup Reliabel' : 'Rendah / Kurang Reliabel'}
              </div>
            </div>

            {results.item_deleted_stats && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                  Item-Total Statistics
                </div>
                <div style={{ border: '1px solid #334155', borderRadius: '8px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '8px 12px', color: '#f8fafc' }}>Item Dihapus</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Scale Mean if Deleted</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Scale Variance if Deleted</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Corrected Item-Total Corr</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>Cronbach's Alpha if Deleted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.item_deleted_stats.map((it: any) => (
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
              </div>
            )}
          </div>
        )}

        {/* 4. CORRELATION */}
        {analysis_type === 'correlation' && results?.matrix && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
              Correlations Matrix ({results.method?.toUpperCase()}, Missing: {results.missing_policy})
            </div>
            <div style={{ border: '1px solid #334155', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#f8fafc' }}>Variabel</th>
                    {results.variables.map((v: string) => (
                      <th key={v} style={{ padding: '8px 12px', color: '#f8fafc' }}>{v}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.variables.map((v1: string) => (
                    <tr key={v1} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#38bdf8', textAlign: 'left' }}>{v1}</td>
                      {results.variables.map((v2: string) => {
                        const cell = results.matrix.find((c: any) => c.var1 === v1 && c.var2 === v2)
                        return (
                          <td key={v2} style={{ padding: '8px 12px', color: '#e2e8f0', background: v1 === v2 ? 'rgba(30, 41, 59, 0.3)' : 'transparent' }}>
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

        {/* 5. REGRESSION */}
        {analysis_type === 'regression' && results?.r_squared && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Model Summary Cards */}
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
              Model Summary (Variabel Dependen Y = {results.dependent_variable})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>R (Korelasi Berganda)</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{results.r.formatted}</div>
              </div>
              <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>R Square (R²)</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8' }}>{results.r_squared.formatted}</div>
              </div>
              <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Adjusted R²</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{results.adj_r_squared.formatted}</div>
              </div>
              <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Std. Error of Estimate</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{results.std_error_estimate.formatted}</div>
              </div>
              <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>F-Hitung (Sig.)</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#34d399' }}>
                  {results.f_stat.formatted} <span style={{ fontSize: '11px', color: '#94a3b8' }}>({results.p_value_model.formatted})</span>
                </div>
              </div>
            </div>

            {/* Regression Equation */}
            {results.equation && (
              <div style={{ padding: '10px 14px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '6px', fontSize: '13px', color: '#93c5fd' }}>
                <strong>Persamaan Regresi OLS:</strong> <code>{results.equation}</code>
              </div>
            )}

            {/* ANOVA */}
            {results.anova && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>Tabel ANOVA</div>
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
                      {results.anova.map((row: any) => (
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
              </div>
            )}

            {/* Coefficients */}
            {results.coefficients && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>Tabel Koefisien Regresi</div>
                <div style={{ border: '1px solid #334155', borderRadius: '8px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '8px 12px', color: '#f8fafc' }}>Prediktor</th>
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
                      {results.coefficients.map((c: any) => (
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
              </div>
            )}

            {/* Diagnostics Cards */}
            {results.diagnostics && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                  Diagnostik Asumsi Klasik OLS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
                      1. Normalitas Residual
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                      Uji {results.diagnostics.shapiro_wilk.test_name?.formatted || 'Shapiro-Wilk'}: Stat = {results.diagnostics.shapiro_wilk.statistic?.formatted}, p = {results.diagnostics.shapiro_wilk.p_value?.formatted}
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
                      2. Multikolinearitas (VIF)
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                      {Object.entries(results.diagnostics.vif).map(([k, v]: [string, any]) => (
                        <div key={k}>{k}: VIF = {v.formatted} ({v.note})</div>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
                      3. Heteroskedastisitas
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                      Breusch-Pagan: LM = {results.diagnostics.breusch_pagan.lm_stat?.formatted}, p = {results.diagnostics.breusch_pagan.p_value?.formatted}
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
                      4. Autokorelasi
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                      Durbin-Watson = {results.diagnostics.durbin_watson.formatted}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. DIAGNOSTICS DEDICATED */}
        {analysis_type === 'diagnostics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
              Uji Asumsi Klasik Regresi OLS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              {results.shapiro_wilk && (
                <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
                    1. Normalitas Residual
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                    Stat = {results.shapiro_wilk.statistic?.formatted}, p = {results.shapiro_wilk.p_value?.formatted}
                  </div>
                </div>
              )}
              {results.vif && (
                <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
                    2. Multikolinearitas (VIF)
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                    {Object.entries(results.vif).map(([k, v]: [string, any]) => (
                      <div key={k}>{k}: VIF = {v.formatted} ({v.note})</div>
                    ))}
                  </div>
                </div>
              )}
              {results.breusch_pagan && (
                <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
                    3. Heteroskedastisitas
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                    LM = {results.breusch_pagan.lm_stat?.formatted}, p = {results.breusch_pagan.p_value?.formatted}
                  </div>
                </div>
              )}
              {results.durbin_watson && (
                <div style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
                    4. Autokorelasi
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                    Durbin-Watson = {results.durbin_watson.formatted}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interpretasi Otomatis Bahasa Indonesia */}
        {interpretation && (
          <div
            style={{
              padding: '14px 16px',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#cbd5e1',
              lineHeight: 1.6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
              <Info size={15} />
              <span>Interpretasi Statistik (Bahasa Indonesia):</span>
            </div>
            <div>{interpretation}</div>
          </div>
        )}
      </div>
    </div>
  )
}

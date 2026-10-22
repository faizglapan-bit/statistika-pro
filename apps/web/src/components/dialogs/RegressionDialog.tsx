import { useState } from 'react'
import { ChevronRight, Hash } from 'lucide-react'
import { VariableDefinition, AnalysisOutput } from '@/types'
import { AnalysisDialogShell } from './AnalysisDialogShell'
import * as analysisApi from '@/services/analysisApi'
import * as outputApi from '@/services/outputApi'

export interface RegressionDialogProps {
  isOpen: boolean
  onClose: () => void
  datasetId: string | null
  datasetName: string
  datasetUpdatedAt?: string | null
  variables: VariableDefinition[]
  onSuccess: (output: AnalysisOutput) => void
}

export function RegressionDialog({
  isOpen,
  onClose,
  datasetId,
  datasetName,
  datasetUpdatedAt,
  variables,
  onSuccess,
}: RegressionDialogProps) {
  const [dependentVar, setDependentVar] = useState<string | null>(null)
  const [independentVars, setIndependentVars] = useState<string[]>([])
  const [highlightedAvailable, setHighlightedAvailable] = useState<string | null>(null)
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true)
  const [includeIntercept, setIncludeIntercept] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Filter available numeric variables not yet assigned to Y or X
  const availableVars = variables.filter(v => {
    if (v.type !== 'numeric') return false
    if (v.name === dependentVar) return false
    if (independentVars.includes(v.name)) return false
    return true
  })

  const handleReset = () => {
    setDependentVar(null)
    setIndependentVars([])
    setHighlightedAvailable(null)
    setIncludeDiagnostics(true)
    setIncludeIntercept(true)
    setErrorMessage(null)
  }

  const handleSetDependent = () => {
    if (!highlightedAvailable) return
    setDependentVar(highlightedAvailable)
    setHighlightedAvailable(null)
  }

  const handleRemoveDependent = () => {
    setDependentVar(null)
  }

  const handleAddIndependent = () => {
    if (!highlightedAvailable) return
    setIndependentVars([...independentVars, highlightedAvailable])
    setHighlightedAvailable(null)
  }

  const handleRemoveIndependent = (varName: string) => {
    setIndependentVars(independentVars.filter(n => n !== varName))
  }

  const handleRun = async () => {
    if (!datasetId) {
      setErrorMessage('Dataset belum tersimpan ke server. Silakan simpan dataset terlebih dahulu.')
      return
    }
    if (!dependentVar) {
      setErrorMessage('Pilih satu variabel dependen (Y).')
      return
    }
    if (independentVars.length === 0) {
      setErrorMessage('Pilih minimal satu variabel independen (X).')
      return
    }

    setIsRunning(true)
    setErrorMessage(null)

    try {
      const res = await analysisApi.runRegression(
        datasetId,
        dependentVar,
        independentVars,
        includeDiagnostics,
        0.95
      )
      const saved = await outputApi.saveOutput({
        title: `Regresi Linear OLS (Y = ${dependentVar})`,
        analysis_type: 'regression',
        dataset_id: datasetId,
        dataset_name: datasetName,
        dataset_updated_at: datasetUpdatedAt,
        sample_size: res.sample_size,
        variables: [dependentVar, ...independentVars],
        parameters: {
          dependent_variable: dependentVar,
          independent_variables: independentVars,
          include_intercept: includeIntercept,
          include_diagnostics: includeDiagnostics,
        },
        results: res,
        warnings: res.warnings || [],
        interpretation: res.interpretation,
      })
      onClose()
      onSuccess(saved)
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengestimasi regresi OLS.')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <AnalysisDialogShell
      isOpen={isOpen}
      title="Regresi Linear Berganda (OLS)"
      subtitle="Estimasi model Ordinary Least Squares, tabel ANOVA, koefisien standar (Beta), dan uji asumsi klasik"
      datasetId={datasetId}
      datasetName={datasetName}
      variables={variables}
      onClose={onClose}
      onRun={handleRun}
      onReset={handleReset}
      isRunning={isRunning}
      errorMessage={errorMessage}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1.2fr', gap: '12px', alignItems: 'stretch' }}>
        {/* Left: Available Variables */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '280px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
            Variabel Numerik ({availableVars.length})
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              overflowY: 'auto',
              padding: '4px',
            }}
          >
            {availableVars.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                Semua variabel telah dipilih.
              </div>
            ) : (
              availableVars.map(v => {
                const isSelected = highlightedAvailable === v.name
                return (
                  <div
                    key={v.name}
                    onClick={() => setHighlightedAvailable(v.name)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '4px',
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                      border: isSelected ? '1px solid #3b82f6' : '1px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                  >
                    <Hash size={13} className="text-blue-400 flex-shrink-0" />
                    <span style={{ fontWeight: 600 }}>{v.name}</span>
                    {v.label && (
                      <span style={{ color: '#94a3b8', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        [{v.label}]
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Center: Action Arrows */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleSetDependent}
            disabled={!highlightedAvailable}
            title="Pindahkan ke Variabel Dependen (Y)"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: highlightedAvailable ? '#2563eb' : '#1e293b',
              border: '1px solid #475569',
              color: highlightedAvailable ? '#fff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: highlightedAvailable ? 'pointer' : 'not-allowed',
            }}
          >
            <ChevronRight size={16} />
          </button>

          <button
            type="button"
            onClick={handleAddIndependent}
            disabled={!highlightedAvailable}
            title="Pindahkan ke Variabel Independen (X)"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: highlightedAvailable ? '#2563eb' : '#1e293b',
              border: '1px solid #475569',
              color: highlightedAvailable ? '#fff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: highlightedAvailable ? 'pointer' : 'not-allowed',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Right: Dependent & Independent Target Boxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '280px' }}>
          {/* Target 1: Dependent Variable (Y) */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '80px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
              Variabel Dependen (Y)
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {dependentVar ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Hash size={13} className="text-blue-400" />
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>{dependentVar}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveDependent}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Hapus
                  </button>
                </>
              ) : (
                <span style={{ color: '#64748b', fontSize: '11px' }}>Pilih satu variabel Y di kiri</span>
              )}
            </div>
          </div>

          {/* Target 2: Independent Variables (X) */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
              Variabel Independen (X) ({independentVars.length})
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                overflowY: 'auto',
                padding: '4px',
              }}
            >
              {independentVars.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '11px' }}>
                  Pilih prediktor X di kiri lalu klik &gt;.
                </div>
              ) : (
                independentVars.map(name => (
                  <div
                    key={name}
                    style={{
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: '4px',
                      background: 'rgba(30, 41, 59, 0.4)',
                      marginBottom: '2px',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>{name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIndependent(name)}
                      style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '11px', cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Regression Parameters & Diagnostics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px solid #334155' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>Opsi Model &amp; Diagnostik:</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeDiagnostics}
              onChange={e => setIncludeDiagnostics(e.target.checked)}
            />
            <span>Sertakan Uji Asumsi Klasik (VIF, Glejser, Breusch-Pagan, Shapiro-Wilk)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeIntercept}
              onChange={e => setIncludeIntercept(e.target.checked)}
            />
            <span>Sertakan Konstanta Model (Intercept $\beta_0$)</span>
          </label>
        </div>
      </div>
    </AnalysisDialogShell>
  )
}

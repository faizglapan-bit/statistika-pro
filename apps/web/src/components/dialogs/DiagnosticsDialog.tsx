import { useState } from 'react'
import { ChevronRight, Hash } from 'lucide-react'
import { VariableDefinition, AnalysisOutput } from '@/types'
import { AnalysisDialogShell } from './AnalysisDialogShell'
import * as analysisApi from '@/services/analysisApi'
import * as outputApi from '@/services/outputApi'

export interface DiagnosticsDialogProps {
  isOpen: boolean
  onClose: () => void
  datasetId: string | null
  datasetName: string
  datasetUpdatedAt?: string | null
  variables: VariableDefinition[]
  onSuccess: (output: AnalysisOutput) => void
}

export function DiagnosticsDialog({
  isOpen,
  onClose,
  datasetId,
  datasetName,
  datasetUpdatedAt,
  variables,
  onSuccess,
}: DiagnosticsDialogProps) {
  const [dependentVar, setDependentVar] = useState<string | null>(null)
  const [independentVars, setIndependentVars] = useState<string[]>([])
  const [highlightedAvailable, setHighlightedAvailable] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
    setErrorMessage(null)
  }

  const handleSetDependent = () => {
    if (!highlightedAvailable) return
    setDependentVar(highlightedAvailable)
    setHighlightedAvailable(null)
  }

  const handleAddIndependent = () => {
    if (!highlightedAvailable) return
    setIndependentVars([...independentVars, highlightedAvailable])
    setHighlightedAvailable(null)
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
      const res = await analysisApi.runDiagnostics(datasetId, dependentVar, independentVars)
      const saved = await outputApi.saveOutput({
        title: `Uji Asumsi Klasik OLS (Y = ${dependentVar})`,
        analysis_type: 'diagnostics',
        dataset_id: datasetId,
        dataset_name: datasetName,
        dataset_updated_at: datasetUpdatedAt,
        sample_size: 0,
        variables: [dependentVar, ...independentVars],
        parameters: { dependent_variable: dependentVar, independent_variables: independentVars },
        results: res,
        warnings: res.warnings || [],
        interpretation: res.interpretation,
      })
      onClose()
      onSuccess(saved)
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses uji asumsi klasik.')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <AnalysisDialogShell
      isOpen={isOpen}
      title="Uji Asumsi Klasik Regresi OLS"
      subtitle="Pengujian Normalitas Residual (Shapiro-Wilk), Multikolinearitas (VIF), Heteroskedastisitas (Breusch-Pagan & Glejser), dan Autokorelasi (Durbin-Watson)"
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '260px' }}>
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
            {availableVars.map(v => (
              <div
                key={v.name}
                onClick={() => setHighlightedAvailable(v.name)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '4px',
                  backgroundColor: highlightedAvailable === v.name ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                  border: highlightedAvailable === v.name ? '1px solid #3b82f6' : '1px solid transparent',
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
                {v.label && <span style={{ color: '#94a3b8', fontSize: '11px' }}>[{v.label}]</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Center: Transfer Arrows */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleSetDependent}
            disabled={!highlightedAvailable}
            title="Set sebagai Variabel Dependen (Y)"
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
            title="Tambah ke Variabel Independen (X)"
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

        {/* Right: Targets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '260px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '70px' }}>
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
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>{dependentVar}</span>
                  <button
                    type="button"
                    onClick={() => setDependentVar(null)}
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
              {independentVars.map(name => (
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
                    onClick={() => setIndependentVars(independentVars.filter(n => n !== name))}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '11px', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AnalysisDialogShell>
  )
}

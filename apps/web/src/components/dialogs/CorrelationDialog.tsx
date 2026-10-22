import { useState } from 'react'
import { VariableDefinition, AnalysisOutput } from '@/types'
import { AnalysisDialogShell } from './AnalysisDialogShell'
import { VariableTransferBox } from './VariableTransferBox'
import * as analysisApi from '@/services/analysisApi'
import * as outputApi from '@/services/outputApi'

export interface CorrelationDialogProps {
  isOpen: boolean
  onClose: () => void
  datasetId: string | null
  datasetName: string
  datasetUpdatedAt?: string | null
  variables: VariableDefinition[]
  onSuccess: (output: AnalysisOutput) => void
}

export function CorrelationDialog({
  isOpen,
  onClose,
  datasetId,
  datasetName,
  datasetUpdatedAt,
  variables,
  onSuccess,
}: CorrelationDialogProps) {
  const [selectedVars, setSelectedVars] = useState<string[]>([])
  const [method, setMethod] = useState<'pearson' | 'spearman'>('pearson')
  const [missingPolicy, setMissingPolicy] = useState<'pairwise' | 'listwise'>('pairwise')
  const [isRunning, setIsRunning] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleReset = () => {
    setSelectedVars([])
    setMethod('pearson')
    setMissingPolicy('pairwise')
    setErrorMessage(null)
  }

  const handleRun = async () => {
    if (!datasetId) {
      setErrorMessage('Dataset belum tersimpan ke server. Silakan simpan dataset terlebih dahulu.')
      return
    }
    if (selectedVars.length < 2) {
      setErrorMessage('Pilih minimal dua variabel untuk membentuk matriks korelasi.')
      return
    }

    setIsRunning(true)
    setErrorMessage(null)

    try {
      const res = await analysisApi.runCorrelation(datasetId, selectedVars, method, missingPolicy)
      const saved = await outputApi.saveOutput({
        title: `Matriks Korelasi ${method === 'pearson' ? 'Pearson' : 'Spearman'} (${selectedVars.length} variabel)`,
        analysis_type: 'correlation',
        dataset_id: datasetId,
        dataset_name: datasetName,
        dataset_updated_at: datasetUpdatedAt,
        sample_size: res.matrix?.[0]?.n_pairs || 0,
        variables: selectedVars,
        parameters: { method, missing_policy: missingPolicy },
        results: res,
        warnings: res.warnings || [],
        interpretation: `Matriks korelasi bivariat ${method.toUpperCase()} dihitung untuk ${selectedVars.join(', ')} menggunakan kebijakan ${missingPolicy} deletion.`,
      })
      onClose()
      onSuccess(saved)
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses korelasi.')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <AnalysisDialogShell
      isOpen={isOpen}
      title="Matriks Korelasi Bivariat"
      subtitle="Korelasi Pearson atau Spearman rank dengan p-value 2-tailed dan tanda signifikansi"
      datasetId={datasetId}
      datasetName={datasetName}
      variables={variables}
      onClose={onClose}
      onRun={handleRun}
      onReset={handleReset}
      isRunning={isRunning}
      errorMessage={errorMessage}
    >
      <VariableTransferBox
        allVariables={variables}
        selectedVarNames={selectedVars}
        onChangeSelected={setSelectedVars}
        targetTitle="Variabel Analisis"
        onlyNumeric={true}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px solid #334155' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
            Koefisien Korelasi
          </label>
          <select
            value={method}
            onChange={e => setMethod(e.target.value as any)}
            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '12px' }}
          >
            <option value="pearson">Pearson (Data Interval / Rasio)</option>
            <option value="spearman">Spearman Rank (Data Ordinal / Non-parametrik)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
            Penanganan Missing Values
          </label>
          <select
            value={missingPolicy}
            onChange={e => setMissingPolicy(e.target.value as any)}
            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '12px' }}
          >
            <option value="pairwise">Exclude cases pairwise (Lapor N per pasangan)</option>
            <option value="listwise">Exclude cases listwise (Kasus lengkap saja)</option>
          </select>
        </div>
      </div>
    </AnalysisDialogShell>
  )
}

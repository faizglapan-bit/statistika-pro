import { useState } from 'react'
import { VariableDefinition, AnalysisOutput } from '@/types'
import { AnalysisDialogShell } from './AnalysisDialogShell'
import { VariableTransferBox } from './VariableTransferBox'
import * as analysisApi from '@/services/analysisApi'
import * as outputApi from '@/services/outputApi'

export interface DescriptiveDialogProps {
  isOpen: boolean
  onClose: () => void
  datasetId: string | null
  datasetName: string
  datasetUpdatedAt?: string | null
  variables: VariableDefinition[]
  onSuccess: (output: AnalysisOutput) => void
}

export function DescriptiveDialog({
  isOpen,
  onClose,
  datasetId,
  datasetName,
  datasetUpdatedAt,
  variables,
  onSuccess,
}: DescriptiveDialogProps) {
  const [selectedVars, setSelectedVars] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleReset = () => {
    setSelectedVars([])
    setErrorMessage(null)
  }

  const handleRun = async () => {
    if (!datasetId) {
      setErrorMessage('Dataset belum tersimpan ke server. Silakan simpan dataset terlebih dahulu.')
      return
    }
    if (selectedVars.length === 0) {
      setErrorMessage('Pilih minimal satu variabel numerik untuk analisis deskriptif.')
      return
    }

    setIsRunning(true)
    setErrorMessage(null)

    try {
      const res = await analysisApi.runDescriptive(datasetId, selectedVars)
      const saved = await outputApi.saveOutput({
        title: `Statistik Deskriptif (${selectedVars.join(', ')})`,
        analysis_type: 'descriptive',
        dataset_id: datasetId,
        dataset_name: datasetName,
        dataset_updated_at: datasetUpdatedAt,
        sample_size: res.sample_size,
        variables: selectedVars,
        parameters: { method: 'descriptive' },
        results: res,
        warnings: res.warnings || [],
        interpretation: `Analisis deskriptif dihitung dari ${res.sample_size} observasi untuk variabel: ${selectedVars.join(', ')}.`,
      })
      onClose()
      onSuccess(saved)
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses statistik deskriptif.')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <AnalysisDialogShell
      isOpen={isOpen}
      title="Statistik Deskriptif"
      subtitle="Analisis tendensi sentral, dispersi sampel, dan bentuk distribusi data"
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
      <div style={{ fontSize: '11px', color: '#94a3b8', background: '#0f172a', padding: '10px 12px', borderRadius: '6px', border: '1px solid #334155' }}>
        💡 <strong>Output yang dihasilkan:</strong> N Valid, N Missing, Mean, Median, Mode, Std Deviation, Variance ($ddof=1$), Std Error of Mean (SEM), Minimum, Maximum, Skewness, dan Kurtosis.
      </div>
    </AnalysisDialogShell>
  )
}

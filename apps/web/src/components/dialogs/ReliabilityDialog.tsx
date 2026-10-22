import { useState } from 'react'
import { VariableDefinition, AnalysisOutput } from '@/types'
import { AnalysisDialogShell } from './AnalysisDialogShell'
import { VariableTransferBox } from './VariableTransferBox'
import * as analysisApi from '@/services/analysisApi'
import * as outputApi from '@/services/outputApi'

export interface ReliabilityDialogProps {
  isOpen: boolean
  onClose: () => void
  datasetId: string | null
  datasetName: string
  datasetUpdatedAt?: string | null
  variables: VariableDefinition[]
  onSuccess: (output: AnalysisOutput) => void
}

export function ReliabilityDialog({
  isOpen,
  onClose,
  datasetId,
  datasetName,
  datasetUpdatedAt,
  variables,
  onSuccess,
}: ReliabilityDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleReset = () => {
    setSelectedItems([])
    setErrorMessage(null)
  }

  const handleRun = async () => {
    if (!datasetId) {
      setErrorMessage('Dataset belum tersimpan ke server. Silakan simpan dataset terlebih dahulu.')
      return
    }
    if (selectedItems.length < 2) {
      setErrorMessage('Pilih minimal dua item indikator untuk menguji reliabilitas Cronbach\'s Alpha.')
      return
    }

    setIsRunning(true)
    setErrorMessage(null)

    try {
      const res = await analysisApi.runReliability(datasetId, selectedItems)
      const saved = await outputApi.saveOutput({
        title: `Uji Reliabilitas Cronbach's Alpha (${selectedItems.length} item)`,
        analysis_type: 'reliability',
        dataset_id: datasetId,
        dataset_name: datasetName,
        dataset_updated_at: datasetUpdatedAt,
        sample_size: res.sample_size,
        variables: selectedItems,
        parameters: { method: 'cronbach_alpha' },
        results: res,
        warnings: res.warnings || [],
        interpretation: res.interpretation,
      })
      onClose()
      onSuccess(saved)
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses reliabilitas.')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <AnalysisDialogShell
      isOpen={isOpen}
      title="Uji Reliabilitas (Cronbach's Alpha)"
      subtitle="Evaluasi konsistensi internal skala kuesioner dan tabel Item-Total Statistics if deleted"
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
        selectedVarNames={selectedItems}
        onChangeSelected={setSelectedItems}
        targetTitle="Item Indikator"
        onlyNumeric={true}
      />

      <div style={{ fontSize: '11px', color: '#94a3b8', background: '#0f172a', padding: '10px 12px', borderRadius: '6px', border: '1px solid #334155' }}>
        🛡️ <strong>Kriteria Reliabilitas:</strong> Nilai Cronbach's Alpha &gt; 0.60 (atau &gt; 0.70) mengindikasikan instrumen reliabel. Tabel <em>Item-Total Statistics</em> menunjukkan potensi kenaikan Alpha jika suatu item dihapus.
      </div>
    </AnalysisDialogShell>
  )
}

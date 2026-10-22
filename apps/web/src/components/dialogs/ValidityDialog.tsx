import { useState } from 'react'
import { VariableDefinition, AnalysisOutput } from '@/types'
import { AnalysisDialogShell } from './AnalysisDialogShell'
import { VariableTransferBox } from './VariableTransferBox'
import * as analysisApi from '@/services/analysisApi'
import * as outputApi from '@/services/outputApi'

export interface ValidityDialogProps {
  isOpen: boolean
  onClose: () => void
  datasetId: string | null
  datasetName: string
  datasetUpdatedAt?: string | null
  variables: VariableDefinition[]
  onSuccess: (output: AnalysisOutput) => void
}

export function ValidityDialog({
  isOpen,
  onClose,
  datasetId,
  datasetName,
  datasetUpdatedAt,
  variables,
  onSuccess,
}: ValidityDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [method, setMethod] = useState<'pearson' | 'spearman'>('pearson')
  const [scoreType, setScoreType] = useState<'sum' | 'mean'>('sum')
  const [isRunning, setIsRunning] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleReset = () => {
    setSelectedItems([])
    setMethod('pearson')
    setScoreType('sum')
    setErrorMessage(null)
  }

  const handleRun = async () => {
    if (!datasetId) {
      setErrorMessage('Dataset belum tersimpan ke server. Silakan simpan dataset terlebih dahulu.')
      return
    }
    if (selectedItems.length < 2) {
      setErrorMessage('Pilih minimal dua item kuesioner untuk menguji validitas instrumen.')
      return
    }

    setIsRunning(true)
    setErrorMessage(null)

    try {
      const res = await analysisApi.runValidity(datasetId, selectedItems, method, scoreType)
      const saved = await outputApi.saveOutput({
        title: `Uji Validitas Item (${selectedItems.length} item - ${method.toUpperCase()})`,
        analysis_type: 'validity',
        dataset_id: datasetId,
        dataset_name: datasetName,
        dataset_updated_at: datasetUpdatedAt,
        sample_size: res.sample_size,
        variables: selectedItems,
        parameters: { method, score_type: scoreType },
        results: res,
        warnings: res.warnings || [],
        interpretation: res.interpretation,
      })
      onClose()
      onSuccess(saved)
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses uji validitas item.')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <AnalysisDialogShell
      isOpen={isOpen}
      title="Uji Validitas Item Instrumen"
      subtitle="Korelasi Item-Total dan Corrected Item-Total correlation untuk menguji kelayakan butir angket"
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
        targetTitle="Item Kuesioner"
        onlyNumeric={true}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px solid #334155' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
            Metode Korelasi
          </label>
          <select
            value={method}
            onChange={e => setMethod(e.target.value as any)}
            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '12px' }}
          >
            <option value="pearson">Pearson Product Moment (Parametrik)</option>
            <option value="spearman">Spearman Rank (Non-parametrik)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
            Kalkulasi Total Skor
          </label>
          <select
            value={scoreType}
            onChange={e => setScoreType(e.target.value as any)}
            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '12px' }}
          >
            <option value="sum">Penjumlahan Item (Sum)</option>
            <option value="mean">Rata-Rata Item (Mean)</option>
          </select>
        </div>
      </div>
    </AnalysisDialogShell>
  )
}

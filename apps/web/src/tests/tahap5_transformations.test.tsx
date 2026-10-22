import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ComputeVariableModal } from '../components/dialogs/transform/ComputeVariableModal'
import { ReverseScoreModal } from '../components/dialogs/transform/ReverseScoreModal'
import { FilterCasesModal } from '../components/dialogs/cases/FilterCasesModal'
import { VariableDefinition } from '../types'

const mockVariables: VariableDefinition[] = [
  { name: 'Q1', type: 'numeric', width: 8, decimals: 0, label: 'Item 1', values: {}, missing: [], measure: 'scale' },
  { name: 'Q2', type: 'numeric', width: 8, decimals: 0, label: 'Item 2', values: {}, missing: [], measure: 'scale' },
  { name: 'Q3', type: 'numeric', width: 8, decimals: 0, label: 'Item 3', values: {}, missing: [], measure: 'scale' },
]

describe('Tahap 5 — Transformasi Data & Case Management Dialogs', () => {
  it('merender ComputeVariableModal dengan form target variable dan keypad fungsi', () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()

    render(
      <ComputeVariableModal
        isOpen={true}
        onClose={onClose}
        datasetId="test-ds"
        variables={mockVariables}
        onSuccess={onSuccess}
      />
    )

    expect(screen.getByText('Hitung Variabel Baru (Compute Variable)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('misal: TOTAL_X, RERATA_Y')).toBeInTheDocument()
    expect(screen.getByText('Q1')).toBeInTheDocument()
    expect(screen.getByText('MEAN()')).toBeInTheDocument()

    // Klik tombol Q1 untuk menyisipkan ke ekspresi
    fireEvent.click(screen.getByText('Q1'))
    const textarea = screen.getByPlaceholderText(/Contoh: Q1 \+ Q2/i) as HTMLTextAreaElement
    expect(textarea.value).toContain('Q1')
  })

  it('merender ReverseScoreModal dengan konfigurasi rentang skala dan item kuesioner', () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()

    render(
      <ReverseScoreModal
        isOpen={true}
        onClose={onClose}
        datasetId="test-ds"
        variables={mockVariables}
        onSuccess={onSuccess}
      />
    )

    expect(screen.getByText('Pembalikan Skor Item (Reverse Scoring)')).toBeInTheDocument()
    expect(screen.getByText(/Pilih Item yang Dibalikkan Skornya/i)).toBeInTheDocument()
    expect(screen.getByText('Q1')).toBeInTheDocument()
    expect(screen.getByText('Q2')).toBeInTheDocument()
  })

  it('merender FilterCasesModal dengan mode filter sementara dan buat dataset baru', () => {
    const onClose = vi.fn()
    const onApply = vi.fn()

    render(
      <FilterCasesModal
        isOpen={true}
        onClose={onClose}
        datasetId="test-ds"
        variables={mockVariables}
        onApplyFilter={onApply}
      />
    )

    expect(screen.getByText(/Saring \/ Pilih Kasus/i)).toBeInTheDocument()
    expect(screen.getByText(/Filter Sementara/i)).toBeInTheDocument()
    expect(screen.getByText(/Buat Dataset Baru/i)).toBeInTheDocument()
    expect(screen.getByText('⚡ Uji Kondisi Filter')).toBeInTheDocument()
  })
})

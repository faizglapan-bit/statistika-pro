import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DescriptiveDialog } from '../components/dialogs/DescriptiveDialog'
import { RegressionDialog } from '../components/dialogs/RegressionDialog'
import { VariableDefinition } from '../types'

const mockVariables: VariableDefinition[] = [
  {
    name: 'X1',
    type: 'numeric',
    width: 8,
    decimals: 2,
    label: 'Disiplin Kerja',
    values: {},
    missing: [],
    measure: 'scale',
  },
  {
    name: 'X2',
    type: 'numeric',
    width: 8,
    decimals: 2,
    label: 'Motivasi',
    values: {},
    missing: [],
    measure: 'scale',
  },
  {
    name: 'Y',
    type: 'numeric',
    width: 8,
    decimals: 2,
    label: 'Kinerja',
    values: {},
    missing: [],
    measure: 'scale',
  },
]

describe('DescriptiveDialog Component', () => {
  it('merender dialog statistik deskriptif dan daftar variabel numerik', () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()

    render(
      <DescriptiveDialog
        isOpen={true}
        onClose={onClose}
        datasetId="test-dataset"
        datasetName="Dataset Karyawan"
        variables={mockVariables}
        onSuccess={onSuccess}
      />
    )

    expect(screen.getByText('Statistik Deskriptif')).toBeInTheDocument()
    expect(screen.getByText('Dataset Karyawan')).toBeInTheDocument()
    expect(screen.getByText('X1')).toBeInTheDocument()
    expect(screen.getByText('X2')).toBeInTheDocument()
    expect(screen.getByText('Y')).toBeInTheDocument()
  })

  it('memindahkan variabel ke target saat di-double-click dan dapat direset', () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()

    render(
      <DescriptiveDialog
        isOpen={true}
        onClose={onClose}
        datasetId="test-dataset"
        datasetName="Dataset Karyawan"
        variables={mockVariables}
        onSuccess={onSuccess}
      />
    )

    // Double click X1 to transfer to target
    const x1Item = screen.getByText('X1')
    fireEvent.doubleClick(x1Item)

    // Now target has 1 var
    expect(screen.getByText(/Variabel Analisis \(1\)/i)).toBeInTheDocument()

    // Click Reset
    const resetButton = screen.getByRole('button', { name: /Reset/i })
    fireEvent.click(resetButton)

    // Target returns to 0
    expect(screen.getByText(/Variabel Analisis \(0\)/i)).toBeInTheDocument()
  })

  it('menolak eksekusi jika belum ada variabel yang dipilih', async () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()

    render(
      <DescriptiveDialog
        isOpen={true}
        onClose={onClose}
        datasetId="test-dataset"
        datasetName="Dataset Karyawan"
        variables={mockVariables}
        onSuccess={onSuccess}
      />
    )

    const runButton = screen.getByRole('button', { name: /Jalankan Analisis \(OK\)/i })
    fireEvent.click(runButton)

    expect(await screen.findByText(/Pilih minimal satu variabel numerik/i)).toBeInTheDocument()
  })
})

describe('RegressionDialog Component', () => {
  it('merender kotak target dependen Y dan independen X secara terpisah', () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()

    render(
      <RegressionDialog
        isOpen={true}
        onClose={onClose}
        datasetId="test-dataset"
        datasetName="Dataset Karyawan"
        variables={mockVariables}
        onSuccess={onSuccess}
      />
    )

    expect(screen.getByText('Regresi Linear Berganda (OLS)')).toBeInTheDocument()
    expect(screen.getByText('Variabel Dependen (Y)')).toBeInTheDocument()
    expect(screen.getByText(/Variabel Independen \(X\)/i)).toBeInTheDocument()
  })

  it('menolak eksekusi jika variabel dependen atau independen belum ditentukan', async () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()

    render(
      <RegressionDialog
        isOpen={true}
        onClose={onClose}
        datasetId="test-dataset"
        datasetName="Dataset Karyawan"
        variables={mockVariables}
        onSuccess={onSuccess}
      />
    )

    const runButton = screen.getByRole('button', { name: /Jalankan Analisis \(OK\)/i })
    fireEvent.click(runButton)

    expect(await screen.findByText(/Pilih satu variabel dependen \(Y\)/i)).toBeInTheDocument()
  })
})

import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AnalysisView } from '../components/AnalysisView'
import { VariableDefinition, DataRow } from '../types'

const mockVariables: VariableDefinition[] = [
  {
    name: 'X1',
    type: 'numeric',
    width: 8,
    decimals: 2,
    label: 'Variabel X1',
    values: {},
    missing: [],
    measure: 'scale',
  },
  {
    name: 'X2',
    type: 'numeric',
    width: 8,
    decimals: 2,
    label: 'Variabel X2',
    values: {},
    missing: [],
    measure: 'scale',
  },
  {
    name: 'Y',
    type: 'numeric',
    width: 8,
    decimals: 2,
    label: 'Variabel Y',
    values: {},
    missing: [],
    measure: 'scale',
  },
]

const mockRows: DataRow[] = [
  { id: 1, X1: 10, X2: 20, Y: 30 },
  { id: 2, X1: 12, X2: 22, Y: 34 },
  { id: 3, X1: 14, X2: 24, Y: 38 },
]

describe('AnalysisView Component', () => {
  it('merender panel analisis dan tab-tab statistik', () => {
    render(
      <AnalysisView
        datasetId="test-dataset"
        datasetName="Dataset Riset"
        variables={mockVariables}
        rows={mockRows}
      />
    )

    // Check header text
    expect(screen.getByText(/Analisis Statistik/i)).toBeInTheDocument()
    expect(screen.getByText(/Dataset Riset/i)).toBeInTheDocument()

    // Check all 5 analysis tabs
    expect(screen.getByText('Statistik Deskriptif')).toBeInTheDocument()
    expect(screen.getByText('Uji Validitas Item')).toBeInTheDocument()
    expect(screen.getByText('Reliabilitas Alpha')).toBeInTheDocument()
    expect(screen.getByText('Korelasi Matrix')).toBeInTheDocument()
    expect(screen.getByText('Regresi Linear & Diagnostik')).toBeInTheDocument()
  })

  it('dapat beralih ke tab Regresi Linear & Diagnostik dan menampilkan opsi model regresi', () => {
    render(
      <AnalysisView
        datasetId="test-dataset"
        datasetName="Dataset Riset"
        variables={mockVariables}
        rows={mockRows}
      />
    )

    // Switch to Regresi tab
    const regressionTab = screen.getByText('Regresi Linear & Diagnostik')
    fireEvent.click(regressionTab)

    expect(screen.getByText(/Variabel Dependen \(Y\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Variabel Independen \(X\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Sertakan Diagnostik/i)).toBeInTheDocument()
  })

  it('dapat memilih tab Korelasi Matrix dan mengubah metode korelasi', () => {
    render(
      <AnalysisView
        datasetId="test-dataset"
        datasetName="Dataset Riset"
        variables={mockVariables}
        rows={mockRows}
      />
    )

    // Switch to Korelasi tab
    const correlationTab = screen.getByText('Korelasi Matrix')
    fireEvent.click(correlationTab)

    expect(screen.getByText('Metode Korelasi')).toBeInTheDocument()
    expect(screen.getByText('Kebijakan Missing Values')).toBeInTheDocument()
  })

  it('menampilkan peringatan validasi ketika tombol Jalankan ditekan tanpa dataset tersimpan', async () => {
    render(
      <AnalysisView
        datasetId={null}
        datasetName="Belum Tersimpan"
        variables={mockVariables}
        rows={mockRows}
      />
    )

    const runButton = screen.getByRole('button', { name: /Jalankan Analisis/i })
    fireEvent.click(runButton)

    expect(await screen.findByText(/Dataset belum tersimpan ke server/i)).toBeInTheDocument()
  })
})

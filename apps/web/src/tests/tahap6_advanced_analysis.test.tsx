import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AdvancedAnalysisView } from '../components/AdvancedAnalysisView'
import { TTestModal } from '../components/dialogs/advanced/TTestModal'
import { AnovaModal } from '../components/dialogs/advanced/AnovaModal'
import { CrosstabsModal } from '../components/dialogs/advanced/CrosstabsModal'
import { VariableDefinition } from '@/types'

const mockVariables: VariableDefinition[] = [
  { name: 'USIA', type: 'numeric', width: 8, decimals: 0, label: 'Usia Responden', values: {}, missing: [], measure: 'scale' },
  { name: 'GAJI', type: 'numeric', width: 8, decimals: 2, label: 'Gaji Pokok', values: {}, missing: [], measure: 'scale' },
  { name: 'GENDER', type: 'string', width: 8, decimals: 0, label: 'Jenis Kelamin', values: {}, missing: [], measure: 'nominal' },
  { name: 'DIVISI', type: 'string', width: 8, decimals: 0, label: 'Divisi Kerja', values: {}, missing: [], measure: 'nominal' },
]

describe('Tahap 6 — Advanced Statistics Modules', () => {
  it('merender halaman Statistik Lanjutan dan 6 kartu modul analitik', () => {
    render(
      <AdvancedAnalysisView
        datasetId="ds-test-6"
        datasetName="Dataset Riset Terapan"
        variables={mockVariables}
        rows={[{ id: 1, USIA: 25, GAJI: 5000, GENDER: 'L', DIVISI: 'IT' }]}
        onNavigateToOutput={vi.fn()}
        onNavigateToEditor={vi.fn()}
      />
    )

    expect(screen.getByText('Statistik Lanjutan (Advanced Statistics)')).toBeInTheDocument()
    expect(screen.getByText(/Dataset Riset Terapan/i)).toBeInTheDocument()
    expect(screen.getByText('Uji Beda Rata-rata (t-test)')).toBeInTheDocument()
    expect(screen.getByText('Analisis Varians (One-Way ANOVA)')).toBeInTheDocument()
    expect(screen.getByText('Statistik Nonparametrik')).toBeInTheDocument()
    expect(screen.getByText('Tabulasi Silang & Chi-Square (Crosstabs)')).toBeInTheDocument()
    expect(screen.getByText('Regresi Logistik Biner (Binary Logit)')).toBeInTheDocument()
    expect(screen.getByText('Visualisasi Grafik Statistik Interaktif')).toBeInTheDocument()
  })

  it('dapat membuka dialog Uji Beda t-test saat kartu diklik', () => {
    render(
      <AdvancedAnalysisView
        datasetId="ds-test-6"
        datasetName="Dataset Riset Terapan"
        variables={mockVariables}
        rows={[{ id: 1, USIA: 25 }]}
        onNavigateToOutput={vi.fn()}
        onNavigateToEditor={vi.fn()}
      />
    )

    // Klik kartu t-test
    fireEvent.click(screen.getByText('Uji Beda Rata-rata (t-test)'))
    expect(screen.getByRole('button', { name: /One-Sample t-test/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Independent Samples t-test/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Paired Samples t-test/i })).toBeInTheDocument()
  })

  it('merender dialog ANOVA dengan pengaturan post-hoc cerdas', () => {
    render(
      <AnovaModal
        isOpen={true}
        onClose={vi.fn()}
        datasetId="ds-test-6"
        variables={mockVariables}
        onSuccess={vi.fn()}
      />
    )

    expect(screen.getByText(/Analisis Varians Satu Jalur/i)).toBeInTheDocument()
    expect(screen.getByText(/Rekomendasi Cerdas Otomatis/i)).toBeInTheDocument()
    expect(screen.getByText("Tukey's HSD")).toBeInTheDocument()
    expect(screen.getByText('Games-Howell')).toBeInTheDocument()
  })

  it('merender dialog Crosstabs dengan pemilih baris dan kolom', () => {
    render(
      <CrosstabsModal
        isOpen={true}
        onClose={vi.fn()}
        datasetId="ds-test-6"
        variables={mockVariables}
        onSuccess={vi.fn()}
      />
    )

    expect(screen.getByText('Tabulasi Silang & Chi-Square (Crosstabs)')).toBeInTheDocument()
    expect(screen.getByText('Variabel Baris (Row Variable)')).toBeInTheDocument()
    expect(screen.getByText('Variabel Kolom (Column Variable)')).toBeInTheDocument()
  })
})

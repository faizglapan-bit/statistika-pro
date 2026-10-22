import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OutputView } from '../components/OutputView'
import { GenericOutputTable } from '../components/output/GenericOutputTable'
import { AnalysisOutput } from '../types'

const mockOutput: AnalysisOutput = {
  id: 'out_test_123',
  title: 'Statistik Deskriptif (X1, X2)',
  analysis_type: 'descriptive',
  dataset_id: 'dataset-1',
  dataset_name: 'Dataset Riset',
  dataset_updated_at: '2026-10-21T10:00:00Z',
  sample_size: 25,
  variables: ['X1', 'X2'],
  parameters: { method: 'descriptive' },
  results: {
    sample_size: 25,
    results: [
      {
        name: 'X1',
        n_valid: 25,
        n_missing: 0,
        mean: { value: 3.84, formatted: '3.840', note: null },
        median: { value: 4.0, formatted: '4.000', note: null },
        mode: { value: 4.0, formatted: '4.000', note: null },
        min: { value: 2.0, formatted: '2.000', note: null },
        max: { value: 5.0, formatted: '5.000', note: null },
        range: { value: 3.0, formatted: '3.000', note: null },
        variance: { value: 0.64, formatted: '0.640', note: null },
        std_dev: { value: 0.80, formatted: '0.800', note: null },
        sem: { value: 0.16, formatted: '0.160', note: null },
        skewness: { value: -0.45, formatted: '-0.450', note: null },
        kurtosis: { value: -0.21, formatted: '-0.210', note: null },
        warnings: [],
      },
    ],
  },
  warnings: [],
  interpretation: 'Rata-rata variabel X1 adalah 3.840 dengan standar deviasi 0.800.',
  created_at: '2026-10-21T10:00:00Z',
}

describe('OutputView Component', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as any)
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('merender dokumen output aktif, toolbar, dan interpretasi', () => {
    const onBack = vi.fn()
    const onReRun = vi.fn()

    render(
      <OutputView
        activeDatasetId="dataset-1"
        activeDatasetName="Dataset Riset"
        activeDatasetUpdatedAt="2026-10-21T10:00:00Z"
        variables={[]}
        onBackToEditor={onBack}
        onReRunAnalysis={onReRun}
        initialOutput={mockOutput}
      />
    )

    // Check title in active document
    expect(screen.getAllByText('Statistik Deskriptif (X1, X2)').length).toBeGreaterThan(0)

    // Check dataset name
    expect(screen.getAllByText(/Dataset Riset/i).length).toBeGreaterThan(0)

    // Check table headers and data
    expect(screen.getByText('Descriptive Statistics (N = 25)')).toBeInTheDocument()
    expect(screen.getByText('3.840')).toBeInTheDocument()
    expect(screen.getByText(/Rata-rata variabel X1 adalah 3.840/i)).toBeInTheDocument()

    // Check toolbar buttons
    expect(screen.getByRole('button', { name: /Cetak \/ PDF/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Jalankan Ulang/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Hapus/i })).toBeInTheDocument()
  })

  it('menampilkan banner peringatan stale jika dataset aktif telah diperbarui setelah analisis', () => {
    const onBack = vi.fn()
    const onReRun = vi.fn()

    // Dataset updated at 12:00, but output was created at 10:00
    render(
      <OutputView
        activeDatasetId="dataset-1"
        activeDatasetName="Dataset Riset"
        activeDatasetUpdatedAt="2026-10-21T12:00:00Z"
        variables={[]}
        onBackToEditor={onBack}
        onReRunAnalysis={onReRun}
        initialOutput={mockOutput}
      />
    )

    expect(screen.getByText(/Peringatan Versi Dataset/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Jalankan Ulang Sekarang/i })).toBeInTheDocument()
  })

  it('tombol kembali memanggil onBackToEditor', () => {
    const onBack = vi.fn()
    const onReRun = vi.fn()

    render(
      <OutputView
        activeDatasetId="dataset-1"
        activeDatasetName="Dataset Riset"
        activeDatasetUpdatedAt="2026-10-21T10:00:00Z"
        variables={[]}
        onBackToEditor={onBack}
        onReRunAnalysis={onReRun}
        initialOutput={mockOutput}
      />
    )

    const backButton = screen.getAllByRole('button', { name: /Editor/i })[0]
    fireEvent.click(backButton)
    expect(onBack).toHaveBeenCalled()
  })
})

describe('GenericOutputTable Component', () => {
  it('menyediakan tombol Salin Tabel yang merespons klik pengguna', async () => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    })

    render(<GenericOutputTable output={mockOutput} />)

    const copyBtn = screen.getByRole('button', { name: /Salin Tabel/i })
    fireEvent.click(copyBtn)

    expect(await screen.findByText(/Tabel Tersalin!/i)).toBeInTheDocument()
  })
})

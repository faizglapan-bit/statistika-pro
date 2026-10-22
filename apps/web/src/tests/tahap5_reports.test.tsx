import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReportGeneratorView } from '../components/ReportGeneratorView'

describe('Tahap 5 — ReportGeneratorView Component', () => {
  it('merender tampilan Generator Laporan dengan formulir metadata dan pilihan format', () => {
    const mockDataset = {
      id: 'ds-100',
      name: 'Dataset Pengujian Laporan',
      description: '',
      row_count: 50,
      variable_count: 8,
      missing_count: 2,
      is_demo: false,
      created_at: '',
      updated_at: '',
    }

    render(<ReportGeneratorView activeDataset={mockDataset} />)

    expect(screen.getByText('Generator Laporan Statistik')).toBeInTheDocument()
    expect(screen.getByText('Dataset Pengujian Laporan')).toBeInTheDocument()
    expect(screen.getByText(/1. Informasi & Metadata Penelitian/i)).toBeInTheDocument()
    expect(screen.getByText(/PDF \(ReportLab\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Word \(python-docx\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Excel \(openpyxl\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Unduh Laporan/i)).toBeInTheDocument()
  })

  it('menampilkan fallback pesan jika tidak ada dataset aktif', () => {
    render(<ReportGeneratorView activeDataset={null} />)
    expect(screen.getByText('Tidak Ada Dataset Aktif')).toBeInTheDocument()
  })
})

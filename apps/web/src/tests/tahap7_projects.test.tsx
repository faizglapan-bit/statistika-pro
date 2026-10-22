import { describe, it, expect, vi } from 'vitest'
import { act } from 'react-dom/test-utils'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectHeaderBar } from '@/components/ProjectHeaderBar'
import { UnsavedChangesModal } from '@/components/UnsavedChangesModal'
import { ProjectManagerModal } from '@/components/ProjectManagerModal'

// Mock fetch for project API
global.fetch = vi.fn().mockImplementation((url: string) => {
  if (url.includes('/api/projects')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        {
          id: 'proj-1',
          name: 'Proyek Riset Pasar',
          description: 'Riset perilaku konsumen',
          dataset_name: 'Dataset Pasar',
          row_count: 100,
          variable_count: 5,
          output_count: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]),
    })
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
}) as any

describe('Tahap 7 — Project Management & Reliability UI', () => {
  it('merender ProjectHeaderBar dengan status tersimpan dan belum disimpan', async () => {
    const onSave = vi.fn()
    const { rerender } = render(
      <ProjectHeaderBar
        projectName="Proyek Uji Coba"
        projectId="proj-test-1"
        isDirty={false}
        isSaving={false}
        onSaveProject={onSave}
        onOpenProjectManager={vi.fn()}
        onNewProject={vi.fn()}
        onDuplicateProject={vi.fn()}
        onUpdateProjectName={vi.fn()}
      />
    )

    // Cek nama proyek dan badge Tersimpan
    expect(screen.getByText('Proyek Uji Coba')).toBeInTheDocument()
    expect(screen.getByText('Tersimpan')).toBeInTheDocument()

    // Rerender dengan status isDirty = true
    rerender(
      <ProjectHeaderBar
        projectName="Proyek Uji Coba"
        projectId="proj-test-1"
        isDirty={true}
        isSaving={false}
        onSaveProject={onSave}
        onOpenProjectManager={vi.fn()}
        onNewProject={vi.fn()}
        onDuplicateProject={vi.fn()}
        onUpdateProjectName={vi.fn()}
      />
    )

    expect(screen.getByText('Belum Disimpan')).toBeInTheDocument()

    // Tombol simpan proyek diklik
    const saveBtn = screen.getByRole('button', { name: /Simpan Proyek/i })
    await act(async () => { fireEvent.click(saveBtn) })
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('merender UnsavedChangesModal dan menangani tombol aksi konfirmasi', async () => {
    const onSave = vi.fn()
    const onDiscard = vi.fn()
    const onClose = vi.fn()

    render(
      <UnsavedChangesModal
        isOpen={true}
        onClose={onClose}
        onSaveAndProceed={onSave}
        onDiscardAndProceed={onDiscard}
        projectName="Tesis Magister 2026"
      />
    )

    expect(screen.getByText('Perubahan Belum Disimpan')).toBeInTheDocument()
    expect(screen.getByText(/Tesis Magister 2026/i)).toBeInTheDocument()

    // Klik Simpan & Lanjutkan
    fireEvent.click(screen.getByRole('button', { name: /Simpan & Lanjutkan/i }))
    expect(onSave).toHaveBeenCalledTimes(1)

    // Klik Abaikan & Lanjutkan
    fireEvent.click(screen.getByRole('button', { name: /Abaikan & Lanjutkan/i }))
    expect(onDiscard).toHaveBeenCalledTimes(1)

    // Klik Batal
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Batal/i })) })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('merender ProjectManagerModal dan menampilkan daftar proyek serta opsi impor .statpro', async () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()

    await act(async () => {
      render(
        <ProjectManagerModal
          isOpen={true}
          onClose={onClose}
          currentProjectId="proj-1"
          onSelectProject={onSelect}
        />
      );
    })

    expect(screen.getByText(/Manajer Proyek Analisis \(\.statpro\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Impor \.statpro/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Proyek Baru/i })).toBeInTheDocument()
  })
})

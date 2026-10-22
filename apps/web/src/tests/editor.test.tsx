import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataGrid } from '../components/DataGrid'
import { VariableView } from '../components/VariableView'
import { ValueLabelsModal } from '../components/ValueLabelsModal'
import { MissingValuesModal } from '../components/MissingValuesModal'
import { VariableDefinition, DataRow } from '../types'

const mockVariables: VariableDefinition[] = [
  {
    name: 'ID',
    type: 'numeric',
    width: 4,
    decimals: 0,
    label: 'Nomor Responden',
    values: {},
    missing: [],
    measure: 'nominal',
  },
  {
    name: 'Q1',
    type: 'numeric',
    width: 4,
    decimals: 0,
    label: 'Pertanyaan 1',
    values: { '1': 'Sangat Tidak Setuju', '5': 'Sangat Setuju' },
    missing: ['99'],
    measure: 'ordinal',
  },
  {
    name: 'Nama',
    type: 'string',
    width: 8,
    decimals: 0,
    label: 'Nama Responden',
    values: {},
    missing: [],
    measure: 'nominal',
  },
]

const mockRows: DataRow[] = [
  { id: 1, ID: 1, Q1: 5, Nama: 'Andi' },
  { id: 2, ID: 2, Q1: 1, Nama: 'Budi' },
  { id: 3, ID: 3, Q1: 99, Nama: 'Citra' },
]

describe('DataGrid (Spreadsheet View)', () => {
  it('menampilkan kolom variabel dan baris data dengan benar', () => {
    const onCellSelect = vi.fn()
    const onCellChange = vi.fn()
    const onAddRow = vi.fn()
    const onDeleteRow = vi.fn()
    const onAddColumn = vi.fn()
    const onPaste = vi.fn()

    render(
      <DataGrid
        variables={mockVariables}
        rows={mockRows}
        selectedCell={null}
        onCellSelect={onCellSelect}
        onCellChange={onCellChange}
        onAddRow={onAddRow}
        onDeleteRow={onDeleteRow}
        onAddColumn={onAddColumn}
        onPasteFromClipboard={onPaste}
      />
    )

    // Periksa header kolom
    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('Q1')).toBeInTheDocument()
    expect(screen.getByText('Nama')).toBeInTheDocument()

    // Periksa sel data
    expect(screen.getByText('Andi')).toBeInTheDocument()
    expect(screen.getByText('Budi')).toBeInTheDocument()
  })

  it('memungkinkan pemilihan sel dengan klik', () => {
    const onCellSelect = vi.fn()

    render(
      <DataGrid
        variables={mockVariables}
        rows={mockRows}
        selectedCell={null}
        onCellSelect={onCellSelect}
        onCellChange={vi.fn()}
        onAddRow={vi.fn()}
        onDeleteRow={vi.fn()}
        onAddColumn={vi.fn()}
        onPasteFromClipboard={vi.fn()}
      />
    )

    const cell = screen.getByText('Andi')
    fireEvent.click(cell)
    expect(onCellSelect).toHaveBeenCalledWith({ rowId: 1, colKey: 'Nama' })
  })

  it('memproses penempelan tabel data Excel melalui clipboard', () => {
    const onPaste = vi.fn()

    const { container } = render(
      <DataGrid
        variables={mockVariables}
        rows={mockRows}
        selectedCell={{ rowId: 1, colKey: 'Q1' }}
        onCellSelect={vi.fn()}
        onCellChange={vi.fn()}
        onAddRow={vi.fn()}
        onDeleteRow={vi.fn()}
        onAddColumn={vi.fn()}
        onPasteFromClipboard={onPaste}
      />
    )

    const gridContainer = container.firstChild as HTMLElement
    fireEvent.paste(gridContainer, {
      clipboardData: {
        getData: (format: string) => (format === 'text/plain' ? '4\tAndi\n5\tBudi' : ''),
      },
    })

    expect(onPaste).toHaveBeenCalledWith(0, 'Q1', '4\tAndi\n5\tBudi')
  })
})

describe('VariableView (Pengaturan Variabel)', () => {
  it('merender daftar variabel dengan atribut Name, Type, Measure, dan Labels', () => {
    render(
      <VariableView
        variables={mockVariables}
        onUpdateVariable={vi.fn()}
        onAddVariable={vi.fn()}
        onDeleteVariable={vi.fn()}
      />
    )

    expect(screen.getByDisplayValue('ID')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Q1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Nama Responden')).toBeInTheDocument()
  })

  it('memanggil onUpdateVariable saat nama variabel diedit', () => {
    const onUpdate = vi.fn()
    render(
      <VariableView
        variables={mockVariables}
        onUpdateVariable={onUpdate}
        onAddVariable={vi.fn()}
        onDeleteVariable={vi.fn()}
      />
    )

    const inputName = screen.getByDisplayValue('Q1')
    fireEvent.change(inputName, { target: { value: 'Q1_Baru' } })
    expect(onUpdate).toHaveBeenCalled()
  })
})

describe('ValueLabelsModal (Kategori Kuesioner)', () => {
  it('dapat menambah pasangan nilai dan label kuesioner baru', () => {
    const onSave = vi.fn()
    const onClose = vi.fn()

    render(
      <ValueLabelsModal
        variableName="Q1"
        initialValues={{ '1': 'Tidak Setuju' }}
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
      />
    )

    expect(screen.getByText('Value Labels — Q1')).toBeInTheDocument()
    expect(screen.getByText('Tidak Setuju')).toBeInTheDocument()

    // Tambah nilai 2 = Netral
    const inputs = screen.getAllByRole('textbox')
    const valInput = inputs[0]
    const labelInput = inputs[1]

    fireEvent.change(valInput, { target: { value: '2' } })
    fireEvent.change(labelInput, { target: { value: 'Netral' } })

    const addBtn = screen.getByText('Tambah')
    fireEvent.click(addBtn)

    expect(screen.getByText('Netral')).toBeInTheDocument()

    // Simpan
    const saveBtn = screen.getByText('Simpan Nilai')
    fireEvent.click(saveBtn)

    expect(onSave).toHaveBeenCalledWith({
      '1': 'Tidak Setuju',
      '2': 'Netral',
    })
    expect(onClose).toHaveBeenCalled()
  })
})

describe('MissingValuesModal (Kode Missing Diskrit)', () => {
  it('dapat menetapkan kode missing diskrit seperti 99', () => {
    const onSave = vi.fn()
    const onClose = vi.fn()

    render(
      <MissingValuesModal
        variableName="Q1"
        initialMissing={[]}
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
      />
    )

    expect(screen.getByText('Missing Values — Q1')).toBeInTheDocument()

    // Pilih mode diskrit
    const radioDiscrete = screen.getByLabelText(/Nilai missing diskrit/i)
    fireEvent.click(radioDiscrete)

    // Masukkan kode 99
    const inputMissing = screen.getByPlaceholderText('mis. 99')
    fireEvent.change(inputMissing, { target: { value: '99' } })

    // Klik Terapkan
    const applyBtn = screen.getByText('Terapkan')
    fireEvent.click(applyBtn)

    expect(onSave).toHaveBeenCalledWith(['99'])
    expect(onClose).toHaveBeenCalled()
  })
})

import { useState } from 'react'
import {
  Save,
  Plus,
  FolderOpen,
  Upload,
  Download,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Table,
  ListOrdered,
  ChevronDown,
  Loader2,
  BarChart3,
} from 'lucide-react'
import { VariableDefinition, DataRow, Dataset } from '@/types'
import { DataGrid } from './DataGrid'
import { VariableView } from './VariableView'
import { ImportModal } from './ImportModal'
import { DatasetManagerModal } from './DatasetManagerModal'
import * as datasetApi from '@/services/datasetApi'

import { ComputeVariableModal } from './dialogs/transform/ComputeVariableModal'
import { RecodeVariableModal } from './dialogs/transform/RecodeVariableModal'
import { ReverseScoreModal } from './dialogs/transform/ReverseScoreModal'
import { CompositeScoreModal } from './dialogs/transform/CompositeScoreModal'
import { StandardizeModal } from './dialogs/transform/StandardizeModal'
import { CategorizeModal } from './dialogs/transform/CategorizeModal'
import { TransformationHistoryModal } from './dialogs/transform/TransformationHistoryModal'
import { FilterCasesModal } from './dialogs/cases/FilterCasesModal'
import { SortCasesModal } from './dialogs/cases/SortCasesModal'
import { DuplicateCasesModal } from './dialogs/cases/DuplicateCasesModal'
import { MissingSummaryModal } from './dialogs/cases/MissingSummaryModal'

import { TTestModal } from './dialogs/advanced/TTestModal'
import { AnovaModal } from './dialogs/advanced/AnovaModal'
import { NonparametricModal } from './dialogs/advanced/NonparametricModal'
import { CrosstabsModal } from './dialogs/advanced/CrosstabsModal'
import { LogisticRegressionModal } from './dialogs/advanced/LogisticRegressionModal'
import { ChartsModal } from './dialogs/advanced/ChartsModal'

interface DataEditorViewProps {
  datasetId: string | null
  datasetName: string
  setDatasetName: (name: string) => void
  variables: VariableDefinition[]
  rows: DataRow[]
  isSaved: boolean
  isDemo: boolean
  isLoading: boolean
  statusMessage: { type: 'success' | 'error' | 'info'; text: string } | null
  missingCount: number
  activeTab: 'data-view' | 'variable-view'
  setActiveTab: (tab: 'data-view' | 'variable-view') => void
  selectedCell: { rowId: number; colKey: string } | null
  setSelectedCell: (cell: { rowId: number; colKey: string } | null) => void
  onAddRow: () => void
  onDeleteRow: (rowId: number) => void
  onAddColumn: () => void
  onDeleteColumn: (varName: string) => void
  onCellChange: (rowId: number, colKey: string, value: string) => void
  onUpdateVariable: (index: number, newDef: VariableDefinition) => boolean
  onPasteFromClipboard: (startRowIdx: number, startColKey: string, text: string) => void
  onSaveDataset: () => Promise<void>
  onNewProject: () => void
  onLoadDemo: () => Promise<void>
  onLoadDatasetById: (id: string) => Promise<void>
  onImportSuccess: (dataset: Dataset) => void
  onOpenAnalysisDialog?: (type: 'descriptive' | 'validity' | 'reliability' | 'correlation' | 'regression' | 'diagnostics') => void
}

export function DataEditorView({
  datasetId,
  datasetName,
  setDatasetName,
  variables,
  rows,
  isSaved,
  isDemo,
  isLoading,
  statusMessage,
  missingCount,
  activeTab,
  setActiveTab,
  selectedCell,
  setSelectedCell,
  onAddRow,
  onDeleteRow,
  onAddColumn,
  onDeleteColumn,
  onCellChange,
  onUpdateVariable,
  onPasteFromClipboard,
  onSaveDataset,
  onNewProject,
  onLoadDemo,
  onLoadDatasetById,
  onImportSuccess,
  onOpenAnalysisDialog,
}: DataEditorViewProps) {
  const [showImportModal, setShowImportModal] = useState(false)
  const [showManagerModal, setShowManagerModal] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showAnalysisMenu, setShowAnalysisMenu] = useState(false)
  const [showAdvancedMenu, setShowAdvancedMenu] = useState(false)
  const [showTransformMenu, setShowTransformMenu] = useState(false)
  const [showCaseMenu, setShowCaseMenu] = useState(false)
  const [activeModal, setActiveModal] = useState<
    | 'compute'
    | 'recode'
    | 'reverse'
    | 'composite'
    | 'standardize'
    | 'categorize'
    | 'history'
    | 'filter'
    | 'sort'
    | 'duplicate'
    | 'missingSummary'
    | 'ttest'
    | 'anova'
    | 'nonparametric'
    | 'crosstabs'
    | 'logistic'
    | 'charts'
    | null
  >(null)
  const [matchedRowIds, setMatchedRowIds] = useState<(number | string)[] | null>(null)
  const [filterConditionText, setFilterConditionText] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState(datasetName)

  const handleExportCsv = () => {
    if (!datasetId) {
      alert('Harap simpan dataset terlebih dahulu sebelum mengekspor.')
      return
    }
    window.open(datasetApi.getExportCsvUrl(datasetId), '_blank')
    setShowExportMenu(false)
  }

  const handleExportXlsx = () => {
    if (!datasetId) {
      alert('Harap simpan dataset terlebih dahulu sebelum mengekspor.')
      return
    }
    window.open(datasetApi.getExportXlsxUrl(datasetId), '_blank')
    setShowExportMenu(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#0b1120' }}>
      {/* Top Main Toolbar */}
      <div
        style={{
          padding: '8px 16px',
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {/* Left: Dataset Name & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Editable Title */}
          {editingTitle ? (
            <input
              type="text"
              autoFocus
              value={tempTitle}
              onChange={e => setTempTitle(e.target.value)}
              onBlur={() => {
                if (tempTitle.trim()) setDatasetName(tempTitle.trim())
                setEditingTitle(false)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (tempTitle.trim()) setDatasetName(tempTitle.trim())
                  setEditingTitle(false)
                } else if (e.key === 'Escape') {
                  setTempTitle(datasetName)
                  setEditingTitle(false)
                }
              }}
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                background: '#0f172a',
                border: '1px solid #3b82f6',
                borderRadius: '4px',
                padding: '2px 8px',
              }}
            />
          ) : (
            <div
              onClick={() => {
                setTempTitle(datasetName)
                setEditingTitle(true)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
              title="Klik untuk mengubah nama dataset"
            >
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                {datasetName}
              </span>
              {isDemo && (
                <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#fbbf24', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  DEMO DATA
                </span>
              )}
            </div>
          )}

          {/* Unsaved indicator */}
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '12px',
              background: isSaved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isSaved ? '#34d399' : '#fbbf24',
              border: isSaved ? '1px solid #10b981' : '1px solid #f59e0b',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSaved ? '#10b981' : '#f59e0b' }} />
            {isSaved ? 'Tersimpan' : 'Belum disimpan'}
          </span>
        </div>

        {/* Center / Right Buttons Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* New Dataset */}
          <button
            onClick={onNewProject}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '6px',
              background: '#334155',
              border: '1px solid #475569',
              color: '#f8fafc',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            title="Buat dataset kosong baru"
          >
            <Plus size={14} />
            <span>Baru</span>
          </button>

          {/* Open Dataset Manager */}
          <button
            onClick={() => setShowManagerModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '6px',
              background: '#334155',
              border: '1px solid #475569',
              color: '#f8fafc',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            title="Buka atau kelola dataset yang tersimpan"
          >
            <FolderOpen size={14} />
            <span>Buka...</span>
          </button>

          {/* Save Button */}
          <button
            onClick={onSaveDataset}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              background: isSaved ? '#1e3a8a' : '#2563eb',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
            title="Simpan dataset ke server"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Simpan</span>
          </button>

          <div style={{ width: '1px', height: '20px', background: '#475569', margin: '0 4px' }} />

          {/* Import Button */}
          <button
            onClick={() => setShowImportModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid #3b82f6',
              color: '#60a5fa',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            title="Impor file Excel atau CSV"
          >
            <Upload size={14} />
            <span>Impor Data</span>
          </button>

          {/* Analysis Dropdown Menu (ala SPSS Analyze Menu) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowAnalysisMenu(prev => !prev)
                setShowExportMenu(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid #3b82f6',
                color: '#60a5fa',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Menu Analisis Statistik SPSS"
            >
              <BarChart3 size={14} />
              <span>Analisis</span>
              <ChevronDown size={12} />
            </button>

            {showAnalysisMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                  minWidth: '220px',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => {
                    setShowAnalysisMenu(false)
                    onOpenAnalysisDialog?.('descriptive')
                  }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  📊 Statistik Deskriptif...
                </div>
                <div
                  onClick={() => {
                    setShowAnalysisMenu(false)
                    onOpenAnalysisDialog?.('validity')
                  }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  🎯 Uji Validitas Item...
                </div>
                <div
                  onClick={() => {
                    setShowAnalysisMenu(false)
                    onOpenAnalysisDialog?.('reliability')
                  }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  🛡️ Reliabilitas Cronbach's Alpha...
                </div>
                <div
                  onClick={() => {
                    setShowAnalysisMenu(false)
                    onOpenAnalysisDialog?.('correlation')
                  }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  📈 Matriks Korelasi Bivariat...
                </div>
                <div
                  onClick={() => {
                    setShowAnalysisMenu(false)
                    onOpenAnalysisDialog?.('regression')
                  }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  🚀 Regresi Linear Berganda (OLS)...
                </div>
                <div
                  onClick={() => {
                    setShowAnalysisMenu(false)
                    onOpenAnalysisDialog?.('diagnostics')
                  }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}
                  className="hover:bg-slate-700"
                >
                  ⚠️ Uji Asumsi Klasik OLS...
                </div>
              </div>
            )}
          </div>

          {/* Statistik Lanjutan Dropdown Menu (Tahap 6) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowAdvancedMenu((prev) => !prev)
                setShowAnalysisMenu(false)
                setShowTransformMenu(false)
                setShowCaseMenu(false)
                setShowExportMenu(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid #6366f1',
                color: '#818cf8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Menu Statistik Lanjutan (Tahap 6)"
            >
              <Sparkles size={14} />
              <span>Statistik Lanjutan</span>
              <ChevronDown size={12} />
            </button>

            {showAdvancedMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                  minWidth: '240px',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => { setShowAdvancedMenu(false); setActiveModal('ttest'); }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  ⚖️ Uji Beda Rata-rata (t-test)...
                </div>
                <div
                  onClick={() => { setShowAdvancedMenu(false); setActiveModal('anova'); }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  📑 Analisis Varians (ANOVA)...
                </div>
                <div
                  onClick={() => { setShowAdvancedMenu(false); setActiveModal('nonparametric'); }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  🌿 Statistik Nonparametrik...
                </div>
                <div
                  onClick={() => { setShowAdvancedMenu(false); setActiveModal('crosstabs'); }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  🗂️ Tabulasi Silang (Crosstabs)...
                </div>
                <div
                  onClick={() => { setShowAdvancedMenu(false); setActiveModal('logistic'); }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  📈 Regresi Logistik Biner...
                </div>
                <div
                  onClick={() => { setShowAdvancedMenu(false); setActiveModal('charts'); }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}
                  className="hover:bg-slate-700"
                >
                  📊 Visualisasi Grafik Statistik...
                </div>
              </div>
            )}
          </div>

          {/* Transformasi Data Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowTransformMenu((prev) => !prev)
                setShowAnalysisMenu(false)
                setShowCaseMenu(false)
                setShowExportMenu(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '6px',
                background: '#1e3a8a',
                border: '1px solid #3b82f6',
                color: '#93c5fd',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Menu Transformasi Data"
            >
              <span>🧮</span>
              <span>Transformasi</span>
              <ChevronDown size={12} />
            </button>

            {showTransformMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                  minWidth: '240px',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => { setShowTransformMenu(false); setActiveModal('compute'); }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  🧮 Hitung Variabel Baru (Compute)...
                </div>
                <div
                  onClick={() => { setShowTransformMenu(false); setActiveModal('recode'); }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  🔄 Recode ke Variabel Baru...
                </div>
                <div
                  onClick={() => { setShowTransformMenu(false); setActiveModal('reverse'); }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  ↕️ Pembalikan Skor (Reverse Scoring)...
                </div>
                <div
                  onClick={() => { setShowTransformMenu(false); setActiveModal('composite'); }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  ∑ Skor Komposit (Mean / Sum)...
                </div>
                <div
                  onClick={() => { setShowTransformMenu(false); setActiveModal('standardize'); }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  Z Standardisasi (Z-Score)...
                </div>
                <div
                  onClick={() => { setShowTransformMenu(false); setActiveModal('categorize'); }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  📊 Kategorisasi Variabel...
                </div>
                <div
                  onClick={() => { setShowTransformMenu(false); setActiveModal('history'); }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#60a5fa', cursor: 'pointer', background: 'rgba(37, 99, 235, 0.1)' }}
                  className="hover:bg-slate-700"
                >
                  📜 Riwayat Audit & Undo Snapshot...
                </div>
              </div>
            )}
          </div>

          {/* Manajemen Kasus Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowCaseMenu((prev) => !prev)
                setShowAnalysisMenu(false)
                setShowTransformMenu(false)
                setShowExportMenu(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '6px',
                background: '#334155',
                border: '1px solid #475569',
                color: '#f8fafc',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Menu Pengelolaan Kasus"
            >
              <span>📁</span>
              <span>Kasus</span>
              <ChevronDown size={12} />
            </button>

            {showCaseMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                  minWidth: '230px',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => { setShowCaseMenu(false); setActiveModal('filter'); }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  🔍 Saring / Pilih Kasus (Filter)...
                </div>
                <div
                  onClick={() => { setShowCaseMenu(false); setActiveModal('sort'); }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  ↕️ Urutkan Kasus (Sort)...
                </div>
                <div
                  onClick={() => { setShowCaseMenu(false); setActiveModal('duplicate'); }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  className="hover:bg-slate-700"
                >
                  👥 Deteksi & Hapus Duplikasi...
                </div>
                <div
                  onClick={() => { setShowCaseMenu(false); setActiveModal('missingSummary'); }}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#fb923c', cursor: 'pointer' }}
                  className="hover:bg-slate-700"
                >
                  ⚠️ Ringkasan Missing Values...
                </div>
              </div>
            )}
          </div>

          {/* Export Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '6px',
                background: '#334155',
                border: '1px solid #475569',
                color: '#f8fafc',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
              title="Ekspor dataset ke Excel atau CSV"
            >
              <Download size={14} />
              <span>Ekspor</span>
              <ChevronDown size={13} />
            </button>

            {showExportMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '4px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  zIndex: 50,
                  minWidth: '160px',
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={handleExportCsv}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    borderBottom: '1px solid #334155',
                  }}
                  className="hover:bg-slate-700"
                >
                  📄 File CSV (.csv)
                </div>
                <div
                  onClick={handleExportXlsx}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                  }}
                  className="hover:bg-slate-700"
                >
                  📊 Excel Multi-Sheet (.xlsx)
                </div>
              </div>
            )}
          </div>

          {/* Demo Data Button */}
          <button
            onClick={onLoadDemo}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '6px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid #f59e0b',
              color: '#fbbf24',
              fontSize: '12px',
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
            title="Muat dataset kuesioner demonstrasi"
          >
            <Sparkles size={14} />
            <span>DEMO DATA</span>
          </button>
        </div>
      </div>

      {/* Secondary Status Bar / Metrics */}
      <div
        style={{
          padding: '6px 16px',
          background: '#0f172a',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          flexShrink: 0,
        }}
      >
        {/* Status Message Toast */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {statusMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: statusMessage.type === 'success' ? '#34d399' : statusMessage.type === 'error' ? '#f87171' : '#60a5fa',
              }}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={14} />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle size={14} />
              ) : (
                <Sparkles size={14} />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Dataset Metrics */}
        <div style={{ display: 'flex', gap: '16px', color: '#94a3b8' }}>
          <span>
            Kasus (N): <strong style={{ color: '#f8fafc' }}>{rows.length}</strong>
          </span>
          <span>
            Variabel (K): <strong style={{ color: '#f8fafc' }}>{variables.length}</strong>
          </span>
          <span>
            Missing Values: <strong style={{ color: missingCount > 0 ? '#f87171' : '#34d399' }}>{missingCount}</strong>
          </span>
        </div>
      </div>

      {/* Main Content: Data View vs Variable View */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'data-view' ? (
          <DataGrid
            variables={variables}
            rows={rows}
            selectedCell={selectedCell}
            onCellSelect={setSelectedCell}
            onCellChange={onCellChange}
            onAddRow={onAddRow}
            onDeleteRow={onDeleteRow}
            onAddColumn={onAddColumn}
            onPasteFromClipboard={onPasteFromClipboard}
            matchedRowIds={matchedRowIds}
            filterConditionText={filterConditionText}
            onClearFilter={() => {
              setMatchedRowIds(null)
              setFilterConditionText(null)
            }}
          />
        ) : (
          <VariableView
            variables={variables}
            onUpdateVariable={onUpdateVariable}
            onAddVariable={onAddColumn}
            onDeleteVariable={onDeleteColumn}
          />
        )}
      </div>

      {/* Bottom SPSS Tab Switcher */}
      <div
        style={{
          display: 'flex',
          background: '#0f172a',
          borderTop: '1px solid #334155',
          height: '32px',
          padding: '0 8px',
          alignItems: 'flex-end',
          flexShrink: 0,
        }}
      >
        {/* Data View Tab */}
        <button
          onClick={() => setActiveTab('data-view')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 16px',
            background: activeTab === 'data-view' ? '#1e293b' : 'transparent',
            borderTop: activeTab === 'data-view' ? '2px solid #3b82f6' : '2px solid transparent',
            borderLeft: '1px solid #334155',
            borderRight: '1px solid #334155',
            borderBottom: 'none',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
            color: activeTab === 'data-view' ? '#38bdf8' : '#94a3b8',
            fontSize: '12px',
            fontWeight: activeTab === 'data-view' ? 600 : 500,
            cursor: 'pointer',
          }}
        >
          <Table size={13} />
          Data View
        </button>

        {/* Variable View Tab */}
        <button
          onClick={() => setActiveTab('variable-view')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 16px',
            background: activeTab === 'variable-view' ? '#1e293b' : 'transparent',
            borderTop: activeTab === 'variable-view' ? '2px solid #3b82f6' : '2px solid transparent',
            borderLeft: '1px solid #334155',
            borderRight: '1px solid #334155',
            borderBottom: 'none',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
            color: activeTab === 'variable-view' ? '#38bdf8' : '#94a3b8',
            fontSize: '12px',
            fontWeight: activeTab === 'variable-view' ? 600 : 500,
            cursor: 'pointer',
          }}
        >
          <ListOrdered size={13} />
          Variable View
        </button>
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        currentDatasetId={datasetId}
        currentDatasetName={datasetName}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={onImportSuccess}
      />

      {/* Dataset Manager Modal */}
      <DatasetManagerModal
        isOpen={showManagerModal}
        activeDatasetId={datasetId}
        onClose={() => setShowManagerModal(false)}
        onSelectDataset={onLoadDatasetById}
        onNewDataset={onNewProject}
        onDemoReset={onLoadDemo}
      />

      {/* Tahap 5: Modal Dialogs Transformasi Data */}
      {datasetId && (
        <>
          <ComputeVariableModal
            isOpen={activeModal === 'compute'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={(_up, newId) => {
              if (newId) onLoadDatasetById(newId)
              else onLoadDatasetById(datasetId)
            }}
          />

          <RecodeVariableModal
            isOpen={activeModal === 'recode'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={(_up, newId) => {
              if (newId) onLoadDatasetById(newId)
              else onLoadDatasetById(datasetId)
            }}
          />

          <ReverseScoreModal
            isOpen={activeModal === 'reverse'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={(_up, newId) => {
              if (newId) onLoadDatasetById(newId)
              else onLoadDatasetById(datasetId)
            }}
          />

          <CompositeScoreModal
            isOpen={activeModal === 'composite'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={(_up, newId) => {
              if (newId) onLoadDatasetById(newId)
              else onLoadDatasetById(datasetId)
            }}
          />

          <StandardizeModal
            isOpen={activeModal === 'standardize'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={(_up, newId) => {
              if (newId) onLoadDatasetById(newId)
              else onLoadDatasetById(datasetId)
            }}
          />

          <CategorizeModal
            isOpen={activeModal === 'categorize'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={(_up, newId) => {
              if (newId) onLoadDatasetById(newId)
              else onLoadDatasetById(datasetId)
            }}
          />

          <TransformationHistoryModal
            isOpen={activeModal === 'history'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            onSuccess={() => {
              onLoadDatasetById(datasetId)
            }}
          />

          {/* Tahap 5: Modal Dialogs Manajemen Kasus */}
          <FilterCasesModal
            isOpen={activeModal === 'filter'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onApplyFilter={(matchedIds, condText) => {
              setMatchedRowIds(matchedIds)
              setFilterConditionText(condText)
            }}
            onNewDatasetCreated={(newId) => {
              onLoadDatasetById(newId)
            }}
          />

          <SortCasesModal
            isOpen={activeModal === 'sort'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={(_up, newId) => {
              if (newId) onLoadDatasetById(newId)
              else onLoadDatasetById(datasetId)
            }}
          />

          <DuplicateCasesModal
            isOpen={activeModal === 'duplicate'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={(_up, newId) => {
              if (newId) onLoadDatasetById(newId)
              else onLoadDatasetById(datasetId)
            }}
          />

          <MissingSummaryModal
            isOpen={activeModal === 'missingSummary'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
          />

          {/* Tahap 6: Modal Dialogs Statistik Lanjutan */}
          <TTestModal
            isOpen={activeModal === 'ttest'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={() => {
              setActiveModal(null)
            }}
          />

          <AnovaModal
            isOpen={activeModal === 'anova'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={() => {
              setActiveModal(null)
            }}
          />

          <NonparametricModal
            isOpen={activeModal === 'nonparametric'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={() => {
              setActiveModal(null)
            }}
          />

          <CrosstabsModal
            isOpen={activeModal === 'crosstabs'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={() => {
              setActiveModal(null)
            }}
          />

          <LogisticRegressionModal
            isOpen={activeModal === 'logistic'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
            onSuccess={() => {
              setActiveModal(null)
            }}
          />

          <ChartsModal
            isOpen={activeModal === 'charts'}
            onClose={() => setActiveModal(null)}
            datasetId={datasetId}
            variables={variables}
          />
        </>
      )}
    </div>
  )
}

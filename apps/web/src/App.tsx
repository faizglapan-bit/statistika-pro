import { useState, useEffect } from 'react'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { ProjectHeaderBar } from '@/components/ProjectHeaderBar'
import { ProjectManagerModal } from '@/components/ProjectManagerModal'
import { UnsavedChangesModal } from '@/components/UnsavedChangesModal'
import { DashboardView } from '@/components/DashboardView'
import { DataEditorView } from '@/components/DataEditorView'
import { AnalysisCatalogView } from '@/components/AnalysisCatalogView'
import { OutputView } from '@/components/OutputView'
import { ReportGeneratorView } from '@/components/ReportGeneratorView'
import { AdvancedAnalysisView } from '@/components/AdvancedAnalysisView'
import { ComingSoonView } from '@/components/ComingSoonView'
import {
  DescriptiveDialog,
  ValidityDialog,
  ReliabilityDialog,
  CorrelationDialog,
  RegressionDialog,
  DiagnosticsDialog,
} from '@/components/dialogs'
import { useBackendHealth } from '@/hooks/useBackendHealth'
import { useDataEditor } from '@/hooks/useDataEditor'
import { MenuId, AnalysisOutput, ProjectDetail } from '@/types'
import * as projectApi from '@/services/projectApi'

type DialogType = 'descriptive' | 'validity' | 'reliability' | 'correlation' | 'regression' | 'diagnostics' | null

function AppContent() {
  const [activeMenu, setActiveMenu] = useState<MenuId>('dashboard')
  const [activeDialog, setActiveDialog] = useState<DialogType>(null)
  const [latestOutput, setLatestOutput] = useState<AnalysisOutput | null>(null)

  // Project state
  const [currentProject, setCurrentProject] = useState<ProjectDetail | null>(null)
  const [showProjectManager, setShowProjectManager] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [isSavingProject, setIsSavingProject] = useState(false)

  const { status: backendStatus, checkHealth } = useBackendHealth()
  const editor = useDataEditor()

  // Load initial active project on mount
  useEffect(() => {
    const initProject = async () => {
      try {
        const list = await projectApi.fetchProjects()
        if (list.length > 0) {
          const detail = await projectApi.fetchProject(list[0].id)
          setCurrentProject(detail)
          if (detail.dataset && !editor.datasetId) {
            editor.initFromDataset(detail.dataset)
          }
        }
      } catch (err) {
        console.error('Inisialisasi proyek awal:', err)
      }
    }
    initProject()
  }, [])

  // Browser beforeunload prompt if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!editor.isSaved) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [editor.isSaved])

  const handleMenuChange = (id: MenuId) => {
    setActiveMenu(id)
    if (id === 'data-editor') {
      editor.setActiveTab('data-view')
    } else if (id === 'variable-view') {
      editor.setActiveTab('variable-view')
    }
  }

  const handleTabChange = (tab: 'data-view' | 'variable-view') => {
    editor.setActiveTab(tab)
    if (tab === 'data-view') {
      setActiveMenu('data-editor')
    } else {
      setActiveMenu('variable-view')
    }
  }

  // Safe action executor checking dirty state
  const executeWithDirtyCheck = (action: () => void) => {
    if (!editor.isSaved) {
      setPendingAction(() => action)
      setShowUnsavedModal(true)
    } else {
      action()
    }
  }

  const handleSaveProject = async () => {
    setIsSavingProject(true)
    try {
      // 1. Simpan dataset
      await editor.saveDataset()

      // 2. Simpan proyek jika ada ID
      if (currentProject) {
        const updated = await projectApi.saveProject(currentProject.id, {
          name: currentProject.name,
          active_dataset_id: editor.datasetId || undefined,
        })
        setCurrentProject(updated)
      }
    } catch (err: any) {
      console.error('Gagal menyimpan proyek:', err)
    } finally {
      setIsSavingProject(false)
    }
  }

  const handleNewProject = () => {
    executeWithDirtyCheck(async () => {
      try {
        const created = await projectApi.createProject({
          name: 'Proyek Baru',
          description: '',
        })
        setCurrentProject(created)
        if (created.dataset) {
          editor.initFromDataset(created.dataset)
        } else {
          editor.newProject()
        }
        setActiveMenu('data-editor')
      } catch (err) {
        editor.newProject()
        setActiveMenu('data-editor')
      }
    })
  }

  const handleSelectProject = (project: ProjectDetail) => {
    executeWithDirtyCheck(() => {
      setCurrentProject(project)
      if (project.dataset) {
        editor.initFromDataset(project.dataset)
      }
      setActiveMenu('data-editor')
    })
  }

  const handleDuplicateProject = async () => {
    if (!currentProject) return
    try {
      const dup = await projectApi.duplicateProject(currentProject.id)
      setCurrentProject(dup)
      if (dup.dataset) {
        editor.initFromDataset(dup.dataset)
      }
    } catch (err) {
      console.error('Gagal menggandakan proyek:', err)
    }
  }

  const handleUpdateProjectName = async (newName: string) => {
    if (!currentProject) return
    try {
      const updated = await projectApi.saveProject(currentProject.id, { name: newName })
      setCurrentProject(updated)
    } catch (err) {
      console.error('Gagal memperbarui nama proyek:', err)
    }
  }

  const handleOpenAnalysisDialog = (type: NonNullable<DialogType>) => {
    setActiveDialog(type)
  }

  const handleAnalysisSuccess = (output: AnalysisOutput) => {
    setLatestOutput(output)
    setActiveDialog(null)
    setActiveMenu('output')
  }

  const handleReRunAnalysis = (analysisType: string) => {
    if (['descriptive', 'validity', 'reliability', 'correlation', 'regression', 'diagnostics'].includes(analysisType)) {
      setActiveDialog(analysisType as DialogType)
    } else {
      setActiveMenu('advanced-analysis')
    }
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <DashboardView
            backendStatus={backendStatus}
            onNavigate={handleMenuChange}
            onCheckHealth={checkHealth}
          />
        )
      case 'data-editor':
      case 'variable-view':
        return (
          <DataEditorView
            datasetId={editor.datasetId}
            datasetName={editor.datasetName}
            setDatasetName={editor.setDatasetName}
            variables={editor.variables}
            rows={editor.rows}
            isSaved={editor.isSaved}
            isDemo={editor.isDemo}
            isLoading={editor.isLoading}
            statusMessage={editor.statusMessage}
            missingCount={editor.missingCount}
            activeTab={editor.activeTab}
            setActiveTab={handleTabChange}
            selectedCell={editor.selectedCell}
            setSelectedCell={editor.setSelectedCell}
            onAddRow={editor.addRow}
            onDeleteRow={editor.deleteRow}
            onAddColumn={editor.addColumn}
            onDeleteColumn={editor.deleteColumn}
            onCellChange={editor.updateCell}
            onUpdateVariable={editor.updateVariable}
            onPasteFromClipboard={editor.pasteFromClipboard}
            onSaveDataset={editor.saveDataset}
            onNewProject={editor.newProject}
            onLoadDemo={editor.loadDemo}
            onLoadDatasetById={editor.loadDatasetById}
            onImportSuccess={editor.initFromDataset}
            onOpenAnalysisDialog={handleOpenAnalysisDialog}
          />
        )
      case 'analysis':
        return (
          <AnalysisCatalogView
            datasetId={editor.datasetId}
            datasetName={editor.datasetName}
            variables={editor.variables}
            onOpenDialog={handleOpenAnalysisDialog}
            onNavigateToEditor={() => handleMenuChange('data-editor')}
          />
        )
      case 'advanced-analysis':
        return (
          <AdvancedAnalysisView
            datasetId={editor.datasetId}
            datasetName={editor.datasetName}
            variables={editor.variables}
            rows={editor.rows}
            onNavigateToOutput={() => setActiveMenu('output')}
            onNavigateToEditor={() => handleMenuChange('data-editor')}
          />
        )
      case 'output':
        return (
          <OutputView
            activeDatasetId={editor.datasetId}
            activeDatasetName={editor.datasetName}
            activeDatasetUpdatedAt={editor.project?.lastSaved?.toISOString()}
            variables={editor.variables}
            onBackToEditor={() => handleMenuChange('data-editor')}
            onReRunAnalysis={handleReRunAnalysis}
            initialOutput={latestOutput}
            onNavigateToReports={() => setActiveMenu('reports')}
          />
        )
      case 'reports':
        return (
          <ReportGeneratorView
            activeDataset={
              editor.datasetId
                ? {
                    id: editor.datasetId,
                    name: editor.datasetName,
                    description: '',
                    row_count: editor.rows.length,
                    variable_count: editor.variables.length,
                    missing_count: editor.missingCount,
                    is_demo: editor.isDemo,
                    created_at: '',
                    updated_at: editor.project?.lastSaved?.toISOString() || '',
                  }
                : null
            }
            onOpenAnalysis={() => setActiveMenu('analysis')}
          />
        )
      default:
        return (
          <ComingSoonView
            menuId={activeMenu}
            onBack={() => setActiveMenu('dashboard')}
          />
        )
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Header */}
      <Header
        backendStatus={backendStatus}
        project={editor.project}
        onNewProject={handleNewProject}
      />

      {/* Tahap 7: Project Header Bar */}
      <ProjectHeaderBar
        projectName={currentProject?.name || editor.datasetName || 'Proyek Penelitian'}
        projectId={currentProject?.id || null}
        isDirty={!editor.isSaved}
        isSaving={isSavingProject}
        onSaveProject={handleSaveProject}
        onOpenProjectManager={() => setShowProjectManager(true)}
        onNewProject={handleNewProject}
        onDuplicateProject={handleDuplicateProject}
        onUpdateProjectName={handleUpdateProjectName}
      />

      {/* Body: sidebar + content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          activeMenu={activeMenu}
          onMenuChange={handleMenuChange}
          backendStatus={backendStatus}
        />

        {/* Main content */}
        <main
          style={{
            flex: 1,
            overflow: 'hidden',
            backgroundColor: '#0b1120',
            position: 'relative',
          }}
        >
          {renderContent()}
        </main>
      </div>

      {/* Analysis Modals */}
      <DescriptiveDialog
        isOpen={activeDialog === 'descriptive'}
        onClose={() => setActiveDialog(null)}
        datasetId={editor.datasetId}
        datasetName={editor.datasetName}
        datasetUpdatedAt={editor.project?.lastSaved?.toISOString()}
        variables={editor.variables}
        onSuccess={handleAnalysisSuccess}
      />

      <ValidityDialog
        isOpen={activeDialog === 'validity'}
        onClose={() => setActiveDialog(null)}
        datasetId={editor.datasetId}
        datasetName={editor.datasetName}
        datasetUpdatedAt={editor.project?.lastSaved?.toISOString()}
        variables={editor.variables}
        onSuccess={handleAnalysisSuccess}
      />

      <ReliabilityDialog
        isOpen={activeDialog === 'reliability'}
        onClose={() => setActiveDialog(null)}
        datasetId={editor.datasetId}
        datasetName={editor.datasetName}
        datasetUpdatedAt={editor.project?.lastSaved?.toISOString()}
        variables={editor.variables}
        onSuccess={handleAnalysisSuccess}
      />

      <CorrelationDialog
        isOpen={activeDialog === 'correlation'}
        onClose={() => setActiveDialog(null)}
        datasetId={editor.datasetId}
        datasetName={editor.datasetName}
        datasetUpdatedAt={editor.project?.lastSaved?.toISOString()}
        variables={editor.variables}
        onSuccess={handleAnalysisSuccess}
      />

      <RegressionDialog
        isOpen={activeDialog === 'regression'}
        onClose={() => setActiveDialog(null)}
        datasetId={editor.datasetId}
        datasetName={editor.datasetName}
        datasetUpdatedAt={editor.project?.lastSaved?.toISOString()}
        variables={editor.variables}
        onSuccess={handleAnalysisSuccess}
      />

      <DiagnosticsDialog
        isOpen={activeDialog === 'diagnostics'}
        onClose={() => setActiveDialog(null)}
        datasetId={editor.datasetId}
        datasetName={editor.datasetName}
        datasetUpdatedAt={editor.project?.lastSaved?.toISOString()}
        variables={editor.variables}
        onSuccess={handleAnalysisSuccess}
      />

      {/* Tahap 7: Project Modals */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onClose={() => {
          setShowUnsavedModal(false)
          setPendingAction(null)
        }}
        projectName={currentProject?.name || editor.datasetName}
        onSaveAndProceed={async () => {
          await handleSaveProject()
          setShowUnsavedModal(false)
          if (pendingAction) {
            pendingAction()
            setPendingAction(null)
          }
        }}
        onDiscardAndProceed={() => {
          setShowUnsavedModal(false)
          if (pendingAction) {
            pendingAction()
            setPendingAction(null)
          }
        }}
      />

      <ProjectManagerModal
        isOpen={showProjectManager}
        onClose={() => setShowProjectManager(false)}
        currentProjectId={currentProject?.id || null}
        onSelectProject={handleSelectProject}
      />
    </div>
  )
}

export function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App

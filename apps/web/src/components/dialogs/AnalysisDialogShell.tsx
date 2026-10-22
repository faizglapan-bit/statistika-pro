import React from 'react'
import { X, Loader2, AlertCircle, Database } from 'lucide-react'
import { VariableDefinition } from '@/types'

export interface AnalysisDialogShellProps {
  isOpen: boolean
  title: string
  subtitle?: string
  datasetId: string | null
  datasetName: string
  variables?: VariableDefinition[]
  onClose: () => void
  onRun: () => Promise<void>
  onReset: () => void
  isRunning: boolean
  errorMessage: string | null
  children?: React.ReactNode
}

export function AnalysisDialogShell({
  isOpen,
  title,
  subtitle,
  datasetId,
  datasetName,
  onClose,
  onRun,
  onReset,
  isRunning,
  errorMessage,
  children,
}: AnalysisDialogShellProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={e => {
        if (e.target === e.currentTarget && !isRunning) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '10px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            background: '#0f172a',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{title}</span>
            </div>
            {subtitle && (
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                {subtitle}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid #475569',
                fontSize: '11px',
                color: '#cbd5e1',
              }}
            >
              <Database size={13} className="text-blue-400" />
              <span>{datasetName || 'Dataset Aktif'}</span>
            </div>
            <button
              onClick={onClose}
              disabled={isRunning}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div
            style={{
              padding: '10px 16px',
              background: 'rgba(239, 68, 68, 0.15)',
              borderBottom: '1px solid #ef4444',
              color: '#fca5a5',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {children}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 20px',
            background: '#0f172a',
            borderTop: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            onClick={onReset}
            disabled={isRunning}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: 'transparent',
              border: '1px solid #475569',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isRunning}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#334155',
                border: 'none',
                color: '#e2e8f0',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onRun}
              disabled={isRunning || !datasetId}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                background: isRunning || !datasetId ? '#1e3a8a' : '#2563eb',
                border: 'none',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isRunning || !datasetId ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)',
              }}
            >
              {isRunning ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Jalankan Analisis (OK)</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

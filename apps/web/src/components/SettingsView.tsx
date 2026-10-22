import React, { useState, useEffect } from 'react'
import { Server, CheckCircle2, XCircle, RefreshCw, Save, ShieldAlert, Globe, HardDrive } from 'lucide-react'
import { getApiBaseUrl } from '@/services/apiConfig'
import { BackendStatus } from '@/types'

interface Props {
  backendStatus: BackendStatus
  onRefreshHealth: () => void
}

export const SettingsView: React.FC<Props> = ({ backendStatus, onRefreshHealth }) => {
  const [apiUrl, setApiUrl] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    latency?: number
  } | null>(null)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    const current = localStorage.getItem('statpro_custom_api_url') || getApiBaseUrl()
    setApiUrl(current)
  }, [])

  const handleTestConnection = async (targetUrl: string) => {
    setIsTesting(true)
    setTestResult(null)
    const startTime = performance.now()
    const cleanUrl = targetUrl.trim().replace(/\/+$/, '')
    const endpoint = cleanUrl ? `${cleanUrl}/api/health` : '/api/health'

    try {
      const res = await fetch(endpoint, { method: 'GET' })
      const latency = Math.round(performance.now() - startTime)
      if (res.ok) {
        const data = await res.json()
        setTestResult({
          success: true,
          message: `Terhubung! Server: ${data.app_name || 'Statistika Pro API'} (v${data.version || '1.0.0'})`,
          latency,
        })
      } else {
        setTestResult({
          success: false,
          message: `Server merespon dengan status HTTP ${res.status}.`,
        })
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Gagal terhubung (${err.message || 'Network Error'}). Periksa URL dan CORS server Anda.`,
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = () => {
    const cleanUrl = apiUrl.trim().replace(/\/+$/, '')
    if (cleanUrl) {
      localStorage.setItem('statpro_custom_api_url', cleanUrl)
    } else {
      localStorage.removeItem('statpro_custom_api_url')
    }
    setSavedSuccess(true)
    onRefreshHealth()
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const handleReset = () => {
    localStorage.removeItem('statpro_custom_api_url')
    setApiUrl('')
    setTestResult(null)
    onRefreshHealth()
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', color: '#f8fafc' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={22} className="text-blue-400" />
          Pengaturan Koneksi Backend API
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
          Hubungkan website frontend ini dengan server backend Python Anda (Hugging Face Spaces, Render, atau Localhost).
        </p>
      </div>

      {/* Status Card */}
      <div
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {backendStatus === 'online' || backendStatus === 'local' ? (
            <CheckCircle2 size={24} color="#10b981" />
          ) : (
            <XCircle size={24} color="#ef4444" />
          )}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>
              Status Sistem Saat Ini:{' '}
              <span style={{ color: backendStatus === 'online' ? '#34d399' : backendStatus === 'local' ? '#38bdf8' : '#f87171' }}>
                {backendStatus === 'online'
                  ? 'ONLINE (Cloud Server Terhubung)'
                  : backendStatus === 'local'
                  ? 'MODE LOKAL OFFLINE (Mesin Browser Siap)'
                  : 'OFFLINE (Terputus)'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {backendStatus === 'online'
                ? 'Semua kalkulasi statistik dan penyimpanan cloud server siap digunakan.'
                : 'Mesin statistik internal browser aktif: semua menu analisis & penyimpanan berjalan mandiri di browser tanpa server.'}
            </div>
          </div>
        </div>
        <button
          onClick={onRefreshHealth}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: '#334155',
            border: '1px solid #475569',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} />
          Periksa Ulang
        </button>
      </div>

      {/* URL Input Form */}
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px',
        }}
      >
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
          URL Server Backend API:
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={apiUrl}
            onChange={e => setApiUrl(e.target.value)}
            placeholder="Contoh: https://AcH-Faiz-statistika-pro-api.hf.space atau http://127.0.0.1:8000"
            style={{
              flex: 1,
              padding: '8px 12px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button
            onClick={() => handleTestConnection(apiUrl)}
            disabled={isTesting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#2563eb',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isTesting ? 'not-allowed' : 'pointer',
            }}
          >
            {isTesting ? <RefreshCw size={14} className="animate-spin" /> : <Globe size={14} />}
            Tes Koneksi
          </button>
        </div>

        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '16px' }}>
          Kosongkan untuk menggunakan URL relatif bawaan (Netlify proxy / reverse proxy).
        </div>

        {testResult && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${testResult.success ? '#10b981' : '#ef4444'}`,
              color: testResult.success ? '#34d399' : '#f87171',
            }}
          >
            {testResult.success ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
            <span>
              {testResult.message} {testResult.latency !== undefined && `(${testResult.latency} ms)`}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#10b981',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Save size={14} />
            Simpan & Terapkan
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 14px',
              background: '#334155',
              border: '1px solid #475569',
              borderRadius: '6px',
              color: '#cbd5e1',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Reset Bawaan
          </button>
        </div>

        {savedSuccess && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#34d399', fontWeight: 600 }}>
            Pengaturan berhasil disimpan dan diterapkan!
          </div>
        )}
      </div>

      {/* Info Card: Offline Storage */}
      <div
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '10px',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <HardDrive size={18} className="text-amber-400" />
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>
            Mode Penyimpanan Offline (Lokal Browser)
          </h3>
        </div>
        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
          Saat backend offline, tombol <strong>Simpan</strong> di Editor Data secara otomatis menyimpan data ke{' '}
          <code>LocalStorage</code> browser Anda. Data Anda tidak akan hilang saat halaman direfresh atau browser ditutup.
          Anda juga dapat mengekspor dataset Anda ke format <strong>CSV, Excel (XLSX), atau bundle .statpro</strong> kapan saja melalui menu Ekspor di toolbar atas.
        </p>
      </div>
    </div>
  )
}

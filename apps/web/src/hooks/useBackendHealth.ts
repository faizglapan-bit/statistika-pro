import { useState, useEffect, useCallback } from 'react'
import { BackendStatus, HealthResponse } from '@/types'
import { buildApiUrl } from '@/services/apiConfig'

export function useBackendHealth() {
  const [status, setStatus] = useState<BackendStatus>('checking')
  const [healthData, setHealthData] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = useCallback(async () => {
    setStatus('checking')
    setError(null)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const healthEndpoint = buildApiUrl('/api/health')
      const res = await fetch(healthEndpoint, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: HealthResponse = await res.json()
      setHealthData(data)
      setStatus('online')
    } catch (err) {
      setStatus('offline')
      setHealthData(null)
      if (err instanceof Error) {
        setError(err.name === 'AbortError' ? 'Timeout' : err.message)
      }
    }
  }, [])

  useEffect(() => {
    checkHealth()
    // Re-check every 30 seconds
    const interval = setInterval(checkHealth, 30_000)
    return () => clearInterval(interval)
  }, [checkHealth])

  return { status, healthData, error, checkHealth }
}

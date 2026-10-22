/**
 * API Configuration Module — Statistika Pro
 *
 * Provides centralized resolution for backend API URLs:
 * 1. Checks if a custom API URL has been set in localStorage (e.g. from Settings)
 * 2. Fallbacks to import.meta.env.VITE_API_URL if configured
 * 3. Fallbacks to relative URL '' (which routes through Vite dev proxy or Nginx reverse proxy)
 */

export function getApiBaseUrl(): string {
  // 1. Settings override in localStorage
  try {
    const customUrl = localStorage.getItem('statpro_custom_api_url')
    if (customUrl && customUrl.trim()) {
      return customUrl.trim().replace(/\/+$/, '')
    }
  } catch {
    // localStorage might not be accessible in all environments
  }

  // 2. Vite environment variable
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '')
  }

  // 3. Default relative path (uses proxy / same-origin in production)
  return ''
}

export function buildApiUrl(endpoint: string): string {
  const base = getApiBaseUrl()
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${base}${cleanEndpoint}`
}

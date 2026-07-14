const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

let accessToken: string | null = null
let refreshToken: string | null = null

export function setTokens(access: string, refresh: string) {
  accessToken = access
  refreshToken = refresh
  if (typeof window !== 'undefined') {
    localStorage.setItem('sc_refresh', refresh)
  }
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sc_refresh')
  }
}

export function getAccessToken() {
  return accessToken
}

export function loadRefreshToken() {
  if (typeof window !== 'undefined') {
    refreshToken = localStorage.getItem('sc_refresh')
  }
  return refreshToken
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) {
      clearTokens()
      return false
    }
    const data = await res.json()
    accessToken = data.accessToken
    refreshToken = data.refreshToken
    if (typeof window !== 'undefined') {
      localStorage.setItem('sc_refresh', data.refreshToken)
    }
    return true
  } catch {
    clearTokens()
    return false
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch (fetchErr: any) {
    throw new Error(`Cannot reach backend at ${API_BASE}. Is the backend running? (${fetchErr.message})`)
  }

  if (res.status === 401 && refreshToken) {
    const ok = await refreshAccessToken()
    if (ok) {
      headers['Authorization'] = `Bearer ${accessToken}`
      res = await fetch(`${API_BASE}${path}`, { ...options, headers })
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }

  return res.json()
}

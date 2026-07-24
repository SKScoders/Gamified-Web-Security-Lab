import { apiFetch, setTokens, clearTokens, getAccessToken } from './api-client'
import type { User, Level, LeaderboardEntry, AuditLogEntry, LevelCardData, Hint, DiffLine } from '@/types'

interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

interface LevelResponse extends Level {
  status: string
  attempts: number
  score: number
  startedAt: string | null
  completedAt: string | null
  bestTime: string | null
}

interface StartResponse {
  id: string
  userId: string
  levelId: string
  status: string
  attempts: number
  score: number
  startedAt: string | null
  completedAt: string | null
  bestTime: string | null
}

interface SubmitResponse {
  correct: boolean
  attempts: number
  stageToken?: string
  score?: number
  completedAt?: string
}

interface CompleteResponse {
  progressId: string
  stageToken: string
  score: number
  completedAt: string
}

interface HintResponse {
  id: string
  levelId: string
  hintOrder: number
  title: string
  content?: string
  scorePenalty: number
  revealed: boolean
}

interface DashboardSummary {
  totalScore: number
  levelsSolved: number
  rank: number
  recentActivity: {
    eventType: string
    payloadJson: string
    createdAt: string
  }[]
}

interface ReportResponse {
  id: string
  userId: string
  summaryJson: string
  generatedAt: string
}

interface DefenseMirrorResponse {
  levelId: string
  title: string
  remediation: string
  review: {
    vulnerable: DiffLine[]
    patched: DiffLine[]
    bestPractices: string
  }
}

interface ReviewStatusResponse {
  total: number
  viewed: number
  levels: Array<{
    id: string
    title: string
    orderIndex: number
    viewed: boolean
  }>
}

export const auth = {
  register: (email: string, password: string, displayName: string) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    }).then((res) => {
      setTokens(res.accessToken, res.refreshToken)
      return res
    }),

  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then((res) => {
      setTokens(res.accessToken, res.refreshToken)
      return res
    }),

  logout: () => {
    const refresh = refreshToken
    return apiFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: refresh }),
    }).then(() => {
      clearTokens()
    })
  },
}

export const levels = {
  list: () => apiFetch<LevelResponse[]>('/levels'),

  start: (levelId: string) =>
    apiFetch<StartResponse>(`/levels/${levelId}/start`, { method: 'POST' }),

  submit: (levelId: string, proof: string) =>
    apiFetch<SubmitResponse>(`/levels/${levelId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ proof }),
    }),

  complete: (levelId: string) =>
    apiFetch<CompleteResponse>(`/levels/${levelId}/complete`, { method: 'POST' }),

  defenseMirror: (levelId: string) =>
    apiFetch<DefenseMirrorResponse>(`/levels/${levelId}/defense-mirror`),
}

export const hints = {
  list: (levelId: string) =>
    apiFetch<HintResponse[]>(`/levels/${levelId}/hints`),

  reveal: (levelId: string, hintId: string) =>
    apiFetch<HintResponse>(`/levels/${levelId}/hints/${hintId}/reveal`, {
      method: 'POST',
    }),
}

export const leaderboard = {
  get: (timeframe: 'all' | 'week' = 'all') =>
    apiFetch<{ totalLevels: number; entries: LeaderboardEntry[] }>(`/leaderboard?timeframe=${timeframe}`),
}

export const dashboard = {
  summary: () => apiFetch<DashboardSummary>('/dashboard/summary'),
}

export const audit = {
  get: (userId: string) =>
    apiFetch<AuditLogEntry[]>(`/audit/${userId}`),
}

export const reports = {
  generate: () =>
    apiFetch<ReportResponse>('/reports/generate', { method: 'POST' }),

  get: (reportId: string) =>
    apiFetch<ReportResponse>(`/reports/${reportId}`),

  status: () =>
    apiFetch<ReviewStatusResponse>('/reports/status'),

  downloadPdf: async (reportId: string): Promise<Blob> => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
    const token = getAccessToken()
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}/reports/${reportId}/download`, { headers })
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Download failed' }))
      throw new Error(body.error || `HTTP ${res.status}`)
    }
    return res.blob()
  },
}

export function toLevelCard(level: LevelResponse): LevelCardData {
  return {
    id: level.id,
    title: level.title,
    description: level.description,
    category: level.vulnCategory,
    owasp: level.owaspCategory,
    difficulty: level.difficulty,
    status: level.status as 'locked' | 'in-progress' | 'solved',
    order: level.orderIndex,
    points: level.points,
    attempts: level.attempts || undefined,
    bestTime: level.bestTime || undefined,
    completedAt: level.completedAt,
  }
}

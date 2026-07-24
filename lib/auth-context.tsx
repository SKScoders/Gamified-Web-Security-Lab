'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User } from '@/types'
import { auth as authApi, dashboard } from '@/lib/api'
import { loadRefreshToken, clearTokens, apiFetch } from '@/lib/api-client'

interface AuthState {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  totalScore: number
  levelsSolved: number
  rank: number
  streak: number
  refreshDashboard: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  totalScore: 0,
  levelsSolved: 0,
  rank: 0,
  streak: 0,
  refreshDashboard: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [totalScore, setTotalScore] = useState(0)
  const [levelsSolved, setLevelsSolved] = useState(0)
  const [rank, setRank] = useState(0)
  const [streak, setStreak] = useState(0)

  const fetchDashboard = useCallback(async () => {
    try {
      const summary = await dashboard.summary()
      setTotalScore(summary.totalScore)
      setLevelsSolved(summary.levelsSolved)
      setRank(summary.rank)
      setStreak(summary.streak ?? 0)
    } catch (err) {
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('Unauthorized'))) {
        clearTokens()
        setUser(null)
      }
    }
  }, [])

  useEffect(() => {
    const token = loadRefreshToken()
    if (!token) {
      setIsLoading(false)
      return
    }
    apiFetch<{ id: string; email: string; displayName: string; createdAt: string }>('/auth/me')
      .then((u) => {
        setUser({
          id: u.id,
          email: u.email,
          displayName: u.displayName,
          createdAt: u.createdAt,
        })
        return fetchDashboard()
      })
      .catch(() => {
        clearTokens()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      })
      .finally(() => setIsLoading(false))
  }, [fetchDashboard])

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    setUser(res.user)
    await fetchDashboard()
  }

  const register = async (email: string, password: string, displayName: string) => {
    const res = await authApi.register(email, password, displayName)
    setUser(res.user)
    await fetchDashboard()
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
    setTotalScore(0)
    setLevelsSolved(0)
    setRank(0)
    setStreak(0)
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, totalScore, levelsSolved, rank, streak, refreshDashboard: fetchDashboard }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

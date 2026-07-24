'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LevelCard } from '@/components/dashboard/level-card'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { ArrowRight, Zap, Trophy, Target } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { levels as levelsApi, audit, toLevelCard } from '@/lib/api'
import type { LevelCardData, AuditLogEntry } from '@/types'

export default function DashboardPage() {
  const { user, totalScore, levelsSolved, rank, streak } = useAuth()
  const [levelCards, setLevelCards] = useState<LevelCardData[]>([])
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    Promise.all([
      levelsApi.list(),
      user ? audit.get(user.id).catch(() => []) : Promise.resolve([]),
    ]).then(([levelsData, auditData]) => {
      setLevelCards(levelsData.map(toLevelCard))
      setAuditLog(auditData)
    }).catch((err) => {
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) return
      if (err.message?.includes('Cannot reach backend')) {
        setError('Unable to connect to the server. Please check that the backend is running.')
      } else {
        setError('Failed to load dashboard data. Please try again.')
      }
    }).finally(() => setLoading(false))
  }, [user])

  const activeLevel = levelCards.find((l) => l.status === 'in-progress' && l.startedAt)
  const completedCount = levelCards.filter((l) => l.status === 'solved').length

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-auto bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {error && (
            <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-4">
              <p className="text-sm text-status-red font-medium">{error}</p>
            </div>
          )}
          {/* Welcome Section */}
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome back, {user?.displayName?.split(' ')[0] || 'Hacker'}
            </h1>
            <p className="text-muted-foreground text-lg">
              Continue your security training journey. You&apos;re making great progress.
            </p>
          </div>

          {/* Stats Grid */}
          <StatsGrid stats={{ totalPoints: totalScore, levelsSolved, streak, rank, totalLevels: levelCards.length || undefined }} />

          {/* Hero Progress Stepper */}
          <Card className="border-accent/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Chain Progress</h3>
              <span className="text-sm font-mono text-accent">{completedCount}/{levelCards.length || 4} levels</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              {levelCards.map((level, idx) => (
                <div key={level.id} className="flex items-center flex-1">
                  <div
                    className={`w-full h-1.5 rounded-full ${
                      level.status === 'solved'
                        ? 'bg-status-green'
                        : level.status === 'in-progress'
                          ? 'bg-accent'
                          : 'bg-surface-secondary'
                    }`}
                  />
                  {idx < levelCards.length - 1 && (
                    <div className="w-2 h-2 rounded-full bg-border mx-1 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
              {levelCards.map((level) => (
                <div key={level.id} className="text-center">
                  <span className={level.status === 'solved' ? 'text-status-green' : level.status === 'in-progress' ? 'text-accent' : ''}>
                    {level.title.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Continue Card */}
          {activeLevel && (
            <Card className="border-accent/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Continue where you left off</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeLevel.title} - {activeLevel.attempts > 0
                      ? `${activeLevel.attempts} attempt(s) in progress`
                      : `Started — no attempts yet`}
                  </p>
                </div>
                <Link href={`/level/${activeLevel.id}`}>
                  <Button className="gap-2">
                    Continue <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/playground">
              <Card className="hover:border-accent/50 transition-colors cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-accent/10 rounded">
                    <Target size={24} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">All Challenges</h3>
                    <p className="text-xs text-muted-foreground">Browse and start new labs</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/leaderboard">
              <Card className="hover:border-accent/50 transition-colors cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-accent/10 rounded">
                    <Trophy size={24} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Leaderboard</h3>
                    <p className="text-xs text-muted-foreground">Rank #{rank} globally</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/profile">
              <Card className="hover:border-accent/50 transition-colors cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-accent/10 rounded">
                    <Zap size={24} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Your Profile</h3>
                    <p className="text-xs text-muted-foreground">View stats & achievements</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
            <Card>
              <div className="space-y-3">
                {auditLog.slice(0, 5).map((entry, idx) => {
                  const payload = JSON.parse(entry.payloadJson)
                  const levelTitle = levelCards.find((l) => l.id === payload.levelId)?.title || payload.levelId
                  return (
                    <div key={entry.id} className={`flex items-center justify-between ${idx > 0 ? 'pt-3 border-t border-border' : ''}`}>
                      <div>
                        <p className="text-sm font-medium">
                          {entry.eventType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                          {': '}
                          {levelTitle}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{new Date(entry.createdAt).toLocaleString()}</p>
                      </div>
                      {entry.eventType === 'level_completed' && (
                        <span className="text-xs font-mono font-semibold text-status-green">
                          +{payload.score} pts
                        </span>
                      )}
                      {entry.eventType === 'hint_revealed' && (
                        <span className="text-xs font-mono text-status-amber">
                          Hint {payload.hintOrder}
                        </span>
                      )}
                    </div>
                  )
                })}
                {auditLog.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No activity yet. Start a challenge!</p>
                )}
              </div>
            </Card>
          </div>

          {/* Levels Section */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Available Challenges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {levelCards.map((level) => (
                <LevelCard key={level.id} level={level} />
              ))}
            </div>
          </div>

          {/* Info Section */}
          <Card className="bg-surface-secondary">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-accent" />
              About SentinelChain
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              SentinelChain is a gamified cybersecurity training platform designed to teach realistic web security
              vulnerabilities through hands-on exploitation. Each challenge builds upon previous knowledge, creating a
              complete learning path from authentication bypass to advanced privilege escalation.
            </p>
            <p className="text-xs text-muted-foreground">
              All challenges run in isolated environments with no impact to real systems. This is authorized training
              content only.
            </p>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  )
}

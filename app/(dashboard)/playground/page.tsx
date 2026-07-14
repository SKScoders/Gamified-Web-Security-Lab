'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { VerticalProgressLine } from '@/components/dashboard/vertical-progress-line'
import { Button } from '@/components/ui/button'
import { Lock, Play, CheckCircle, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { levels as levelsApi, toLevelCard } from '@/lib/api'
import type { LevelCardData } from '@/types'

export default function PlaygroundPage() {
  const { totalScore } = useAuth()
  const [levelCards, setLevelCards] = useState<LevelCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    levelsApi.list().then((data) => {
      setLevelCards(data.map(toLevelCard))
    }).catch((err) => {
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) return
      if (err.message?.includes('Cannot reach backend')) {
        setError('Unable to connect to the server. Please check that the backend is running.')
      } else {
        setError('Failed to load challenges. Please try again.')
      }
    }).finally(() => setLoading(false))
  }, [])

  const completedLevels = levelCards.filter((l) => l.status === 'solved').length
  const totalLevels = levelCards.length || 4
  const currentLevel = levelCards.find((l) => l.status === 'in-progress')

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto bg-background p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Security Challenges</h1>
            <p className="text-muted-foreground">
              Master real-world vulnerabilities through hands-on exploitation labs.
            </p>
          </div>

          {error && (
            <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-status-red font-medium">{error}</p>
            </div>
          )}

          {/* Progress Overview */}
          <Card className="mb-8">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Progress</div>
                <div className="text-2xl font-bold text-accent">
                  {completedLevels}/{totalLevels}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Current Level</div>
                <div className="text-sm font-medium">
                  {currentLevel?.title || (completedLevels === totalLevels ? 'All Complete' : 'None')}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total Score</div>
                <div className="text-2xl font-bold">{totalScore} pts</div>
              </div>
            </div>
          </Card>

          {/* Levels List with Progress Line */}
          <div className="space-y-6">
            <div className="flex gap-6">
              {/* Progress Line */}
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-accent mt-3" />
                <div className="w-1 flex-1 my-2 flex items-start pt-3">
                  <VerticalProgressLine total={totalLevels} completed={completedLevels} />
                </div>
                <div className="w-2 h-2 rounded-full bg-border" />
              </div>

              {/* Level Cards */}
              <div className="flex-1 space-y-4">
                {levelCards.map((level) => (
                  <Card
                    key={level.id}
                    className={`transition-all ${
                      level.status === 'locked'
                        ? 'opacity-60'
                        : level.status === 'in-progress'
                          ? 'border-accent/50 bg-surface-elevated'
                          : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-mono text-muted-foreground">#{level.order}</span>
                          <h3 className="text-lg font-semibold">{level.title}</h3>
                          {level.status === 'solved' && (
                            <CheckCircle size={18} className="text-status-green flex-shrink-0" />
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">{level.description}</p>

                        <div className="flex flex-wrap gap-3 items-center">
                          <span
                            className={`text-xs px-2 py-1 rounded border ${
                              level.difficulty === 'Easy'
                                ? 'border-status-green/50 text-status-green'
                                : level.difficulty === 'Intermediate'
                                  ? 'border-status-amber/50 text-status-amber'
                                  : 'border-status-red/50 text-status-red'
                            }`}
                          >
                            {level.difficulty}
                          </span>

                          <span className="text-xs bg-surface-secondary px-2 py-1 rounded text-muted-foreground">
                            {level.category}
                          </span>

                          <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-1 rounded">
                            {level.owasp}
                          </span>

                          {level.attempts && level.attempts > 0 && (
                            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                              <Clock size={12} />
                              {level.bestTime}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {level.status === 'locked' ? (
                          <div className="text-center">
                            <Lock size={24} className="text-muted-foreground mx-auto mb-2" />
                            <div className="text-xs text-muted-foreground">Locked</div>
                          </div>
                        ) : level.status === 'solved' ? (
                          <Link href={`/level/${level.id}/review`}>
                            <div className="text-center cursor-pointer hover:opacity-80 transition-opacity">
                              <CheckCircle size={24} className="text-status-green mx-auto mb-2" />
                              <div className="text-xs text-status-green">Review</div>
                            </div>
                          </Link>
                        ) : (
                          <Link href={`/level/${level.id}`}>
                            <Button size="sm" className="gap-2">
                              <Play size={14} />
                              Enter
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 border border-border rounded-lg bg-surface-secondary text-sm text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">How it works</p>
            <ul className="space-y-1 text-xs">
              <li>&#8226; Each level presents a real security vulnerability to exploit</li>
              <li>&#8226; Complete objectives within the lab environment</li>
              <li>&#8226; Submit your findings for server-side verification</li>
              <li>&#8226; Earn points and unlock the next level in the chain</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

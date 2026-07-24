'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, AlertCircle, CheckCircle, Trophy, Flag } from 'lucide-react'
import { Tabs } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { ResizableContainer } from '@/components/dashboard/resizable-container'
import { LabFrame } from '@/components/dashboard/lab-frame'
import { HintRow } from '@/components/dashboard/hint-row'
import { levels as levelsApi, hints as hintsApi } from '@/lib/api'
import type { Level, Hint } from '@/types'

interface LevelWithStatus extends Level {
  status: string
  attempts: number
  score: number
  startedAt: string | null
  completedAt: string | null
  bestTime: string | null
}

export default function LevelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = React.use(params)

  const [level, setLevel] = useState<LevelWithStatus | null>(null)
  const [levelHints, setLevelHints] = useState<Hint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [time, setTime] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [revealedHints, setRevealedHints] = useState<number[]>([])
  const [flagInput, setFlagInput] = useState('')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setError(null)
    Promise.all([
      levelsApi.list(),
      hintsApi.list(id),
    ]).then(async ([levelsData, hintsData]) => {
      const found = levelsData.find((l) => l.id === id)
      if (found) {
        setLevel(found)
        setAttempts(found.attempts || 0)
        setIsComplete(found.status === 'solved')
        if (found.status === 'in-progress' && found.startedAt) {
          const elapsed = Math.floor((Date.now() - new Date(found.startedAt).getTime()) / 1000)
          setTime(Math.max(0, elapsed))
        }
        if (found.status === 'in-progress' && !found.startedAt) {
          try {
            const started = await levelsApi.start(id)
            setLevel((prev) => prev ? { ...prev, startedAt: started.startedAt } : prev)
            if (started.startedAt) {
              const elapsed = Math.floor((Date.now() - new Date(started.startedAt).getTime()) / 1000)
              setTime(Math.max(0, elapsed))
            }
          } catch {}
        }
      }
      const revealedIds = hintsData.filter((h) => h.revealed).map((h) => h.hintOrder - 1)
      setRevealedHints(revealedIds)
      setLevelHints(hintsData.map((h) => ({ ...h, content: h.content || '' })))
    }).catch((err) => {
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) return
      if (err.message?.includes('Cannot reach backend')) {
        setError('Unable to connect to the server. Please check that the backend is running and try again.')
      } else {
        setError('Failed to load level data. Please try again.')
      }
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (isComplete) return
    const interval = setInterval(() => setTime((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [isComplete])

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const totalPenalty = revealedHints.reduce((sum, idx) => {
    const hint = levelHints[idx]
    return sum + (hint?.scorePenalty || 0)
  }, 0)

  const handleSubmitFlag = async () => {
    if (!level) return
    try {
      const result = await levelsApi.submit(level.id, flagInput)
      setAttempts(result.attempts)
      if (result.correct) {
        await levelsApi.complete(level.id)
        setSubmitStatus('correct')
        setIsComplete(true)
      } else {
        setSubmitStatus('wrong')
        setTimeout(() => setSubmitStatus('idle'), 2000)
      }
    } catch {
      setSubmitStatus('wrong')
      setTimeout(() => setSubmitStatus('idle'), 2000)
    }
  }

  const handleRevealHint = async (hintIndex: number) => {
    if (!level || revealedHints.includes(hintIndex)) return
    const hint = levelHints[hintIndex]
    if (!hint) return
    try {
      await hintsApi.reveal(level.id, hint.id)
      setRevealedHints((prev) => [...prev, hintIndex])
    } catch {}
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-sm text-muted-foreground">Loading level...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!level) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">{error ? 'Something went wrong' : 'Level not found'}</h2>
            <p className="text-muted-foreground mb-4">
              {error || "This level doesn't exist or hasn't been loaded yet."}
            </p>
            <Button onClick={() => router.push('/playground')}>Back to Playground</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const tabs = [
    {
      value: 'objective',
      label: 'Objective',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{level.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{level.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-border rounded p-3">
              <div className="text-xs text-muted-foreground mb-1">Difficulty</div>
              <div className="text-sm font-medium">{level.difficulty}</div>
            </div>
            <div className="border border-border rounded p-3">
              <div className="text-xs text-muted-foreground mb-1">Category</div>
              <div className="text-sm font-medium">{level.owaspCategory}</div>
            </div>
            <div className="border border-border rounded p-3">
              <div className="text-xs text-muted-foreground mb-1">CWE</div>
              <div className="text-sm font-mono font-medium">{level.cweId}</div>
            </div>
            <div className="border border-border rounded p-3">
              <div className="text-xs text-muted-foreground mb-1">Points Available</div>
              <div className="text-sm font-medium text-accent">{level.points} pts</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      value: 'hints',
      label: `Hints (${revealedHints.length}/3)`,
      content: (
        <div className="space-y-3">
          {levelHints.map((hint, idx) => (
            <HintRow
              key={hint.id}
              title={hint.title}
              content={hint.content}
              scorePenalty={hint.scorePenalty}
              revealed={revealedHints.includes(idx)}
              onReveal={() => handleRevealHint(idx)}
              disabled={isComplete}
            />
          ))}
        </div>
      ),
    },
    {
      value: 'submit',
      label: 'Submit Proof',
      content: (
        <div className="space-y-4">
          {isComplete ? (
            <div className="border border-status-green/50 rounded-lg p-6 bg-status-green/5 text-center">
              <CheckCircle size={32} className="text-status-green mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Level Complete!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You solved this in {formatTime(time)} with {attempts} attempt(s).
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => router.push('/playground')}>
                  Back to Playground
                </Button>
                <Button onClick={() => router.push(`/level/${id}/review`)}>
                  View Code Review
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="border border-border rounded p-4 bg-surface-secondary">
                <label className="block text-sm font-medium mb-2">Flag / Captured Token</label>
                <Input
                  type="text"
                  placeholder="SC{...}"
                  value={flagInput}
                  onChange={(e) => setFlagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && flagInput.trim() && handleSubmitFlag()}
                  className="bg-card"
                />
                {submitStatus === 'wrong' && (
                  <p className="text-xs text-status-red mt-2">Incorrect flag. Try again.</p>
                )}
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleSubmitFlag}
                disabled={!flagInput.trim()}
              >
                <Flag size={16} />
                Submit Answer
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col bg-background">
        {/* Top Status Bar */}
        <div className="border-b border-border bg-surface-elevated px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-accent" />
              <span className="text-sm font-mono">{formatTime(time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-status-amber" />
              <span className="text-sm font-mono">Attempt {attempts}/10</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-status-green" />
              <span className="text-sm font-mono">+{level.points - totalPenalty} pts available</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Hints used:</span>
            <span className="text-sm font-medium">{revealedHints.length}/3</span>
          </div>
        </div>

        {/* Resizable Split View */}
        <div className="flex-1 overflow-hidden">
          <ResizableContainer defaultLeftWidth={50} minLeftWidth={360} maxLeftWidth={75}>
            <LabFrame
              src={level?.labUrl || undefined}
              title={level ? `${level.title} — Lab Environment` : undefined}
            />
            <div className="overflow-auto p-6">
              <Tabs tabs={tabs} defaultValue="objective" />
            </div>
          </ResizableContainer>
        </div>
      </div>
    </DashboardLayout>
  )
}

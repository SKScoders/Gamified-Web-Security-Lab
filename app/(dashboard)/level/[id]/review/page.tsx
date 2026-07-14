'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { CodeComparison } from '@/components/dashboard/code-comparison'
import { Card } from '@/components/ui/card'
import { Collapsible } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Lock } from 'lucide-react'
import { levels as levelsApi } from '@/lib/api'
import type { Level, DiffLine } from '@/types'

function getCvssSeverity(score: number): { label: string; color: string } {
  if (score >= 9.0) return { label: 'Critical', color: 'text-status-red' }
  if (score >= 7.0) return { label: 'High', color: 'text-status-amber' }
  if (score >= 4.0) return { label: 'Medium', color: 'text-status-amber' }
  return { label: 'Low', color: 'text-status-green' }
}

interface ReviewData {
  levelId: string
  title: string
  remediation: string
  review: {
    vulnerable: DiffLine[]
    patched: DiffLine[]
    bestPractices: string
  }
}

export default function CodeReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = React.use(params)
  const [level, setLevel] = useState<Level | null>(null)
  const [reviewData, setReviewData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    setError(null)
    setLoading(true)

    levelsApi.list().then((data) => {
      const found = data.find((l) => l.id === id)
      if (found) setLevel(found)

      return levelsApi.defenseMirror(id)
    }).then((data) => {
      setReviewData(data)
    }).catch((err) => {
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) return
      if (err.message?.includes('Complete this level first')) {
        setLocked(true)
        setError('Complete this level first to unlock the defensive code review.')
      } else if (err.message?.includes('Cannot reach backend')) {
        setError('Unable to connect to the server. Please check that the backend is running.')
      } else {
        setError(err.message || 'Failed to load review data. Please try again.')
      }
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-sm text-muted-foreground">Loading review...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (locked || !reviewData) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            {locked ? (
              <Lock size={48} className="mx-auto mb-4 text-muted-foreground" />
            ) : null}
            <h2 className="text-xl font-semibold mb-2">{locked ? 'Level Not Completed' : 'Review not available'}</h2>
            <p className="text-muted-foreground mb-4 max-w-md">
              {error || "Code review for this level hasn't been loaded yet."}
            </p>
            <Button onClick={() => router.push('/playground')}>Back to Playground</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const severity = level ? getCvssSeverity(level.cvssScore) : null

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-full p-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 flex items-center gap-1"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <h1 className="text-2xl font-bold mb-2">Defensive Code Review</h1>
              <p className="text-muted-foreground">{reviewData.title} - Vulnerability Assessment</p>
            </div>
          </div>

          {/* Vulnerability Analysis */}
          {level && severity && (
            <Card className="mb-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Vulnerability Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-border rounded p-4">
                    <div className="text-xs text-muted-foreground mb-1">CVSS Score</div>
                    <div className={`text-2xl font-bold ${severity.color}`}>{level.cvssScore}</div>
                    <div className={`text-xs ${severity.color} mt-1`}>{severity.label}</div>
                  </div>
                  <div className="border border-border rounded p-4">
                    <div className="text-xs text-muted-foreground mb-1">OWASP Category</div>
                    <div className="text-sm font-medium">{level.owaspCategory} - {level.vulnCategory}</div>
                  </div>
                  <div className="border border-border rounded p-4">
                    <div className="text-xs text-muted-foreground mb-1">CWE ID</div>
                    <div className="text-sm font-medium">{level.cweId}: {level.cweTitle}</div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Code Comparison */}
          <Card className="mb-6">
            <CodeComparison
              leftCode={reviewData.review.vulnerable}
              rightCode={reviewData.review.patched}
              language="js"
              title="Code Comparison: Vulnerable vs. Patched"
            />
          </Card>

          {/* Remediation Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Remediation Details</h2>

            <Collapsible title="Best Practices" defaultOpen={true}>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>{reviewData.review.bestPractices}</p>
              </div>
            </Collapsible>

            <Collapsible title="Remediation Guidance">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>{reviewData.remediation}</p>
              </div>
            </Collapsible>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

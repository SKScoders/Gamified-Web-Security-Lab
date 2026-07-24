'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Collapsible } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Download, FileText, AlertTriangle, Eye } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { reports as reportsApi, levels as levelsApi } from '@/lib/api'
import type { Level } from '@/types'

interface LevelReport {
  level: Level
  progress: {
    attempts: number
    score: number
    bestTime: string | null
    startedAt: string | null
    completedAt: string | null
  }
  hintsUsed: any[]
  remediation: string
}

interface ReviewLevel {
  id: string
  title: string
  orderIndex: number
  viewed: boolean
}

interface ReviewStatus {
  total: number
  viewed: number
  levels: ReviewLevel[]
}

function getCvssSeverity(score: number): { label: string; color: string } {
  if (score >= 9.0) return { label: 'Critical', color: 'text-status-red' }
  if (score >= 7.0) return { label: 'High', color: 'text-status-amber' }
  if (score >= 4.0) return { label: 'Medium', color: 'text-status-amber' }
  return { label: 'Low', color: 'text-status-green' }
}

export default function FinalReportPage() {
  const router = useRouter()
  const { totalScore } = useAuth()
  const [reports, setReports] = useState<LevelReport[]>([])
  const [loading, setLoading] = useState(true)
  const [reportId, setReportId] = useState<string | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | null>(null)
  const [totalLevels, setTotalLevels] = useState(4)

  useEffect(() => {
    levelsApi.list().then((levels) => {
      setTotalLevels(levels.length)
    }).catch(() => {})

    reportsApi.generate().then(async (reportData) => {
      const summary = JSON.parse(reportData.summaryJson)
      setReports(summary.levelReports || [])
      setReportId(reportData.id)
    }).catch((err) => {
      setReportError(err.message || 'Failed to generate report')
      setReports([])

      reportsApi.status().then((status) => {
        setReviewStatus(status)
      }).catch(() => {})
    }).finally(() => setLoading(false))
  }, [])

  const handleDownloadPDF = async () => {
    if (!reportId) return
    try {
      const blob = await reportsApi.downloadPdf(reportId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sentinelchain-report-${reportId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF')
    }
  }

  const unviewedReviews = reviewStatus?.levels.filter(r => !r.viewed) || []

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Report Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText size={28} className="text-accent" />
                <h1 className="text-3xl font-bold">Security Assessment Report</h1>
              </div>
              <p className="text-muted-foreground">SentinelChain Completion Summary</p>
            </div>
            {reportId && (
              <Button onClick={handleDownloadPDF} className="gap-2">
                <Download size={16} />
                Download PDF
              </Button>
            )}
          </div>

          {/* Report Locked - Show missing reviews */}
          {reportError && unviewedReviews.length > 0 && (
            <Card className="bg-status-amber/5 border-status-amber/50">
              <div className="flex gap-3">
                <AlertTriangle size={20} className="text-status-amber flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Report Locked</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    View all {reviewStatus?.total ?? 4} defensive code reviews to unlock your report.
                    You have viewed {reviewStatus?.total ? reviewStatus.total - unviewedReviews.length : 0}/{reviewStatus?.total ?? 4} reviews.
                  </p>
                  <div className="space-y-2">
                    {unviewedReviews.map((review) => (
                      <button
                        key={review.id}
                        onClick={() => router.push(`/level/${review.id}/review`)}
                        className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
                      >
                        <Eye size={14} />
                        View Level {review.orderIndex}: {review.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Report generation error (non-review) */}
          {reportError && unviewedReviews.length === 0 && (
            <Card className="bg-status-amber/5 border-status-amber/50">
              <div className="flex gap-3">
                <AlertTriangle size={20} className="text-status-amber flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-2">Report Not Available</h3>
                  <p className="text-sm text-muted-foreground">{reportError}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Executive Summary */}
          {reports.length > 0 && (
            <>
              <Card className="border-accent/50">
                <h2 className="text-lg font-semibold mb-4">Executive Summary</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="border border-border rounded p-4">
                    <div className="text-xs text-muted-foreground mb-1">Total Score</div>
                    <div className="text-2xl font-bold text-accent">{totalScore}</div>
                  </div>
                  <div className="border border-border rounded p-4">
                    <div className="text-xs text-muted-foreground mb-1">Levels Completed</div>
                    <div className="text-2xl font-bold">{reports.length}/{totalLevels}</div>
                  </div>
                  <div className="border border-border rounded p-4">
                    <div className="text-xs text-muted-foreground mb-1">Average CVSS</div>
                    <div className="text-2xl font-bold text-status-red">
                      {reports.length > 0
                        ? (reports.reduce((sum, r) => sum + r.level.cvssScore, 0) / reports.length).toFixed(1)
                        : '\u2014'}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This assessment validates knowledge of web security vulnerabilities and exploitation
                  techniques. The trainee demonstrated proficiency in identifying and exploiting
                  {` ${reports.length} vulnerability class(es)`} and
                  understanding remediation approaches.
                </p>
              </Card>

              {/* Vulnerability Details */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Vulnerability Assessment</h2>
                <div className="space-y-4">
                  {reports.map((report, idx) => {
                    const severity = getCvssSeverity(report.level.cvssScore)
                    return (
                      <Collapsible key={idx} title={report.level.title} defaultOpen={true}>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="border border-border rounded p-3">
                              <div className="text-xs text-muted-foreground mb-1">CVSS Score</div>
                              <div className={`text-2xl font-bold ${severity.color}`}>{report.level.cvssScore}</div>
                              <div className={`text-xs ${severity.color} mt-1`}>{severity.label}</div>
                            </div>
                            <div className="border border-border rounded p-3">
                              <div className="text-xs text-muted-foreground mb-1">OWASP</div>
                              <div className="text-sm font-mono font-semibold">{report.level.owaspCategory}</div>
                            </div>
                            <div className="border border-border rounded p-3">
                              <div className="text-xs text-muted-foreground mb-1">CWE</div>
                              <div className="text-sm font-mono font-semibold">{report.level.cweId}</div>
                            </div>
                            <div className="border border-border rounded p-3">
                              <div className="text-xs text-muted-foreground mb-1">MITRE ATT&CK</div>
                              <div className="text-sm font-mono font-semibold">{report.level.mitreTechniqueId}</div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="text-sm font-semibold mb-1">CWE Definition</div>
                              <p className="text-sm text-muted-foreground">{report.level.cweTitle}</p>
                            </div>
                            <div>
                              <div className="text-sm font-semibold mb-1">MITRE ATT&CK Technique</div>
                              <p className="text-sm text-muted-foreground">{report.level.mitreTechniqueName}</p>
                            </div>
                            <div>
                              <div className="text-sm font-semibold mb-1">Recommended Remediation</div>
                              <p className="text-sm text-muted-foreground">{report.remediation}</p>
                            </div>
                          </div>

                          <div className="border-t border-border pt-3 grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Time Spent</div>
                              <div className="font-mono font-semibold">{report.progress.bestTime || '\u2014'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Attempts</div>
                              <div className="font-mono font-semibold">{report.progress.attempts}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Hints Used</div>
                              <div className="font-mono font-semibold">{report.hintsUsed.length}/3</div>
                            </div>
                          </div>
                        </div>
                      </Collapsible>
                    )
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="text-center p-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-4">
                  This report certifies completion of the SentinelChain security assessment program.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span>Report generated on {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

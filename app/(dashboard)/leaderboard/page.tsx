'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { SegmentControl } from '@/components/ui/segment-control'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Award, TrendingUp } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { leaderboard as leaderboardApi } from '@/lib/api'
import type { LeaderboardEntry } from '@/types'

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState('all')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    setLoading(true)
    setError(null)
    leaderboardApi.get(timeframe as 'all' | 'week').then((data) => {
      setEntries(data)
    }).catch((err) => {
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) return
      if (err.message?.includes('Cannot reach backend')) {
        setError('Unable to connect to the server. Please check that the backend is running.')
      } else {
        setError('Failed to load leaderboard. Please try again.')
      }
    }).finally(() => setLoading(false))
  }, [timeframe])

  const currentUser = entries.find((e) => e.isCurrentUser)

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto bg-background p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Award size={28} className="text-accent" />
              <h1 className="text-3xl font-bold">Leaderboard</h1>
            </div>
            <p className="text-muted-foreground">Compete with other hackers. Top scores reset weekly.</p>
          </div>

          {error && (
            <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-status-red font-medium">{error}</p>
            </div>
          )}

          {/* Timeframe Selector */}
          <div className="mb-6 flex items-center justify-between">
            <SegmentControl
              options={[
                { value: 'week', label: 'This Week' },
                { value: 'all', label: 'All Time' },
              ]}
              defaultValue="all"
              onChange={setTimeframe}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp size={14} />
              Updated every 5 minutes
            </div>
          </div>

          {/* Leaderboard Table with Sticky User Row */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table scrollable={true}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-center">Levels</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.filter((e) => !e.isCurrentUser).map((entry, idx) => (
                    <TableRow key={`${entry.rank}-${idx}`} className={idx < 3 ? 'bg-surface-secondary' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {idx < 3 && (
                            <span className="text-status-amber font-bold text-lg">
                              {idx === 0 ? '\u{1F947}' : idx === 1 ? '\u{1F948}' : '\u{1F949}'}
                            </span>
                          )}
                          <span className="font-mono font-medium">{entry.rank}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-accent/20 flex items-center justify-center text-xs font-semibold text-accent">
                            {entry.avatar}
                          </div>
                          <span className="font-medium">{entry.displayName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">{entry.score}</TableCell>
                      <TableCell className="text-center font-mono">{entry.levelsCompleted}/4</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{entry.totalTime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Sticky Current User Row */}
            {currentUser && (
              <div className="border-t-2 border-accent bg-surface-elevated overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    <TableRow
                      sticky={true}
                      className="bg-surface-elevated hover:bg-surface-elevated border-t-2 border-accent"
                    >
                      <TableCell className="w-12">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{currentUser.rank}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-accent/30 flex items-center justify-center text-xs font-semibold text-accent font-bold">
                            {currentUser.avatar}
                          </div>
                          <span className="font-medium">{currentUser.displayName}</span>
                          <span className="text-xs text-accent font-mono">(you)</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">{currentUser.score}</TableCell>
                      <TableCell className="text-center font-mono">
                        {currentUser.levelsCompleted}/4
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{currentUser.totalTime}</TableCell>
                    </TableRow>
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Info Box */}
          <div className="mt-6 p-4 border border-border rounded-lg bg-surface-secondary text-sm text-muted-foreground">
            <p>
              Your position is pinned to the bottom of the leaderboard. Complete more levels and reduce your time to
              climb the ranks. Scores reset every Monday at 00:00 UTC.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

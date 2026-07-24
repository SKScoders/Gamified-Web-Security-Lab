'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { User, Calendar, Award, Settings } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { levels as levelsApi } from '@/lib/api'
import type { Level } from '@/types'

export default function ProfilePage() {
  const { user, totalScore, levelsSolved, rank } = useAuth()
  const [levelData, setLevelData] = useState<Level[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    levelsApi.list().then(setLevelData).catch((err) => {
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) return
      if (err.message?.includes('Cannot reach backend')) {
        setError('Unable to connect to the server. Some profile data may be unavailable.')
      } else {
        setError('Failed to load level data. Some profile data may be unavailable.')
      }
    })
  }, [])

  const certificates = levelData
    .filter((l) => l.expectedFlag)
    .slice(0, levelsSolved)
    .map((l) => ({
      id: l.id,
      levelId: l.id,
      levelTitle: l.title,
      score: l.points,
    }))

  const badges = [
    { name: 'First Blood', description: 'Completed first challenge', earned: certificates.length >= 1 },
    { name: 'Chain Master', description: `Completed all ${levelData.length || 4} levels`, earned: levelsSolved >= (levelData.length || 4) },
  ]

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-sm text-muted-foreground">Loading profile...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Header */}
          <Card>
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 rounded-lg bg-accent/20 flex items-center justify-center">
                <User size={48} className="text-accent" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-1">{user.displayName}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Calendar size={16} />
                  <span className="text-sm">Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex gap-6">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Total Score</div>
                    <div className="text-2xl font-bold text-accent">{totalScore}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Levels Solved</div>
                    <div className="text-2xl font-bold">{levelsSolved}/{levelData.length || 4}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Global Rank</div>
                    <div className="text-2xl font-bold">#{rank}</div>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="gap-2" disabled>
                <Settings size={16} />
                Settings (Coming Soon)
              </Button>
            </div>
          </Card>

          {error && (
            <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-4">
              <p className="text-sm text-status-red font-medium">{error}</p>
            </div>
          )}

          {/* Certificates */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award size={20} className="text-accent" />
              Certificates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {badges.map((badge, i) => (
                <Card
                  key={i}
                  className={`text-center p-6 flex flex-col items-center gap-3 ${
                    !badge.earned ? 'opacity-30 grayscale' : ''
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg ${
                      badge.earned
                        ? 'bg-status-amber/20 text-status-amber'
                        : 'bg-surface-secondary text-muted-foreground'
                    }`}
                  >
                    {badge.earned ? (
                      <Award size={24} />
                    ) : (
                      <Award size={24} className="opacity-40" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{badge.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {badge.earned ? badge.description : 'Locked'}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Account Settings */}
          <Card className="bg-surface-secondary">
            <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Change
                </Button>
              </div>
              <div className="border-t border-border pt-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">Password</div>
                  <div className="text-sm text-muted-foreground">Set at registration</div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Change
                </Button>
              </div>
              <div className="border-t border-border pt-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">Not available yet</div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Enable
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

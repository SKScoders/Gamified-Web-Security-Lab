import { Router } from 'express'
import { prisma } from '../../server'
import { authenticate } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { leaderboardQuerySchema } from '../../validation/schemas'

const router = Router()

function parseBestTimeSec(bestTime: string | null): number {
  if (!bestTime) return 0
  const match = bestTime.match(/^(\d+)s$/)
  return match ? parseInt(match[1], 10) : 0
}

router.get('/', authenticate, validate(leaderboardQuerySchema, 'query'), async (req, res) => {
  try {
    const timeframe = req.query.timeframe as string

    let dateFilter: Date | undefined
    if (timeframe === 'week') {
      dateFilter = new Date()
      dateFilter.setDate(dateFilter.getDate() - 7)
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
        progress: {
          where: dateFilter ? { completedAt: { gte: dateFilter } } : {},
          select: { score: true, completedAt: true, bestTime: true },
        },
      },
    })

    const levelCount = await prisma.level.count()

    const leaderboard = users.map(u => {
      const totalScore = u.progress.reduce((sum, p) => sum + p.score, 0)
      const levelsCompleted = u.progress.filter(p => p.completedAt).length
      const totalTimeSec = u.progress.reduce((sum, p) => sum + parseBestTimeSec(p.bestTime), 0)
      const hours = Math.floor(totalTimeSec / 3600)
      const mins = Math.floor((totalTimeSec % 3600) / 60)
      const totalTime = totalTimeSec > 0 ? (hours > 0 ? `${hours}h ${mins}m` : `${mins}m`) : '\u2014'

      return {
        userId: u.id,
        displayName: u.displayName,
        avatar: u.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        score: totalScore,
        levelsCompleted,
        totalTime,
      }
    })

    leaderboard.sort((a, b) => b.score - a.score)

    const result = leaderboard.map((entry, idx) => ({
      rank: idx + 1,
      ...entry,
      isCurrentUser: entry.userId === req.user?.userId,
    }))

    res.json({ totalLevels: levelCount, entries: result })
  } catch (err) {
    console.error('Leaderboard error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

import { Router } from 'express'
import { prisma } from '../../server'
import { authenticate } from '../../middleware/auth'

const router = Router()

router.get('/summary', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId

    const [user, progressRows] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true, longestStreak: true },
      }),
      prisma.progress.findMany({ where: { userId } }),
    ])

    const totalScore = progressRows.reduce((sum, p) => sum + p.score, 0)
    const levelsSolved = progressRows.filter(p => p.status === 'solved').length

    const allScores = await prisma.progress.groupBy({
      by: ['userId'],
      _sum: { score: true },
      where: { status: 'solved' },
    })
    const sortedScores = allScores.sort((a, b) => (b._sum.score || 0) - (a._sum.score || 0))
    const rank = sortedScores.findIndex(s => s.userId === userId) + 1 || sortedScores.length + 1

    const recentEvents = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    res.json({
      totalScore,
      levelsSolved,
      rank,
      streak: user?.currentStreak ?? 0,
      longestStreak: user?.longestStreak ?? 0,
      recentActivity: recentEvents.map(e => ({
        eventType: e.eventType,
        payloadJson: e.payloadJson,
        createdAt: e.createdAt.toISOString(),
      })),
    })
  } catch (err) {
    console.error('Dashboard summary error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

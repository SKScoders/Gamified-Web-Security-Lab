import { Router } from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '../../server'
import { authenticate } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { submitFlagSchema } from '../../validation/schemas'
import { logEvent } from '../audit/service'

const router = Router()
const STAGE_SECRET = process.env.JWT_SECRET || 'sentinelchain-dev-jwt-secret'

const LAB_URLS: Record<number, string> = {
  1: process.env.LAB_URL_1 || 'http://localhost:3001',
  2: process.env.LAB_URL_2 || 'http://localhost:3002',
  3: process.env.LAB_URL_3 || 'http://localhost:3003',
  4: process.env.LAB_URL_4 || 'http://localhost:4004',
}

function getLevelStatus(
  levelOrder: number,
  progressMap: Map<string, { status: string; orderIndex: number }>,
  completedOrders: number[]
): 'locked' | 'in-progress' | 'solved' {
  if (completedOrders.includes(levelOrder)) return 'solved'
  const prevCompleted = levelOrder === 1 || completedOrders.includes(levelOrder - 1)
  const inProgress = Array.from(progressMap.values()).find(
    p => p.orderIndex === levelOrder && p.status === 'in-progress'
  )
  if (inProgress) return 'in-progress'
  if (prevCompleted) return 'in-progress'
  return 'locked'
}

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId
    const levels = await prisma.level.findMany({ orderBy: { orderIndex: 'asc' } })
    const progressRows = await prisma.progress.findMany({ where: { userId } })
    const stageTokens = await prisma.stageToken.findMany({
      where: { progress: { userId } },
      select: { progressId: true, expiresAt: true },
    })

    const progressMap = new Map<string, { status: string; orderIndex: number }>()
    for (const p of progressRows) {
      const level = levels.find(l => l.id === p.levelId)
      if (level) progressMap.set(p.levelId, { status: p.status, orderIndex: level.orderIndex })
    }

    const completedOrders = levels
      .filter(l => {
        const p = progressRows.find(pr => pr.levelId === l.id)
        return p?.status === 'solved'
      })
      .map(l => l.orderIndex)

    const validTokenProgressIds = new Set(
      stageTokens
        .filter(st => st.expiresAt > new Date())
        .map(st => st.progressId)
    )

    const result = levels.map(level => {
      const progress = progressRows.find(p => p.levelId === level.id)
      const computedStatus = getLevelStatus(level.orderIndex, progressMap, completedOrders)

      return {
        id: level.id,
        orderIndex: level.orderIndex,
        labUrl: LAB_URLS[level.orderIndex] || null,
        title: level.title,
        description: level.description,
        vulnCategory: level.vulnCategory,
        owaspCategory: level.owaspCategory,
        mitreTechniqueId: level.mitreTechniqueId,
        mitreTechniqueName: level.mitreTechniqueName,
        cvssBaseVector: level.cvssBaseVector,
        cvssScore: level.cvssScore,
        cweId: level.cweId,
        cweTitle: level.cweTitle,
        difficulty: level.difficulty,
        points: level.points,
        status: progress?.status === 'solved' ? 'solved' : computedStatus,
        attempts: progress?.attempts || 0,
        score: progress?.score || 0,
        startedAt: progress?.startedAt?.toISOString() || null,
        completedAt: progress?.completedAt?.toISOString() || null,
        bestTime: progress?.bestTime || null,
      }
    })

    res.json(result)
  } catch (err) {
    console.error('Levels list error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/start', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId
    const levelId = String(req.params.id)

    const level = await prisma.level.findUnique({ where: { id: levelId } })
    if (!level) return res.status(404).json({ error: 'Level not found' })

    if (level.orderIndex > 1) {
      const prevLevel = await prisma.level.findFirst({
        where: { orderIndex: level.orderIndex - 1 },
      })
      if (!prevLevel) return res.status(400).json({ error: 'Previous level not found' })

      const prevProgress = await prisma.progress.findFirst({
        where: { userId, levelId: prevLevel.id, status: 'solved' },
      })
      if (!prevProgress) {
        return res.status(403).json({ error: 'Previous level not completed' })
      }

      const stageToken = await prisma.stageToken.findFirst({
        where: { progressId: prevProgress.id },
        orderBy: { issuedAt: 'desc' },
      })
      if (!stageToken) {
        return res.status(403).json({ error: 'Stage token not found' })
      }
      if (stageToken.expiresAt < new Date()) {
        return res.status(403).json({ error: 'Stage token expired' })
      }

      try {
        jwt.verify(stageToken.signedToken, STAGE_SECRET)
      } catch {
        return res.status(403).json({ error: 'Invalid stage token' })
      }
    }

    const existing = await prisma.progress.findFirst({
      where: { userId, levelId, status: { in: ['in-progress', 'solved'] } },
    })

    if (existing?.status === 'solved') {
      return res.json({
        id: existing.id,
        userId: existing.userId,
        levelId: existing.levelId,
        status: existing.status,
        attempts: existing.attempts,
        score: existing.score,
        startedAt: existing.startedAt?.toISOString() || null,
        completedAt: existing.completedAt?.toISOString() || null,
        bestTime: existing.bestTime,
      })
    }

    if (existing?.status === 'in-progress') {
      return res.json({
        id: existing.id,
        userId: existing.userId,
        levelId: existing.levelId,
        status: existing.status,
        attempts: existing.attempts,
        score: existing.score,
        startedAt: existing.startedAt?.toISOString() || null,
        completedAt: existing.completedAt?.toISOString() || null,
        bestTime: existing.bestTime,
      })
    }

    const progress = await prisma.progress.create({
      data: { userId, levelId, status: 'in-progress', attempts: 0, score: 0, startedAt: new Date() },
    })

    await logEvent(userId, 'level_started', { levelId })

    res.status(201).json({
      id: progress.id,
      userId: progress.userId,
      levelId: progress.levelId,
      status: progress.status,
      attempts: progress.attempts,
      score: progress.score,
      startedAt: progress.startedAt?.toISOString() || null,
      completedAt: progress.completedAt?.toISOString() || null,
      bestTime: progress.bestTime,
    })
  } catch (err) {
    console.error('Level start error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/submit', authenticate, validate(submitFlagSchema), async (req, res) => {
  try {
    const userId = req.user!.userId
    const levelId = String(req.params.id)
    const { proof } = req.body

    const level = await prisma.level.findUnique({ where: { id: levelId } })
    if (!level) return res.status(404).json({ error: 'Level not found' })

    const progress = await prisma.progress.findFirst({
      where: { userId, levelId, status: 'in-progress' },
    })
    if (!progress) {
      return res.status(400).json({ error: 'No active progress for this level' })
    }

    const isCorrect = proof.trim() === level.expectedFlag

    await prisma.progress.update({
      where: { id: progress.id },
      data: { attempts: progress.attempts + 1 },
    })

    await logEvent(userId, isCorrect ? 'attempt_success' : 'attempt_failed', {
      levelId,
      attemptNumber: progress.attempts + 1,
    })

    if (isCorrect) {
      const exploitSignatureHash = crypto
        .createHash('sha256')
        .update(`${userId}:${levelId}:${Date.now()}`)
        .digest('hex')

      const stageToken = jwt.sign(
        { userId, levelId, exploitSignatureHash, issuedAt: Date.now() },
        STAGE_SECRET,
        { expiresIn: '1h' }
      )

      const now = new Date()
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000)

      await prisma.stageToken.create({
        data: {
          progressId: progress.id,
          signedToken: stageToken,
          exploitSignatureHash,
          issuedAt: now,
          expiresAt,
        },
      })

      const bestTime = progress.startedAt
        ? `${Math.round((now.getTime() - progress.startedAt.getTime()) / 1000)}s`
        : null

      await prisma.progress.update({
        where: { id: progress.id },
        data: {
          status: 'solved',
          score: level.points,
          completedAt: now,
          bestTime,
        },
      })

      await logEvent(userId, 'level_completed', { levelId, score: level.points })

      res.json({
        correct: true,
        attempts: progress.attempts + 1,
        stageToken,
        score: level.points,
        completedAt: now.toISOString(),
      })
    } else {
      res.json({ correct: false, attempts: progress.attempts + 1 })
    }
  } catch (err) {
    console.error('Level submit error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId
    const levelId = String(req.params.id)

    const level = await prisma.level.findUnique({ where: { id: levelId } })
    if (!level) return res.status(404).json({ error: 'Level not found' })

    const progress = await prisma.progress.findFirst({
      where: { userId, levelId, status: 'solved' },
    })
    if (!progress) {
      return res.status(400).json({ error: 'Level not yet completed — submit the correct flag first' })
    }

    const existingToken = await prisma.stageToken.findFirst({
      where: { progressId: progress.id },
      orderBy: { issuedAt: 'desc' },
    })

    res.json({
      progressId: progress.id,
      stageToken: existingToken?.signedToken || null,
      score: progress.score,
      completedAt: progress.completedAt?.toISOString() || null,
    })
  } catch (err) {
    console.error('Level complete error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id/defense-mirror', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId
    const levelId = String(req.params.id)

    const level = await prisma.level.findUnique({ where: { id: levelId } })
    if (!level) return res.status(404).json({ error: 'Level not found' })

    const progress = await prisma.progress.findFirst({
      where: { userId, levelId, status: 'solved' },
    })
    if (!progress) {
      return res.status(403).json({ error: 'Complete this level first to unlock the defensive code review' })
    }

    if (!level.defensiveReview) {
      return res.status(404).json({ error: 'Review content not available for this level' })
    }

    await prisma.reviewViewed.upsert({
      where: { userId_levelId: { userId, levelId } },
      update: {},
      create: { userId, levelId },
    })

    res.json({
      levelId: level.id,
      title: level.title,
      remediation: level.remediation,
      review: level.defensiveReview,
    })
  } catch (err) {
    console.error('Defense mirror error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

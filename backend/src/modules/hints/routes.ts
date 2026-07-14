import { Router } from 'express'
import { prisma } from '../../server'
import { authenticate } from '../../middleware/auth'
import { hintLimiter } from '../../middleware/rateLimit'
import { logEvent } from '../audit/service'

const router = Router()

router.get('/:id/hints', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId
    const levelId = String(req.params.id)

    const hints = await prisma.hint.findMany({
      where: { levelId },
      orderBy: { hintOrder: 'asc' },
    })

    const revealedHintIds = await prisma.hintUsage.findMany({
      where: { userId, hint: { levelId } },
      select: { hintId: true },
    })
    const revealedSet = new Set(revealedHintIds.map(r => r.hintId))

    res.json(hints.map(h => ({
      id: h.id,
      levelId: h.levelId,
      hintOrder: h.hintOrder,
      title: h.title,
      content: revealedSet.has(h.id) ? h.content : undefined,
      scorePenalty: h.scorePenalty,
      revealed: revealedSet.has(h.id),
    })))
  } catch (err) {
    console.error('Hints list error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/hints/:hintId/reveal', authenticate, hintLimiter, async (req, res) => {
  try {
    const userId = req.user!.userId
    const hintId = String(req.params.hintId)

    const hint = await prisma.hint.findUnique({ where: { id: hintId } })
    if (!hint) return res.status(404).json({ error: 'Hint not found' })

    const existing = await prisma.hintUsage.findFirst({
      where: { userId, hintId },
    })
    if (existing) {
      return res.json({
        id: hint.id,
        levelId: hint.levelId,
        hintOrder: hint.hintOrder,
        title: hint.title,
        content: hint.content,
        scorePenalty: hint.scorePenalty,
        revealed: true,
      })
    }

    await prisma.hintUsage.create({
      data: { userId, hintId, requestedAt: new Date() },
    })

    await logEvent(userId, 'hint_revealed', {
      levelId: hint.levelId,
      hintOrder: hint.hintOrder,
      penalty: hint.scorePenalty,
    })

    res.json({
      id: hint.id,
      levelId: hint.levelId,
      hintOrder: hint.hintOrder,
      title: hint.title,
      content: hint.content,
      scorePenalty: hint.scorePenalty,
      revealed: true,
    })
  } catch (err) {
    console.error('Hint reveal error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

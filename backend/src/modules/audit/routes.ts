import { Router } from 'express'
import { prisma } from '../../server'
import { authenticate } from '../../middleware/auth'

const router = Router()

router.get('/:userId', authenticate, async (req, res) => {
  try {
    if (req.user?.userId !== req.params.userId && req.user?.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const entries = await prisma.auditLog.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    res.json(entries.map(e => ({
      id: e.id,
      userId: e.userId,
      eventType: e.eventType,
      payloadJson: e.payloadJson,
      prevHash: e.prevHash,
      entryHash: e.entryHash,
      createdAt: e.createdAt.toISOString(),
    })))
  } catch (err) {
    console.error('Audit fetch error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

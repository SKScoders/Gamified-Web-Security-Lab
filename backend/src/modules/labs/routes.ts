import { Router } from 'express'
import { prisma } from '../../server'
import { authenticate } from '../../middleware/auth'

const router = Router()

const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || ''

const LAB_URLS: Record<number, string> = {
  1: process.env.LAB_URL_1 || 'http://localhost:3001',
  2: process.env.LAB_URL_2 || 'http://localhost:3002',
  3: process.env.LAB_URL_3 || 'http://localhost:3003',
  4: process.env.LAB_URL_4 || 'http://localhost:3004',
}

router.get('/:id/status', authenticate, async (req, res) => {
  try {
    const levelId = String(req.params.id)
    const level = await prisma.level.findUnique({ where: { id: levelId } })
    if (!level) return res.status(404).json({ error: 'Level not found' })

    const labUrl = LAB_URLS[level.orderIndex]
    if (!labUrl) return res.status(404).json({ error: 'No lab configured for this level' })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(`${labUrl}/api/health`, { signal: controller.signal })
      clearTimeout(timeout)
      const data = await response.json()
      res.json({ status: 'up', level: level.orderIndex, lab: data })
    } catch {
      clearTimeout(timeout)
      res.json({ status: 'down', level: level.orderIndex })
    }
  } catch (err) {
    console.error('Lab status error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/reset', authenticate, async (req, res) => {
  try {
    if (!INTERNAL_TOKEN) {
      return res.status(500).json({ error: 'Internal token not configured' })
    }

    const levelId = String(req.params.id)
    const level = await prisma.level.findUnique({ where: { id: levelId } })
    if (!level) return res.status(404).json({ error: 'Level not found' })

    const labUrl = LAB_URLS[level.orderIndex]
    if (!labUrl) return res.status(404).json({ error: 'No lab configured for this level' })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(`${labUrl}/__internal/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_TOKEN,
        },
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await response.json() as { status?: string; level?: number; name?: string; port?: string }

      if (response.ok) {
        res.json({ success: true, message: (data as any).message || 'Lab reset successfully' })
      } else {
        res.status(response.status).json({ success: false, error: (data as any).error || 'Reset failed' })
      }
    } catch {
      clearTimeout(timeout)
      res.status(502).json({ success: false, error: 'Lab is not reachable' })
    }
  } catch (err) {
    console.error('Lab reset error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

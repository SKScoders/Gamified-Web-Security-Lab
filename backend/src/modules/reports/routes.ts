import { Router } from 'express'
import { prisma } from '../../server'
import { authenticate } from '../../middleware/auth'
import { logEvent } from '../audit/service'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { ReportPdf } from './pdf-template'

const router = Router()

router.get('/status', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId
    const allLevels = await prisma.level.findMany({ orderBy: { orderIndex: 'asc' }, select: { id: true, title: true, orderIndex: true } })
    const reviewViewed = await prisma.reviewViewed.findMany({ where: { userId }, select: { levelId: true } })
    const viewedIds = new Set(reviewViewed.map(rv => rv.levelId))

    res.json({
      total: allLevels.length,
      viewed: reviewViewed.length,
      levels: allLevels.map(l => ({
        id: l.id,
        title: l.title,
        orderIndex: l.orderIndex,
        viewed: viewedIds.has(l.id),
      })),
    })
  } catch (err) {
    console.error('Review status error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/generate', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId

    const progressRows = await prisma.progress.findMany({
      where: { userId, status: 'solved' },
      include: { level: true },
    })

    const allLevels = await prisma.level.findMany({ orderBy: { orderIndex: 'asc' } })

    if (progressRows.length < allLevels.length) {
      return res.status(400).json({
        error: `Complete all ${allLevels.length} levels before generating a report`,
        levelsCompleted: progressRows.length,
        levelsRequired: allLevels.length,
      })
    }

    const reviewViewed = await prisma.reviewViewed.findMany({ where: { userId } })
    const unviewedLevels = allLevels.filter(l => !reviewViewed.some(rv => rv.levelId === l.id))

    if (unviewedLevels.length > 0) {
      return res.status(400).json({
        error: `View all ${allLevels.length} defensive code reviews before generating a report`,
        reviewsViewed: allLevels.length - unviewedLevels.length,
        reviewsRequired: allLevels.length,
        unviewedLevels: unviewedLevels.map(l => ({ id: l.id, title: l.title, orderIndex: l.orderIndex })),
      })
    }

    const hintUsages = await prisma.hintUsage.findMany({
      where: { userId },
      include: { hint: true },
    })

    const levelReports = progressRows.map(p => {
      const hintsForLevel = hintUsages.filter(h => h.hint.levelId === p.levelId)
      return {
        level: {
          id: p.level.id,
          title: p.level.title,
          vulnCategory: p.level.vulnCategory,
          owaspCategory: p.level.owaspCategory,
          mitreTechniqueId: p.level.mitreTechniqueId,
          mitreTechniqueName: p.level.mitreTechniqueName,
          cvssBaseVector: p.level.cvssBaseVector,
          cvssScore: p.level.cvssScore,
          cweId: p.level.cweId,
          cweTitle: p.level.cweTitle,
          difficulty: p.level.difficulty,
          points: p.level.points,
          remediation: p.level.remediation,
        },
        progress: {
          attempts: p.attempts,
          score: p.score,
          bestTime: p.bestTime,
          startedAt: p.startedAt?.toISOString() || null,
          completedAt: p.completedAt?.toISOString() || null,
        },
        hintsUsed: hintsForLevel.map(h => ({
          hintId: h.hintId,
          hintOrder: h.hint.hintOrder,
          penalty: h.hint.scorePenalty,
          requestedAt: h.requestedAt.toISOString(),
        })),
      }
    })

    const totalScore = progressRows.reduce((sum, p) => sum + p.score, 0)
    const totalTimeMinutes = progressRows.reduce((sum, p) => {
      if (p.bestTime) {
        const match = p.bestTime.match(/(\d+)s/)
        return sum + (match ? parseInt(match[1]) / 60 : 0)
      }
      return sum
    }, 0)

    const summaryJson = JSON.stringify({
      totalScore,
      totalTime: `${Math.floor(totalTimeMinutes)}m`,
      levelsCompleted: progressRows.length,
      totalLevels: allLevels.length,
      averageCvss: progressRows.length > 0
        ? (progressRows.reduce((sum, p) => sum + p.level.cvssScore, 0) / progressRows.length).toFixed(1)
        : 0,
      levelReports,
    })

    const report = await prisma.report.create({
      data: { userId, summaryJson },
    })

    await logEvent(userId, 'report_generated', { reportId: report.id })

    res.status(201).json({
      id: report.id,
      userId: report.userId,
      summaryJson: report.summaryJson,
      generatedAt: report.generatedAt.toISOString(),
    })
  } catch (err) {
    console.error('Report generate error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const report = await prisma.report.findUnique({ where: { id: String(req.params.id) } })
    if (!report) return res.status(404).json({ error: 'Report not found' })
    if (report.userId !== req.user?.userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    res.json({
      id: report.id,
      userId: report.userId,
      summaryJson: report.summaryJson,
      generatedAt: report.generatedAt.toISOString(),
    })
  } catch (err) {
    console.error('Report fetch error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const report = await prisma.report.findUnique({ where: { id: String(req.params.id) } })
    if (!report) return res.status(404).json({ error: 'Report not found' })
    if (report.userId !== req.user?.userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const summary = JSON.parse(report.summaryJson)
    if (summary.levelsCompleted < summary.totalLevels) {
      return res.status(400).json({ error: `Complete all ${summary.totalLevels} levels before downloading the report` })
    }

    const allLevels = await prisma.level.findMany({ orderBy: { orderIndex: 'asc' } })
    const reviewViewed = await prisma.reviewViewed.findMany({ where: { userId: report.userId } })
    if (reviewViewed.length < allLevels.length) {
      return res.status(400).json({ error: `View all ${allLevels.length} defensive code reviews before downloading the report` })
    }

    const user = await prisma.user.findUnique({ where: { id: report.userId } })

    const pdfData = {
      ...summary,
      userName: user?.displayName || 'Trainee',
      generatedAt: report.generatedAt.toISOString().split('T')[0],
    }

    const pdfBuffer = await renderToBuffer(
      React.createElement(ReportPdf, { data: pdfData }) as any
    )

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="sentinelchain-report-${report.id}.pdf"`)
    res.send(Buffer.from(pdfBuffer))
  } catch (err) {
    console.error('Report download error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

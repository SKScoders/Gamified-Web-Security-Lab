import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '../../server'
import { authenticate } from '../../middleware/auth'
import { authLimiter } from '../../middleware/rateLimit'
import { validate } from '../../middleware/validate'
import { registerSchema, loginSchema, refreshSchema } from '../../validation/schemas'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'sentinelchain-dev-jwt-secret'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'sentinelchain-dev-refresh-secret'
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY_DAYS = 30

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt.toISOString() })
  } catch (err) {
    console.error('Auth me error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  try {
    const { email, password, displayName } = req.body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName },
    })

    const accessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })
    const jti = crypto.randomUUID()
    const refreshToken = jwt.sign({ userId: user.id, jti }, JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` })
    const refreshHash = hashToken(refreshToken)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)
    await prisma.session.create({
      data: { userId: user.id, refreshTokenHash: refreshHash, expiresAt },
    })

    res.status(201).json({
      user: { id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt.toISOString() },
      accessToken,
      refreshToken,
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const accessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })
    const jti = crypto.randomUUID()
    const refreshToken = jwt.sign({ userId: user.id, jti }, JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` })
    const refreshHash = hashToken(refreshToken)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)
    await prisma.session.create({
      data: { userId: user.id, refreshTokenHash: refreshHash, expiresAt },
    })

    res.json({
      user: { id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt.toISOString() },
      accessToken,
      refreshToken,
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/refresh', authLimiter, validate(refreshSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body

    let payload: { userId: string }
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string }
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' })
    }

    const sessions = await prisma.session.findMany({
      where: { userId: payload.userId, expiresAt: { gt: new Date() } },
    })

    const tokenHash = hashToken(refreshToken)
    const matchedSession = sessions.find(s => s.refreshTokenHash === tokenHash)

    if (!matchedSession) {
      return res.status(401).json({ error: 'Refresh token not recognized' })
    }

    await prisma.session.delete({ where: { id: matchedSession.id } })

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    const newAccessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })
    const newJti = crypto.randomUUID()
    const newRefreshToken = jwt.sign({ userId: user.id, jti: newJti }, JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` })
    const refreshHash = hashToken(newRefreshToken)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)
    await prisma.session.create({
      data: { userId: user.id, refreshTokenHash: refreshHash, expiresAt },
    })

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken })
  } catch (err) {
    console.error('Refresh error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/logout', authLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      let payload: { userId: string }
      try {
        payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string }
        const sessions = await prisma.session.findMany({ where: { userId: payload.userId } })
        const tokenHash = hashToken(refreshToken)
        const matched = sessions.find(s => s.refreshTokenHash === tokenHash)
        if (matched) {
          await prisma.session.delete({ where: { id: matched.id } })
        }
      } catch {}
    }
    res.json({ message: 'Logged out' })
  } catch (err) {
    console.error('Logout error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

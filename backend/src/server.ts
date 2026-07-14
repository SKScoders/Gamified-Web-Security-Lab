import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import authRoutes from './modules/auth/routes'
import levelRoutes from './modules/levels/routes'
import hintRoutes from './modules/hints/routes'
import leaderboardRoutes from './modules/leaderboard/routes'
import reportRoutes from './modules/reports/routes'
import dashboardRoutes from './modules/dashboard/routes'
import auditRoutes from './modules/audit/routes'
import labRoutes from './modules/labs/routes'
import { generalLimiter } from './middleware/rateLimit'

export const prisma = new PrismaClient()

const app = express()
const PORT = process.env.PORT || 4000
const FRONTEND_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'

console.log(`CORS allowing origin: ${FRONTEND_ORIGIN}`)

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}))
app.use(express.json())
app.use(generalLimiter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/levels', levelRoutes)
app.use('/api/levels', hintRoutes)
app.use('/api/leaderboard', leaderboardRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/labs', labRoutes)

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`SentinelChain backend running on port ${PORT}`)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

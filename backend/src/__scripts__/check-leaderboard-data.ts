import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
      currentStreak: true,
    },
    orderBy: { createdAt: 'asc' },
  })
  console.log('All users in DB:')
  console.log(JSON.stringify(users, null, 2))
  console.log('Total users:', users.length)

  const progress = await prisma.progress.findMany({
    select: { userId: true, status: true, score: true, levelId: true },
  })
  console.log('\nAll progress records:')
  console.log(JSON.stringify(progress, null, 2))
  console.log('Total progress:', progress.length)

  const sessions = await prisma.session.findMany({
    select: { id: true, userId: true, expiresAt: true },
  })
  console.log('\nAll sessions:')
  console.log(JSON.stringify(sessions, null, 2))
  console.log('Total sessions:', sessions.length)

  const reports = await prisma.report.findMany({
    select: { id: true, userId: true },
  })
  console.log('\nAll reports:')
  console.log(JSON.stringify(reports, null, 2))
  console.log('Total reports:', reports.length)

  const auditLogs = await prisma.auditLog.findMany({
    select: { id: true, userId: true, eventType: true },
  })
  console.log('\nAll audit logs:')
  console.log(JSON.stringify(auditLogs, null, 2))
  console.log('Total audit logs:', auditLogs.length)

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })

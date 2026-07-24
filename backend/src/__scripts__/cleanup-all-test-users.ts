import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const KEEP_EMAILS = [
  'pentester@sentinelchain.dev',
  'surya1111sh@gmail.com',
  'appdevelop2428@gmail.com',
  'analyst@sentinelchain.dev',
]

async function main() {
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true },
  })

  const toDelete = allUsers.filter(u => !KEEP_EMAILS.includes(u.email))
  const toDeleteIds = toDelete.map(u => u.id)

  console.log(`Found ${allUsers.length} total users`)
  console.log(`Keeping ${KEEP_EMAILS.length} real accounts`)
  console.log(`Deleting ${toDelete.length} test accounts:`)
  toDelete.forEach(u => console.log(`  - ${u.email}`))

  if (toDeleteIds.length === 0) {
    console.log('Nothing to delete')
    await prisma.$disconnect()
    return
  }

  const progress = await prisma.progress.deleteMany({
    where: { userId: { in: toDeleteIds } },
  })
  console.log(`Deleted ${progress.count} progress records`)

  const sessions = await prisma.session.deleteMany({
    where: { userId: { in: toDeleteIds } },
  })
  console.log(`Deleted ${sessions.count} sessions`)

  const auditLogs = await prisma.auditLog.deleteMany({
    where: { userId: { in: toDeleteIds } },
  })
  console.log(`Deleted ${auditLogs.count} audit logs`)

  const reports = await prisma.report.deleteMany({
    where: { userId: { in: toDeleteIds } },
  })
  console.log(`Deleted ${reports.count} reports`)

  const hintUsages = await prisma.hintUsage.deleteMany({
    where: { userId: { in: toDeleteIds } },
  })
  console.log(`Deleted ${hintUsages.count} hint usages`)

  const reviewViews = await prisma.reviewViewed.deleteMany({
    where: { userId: { in: toDeleteIds } },
  })
  console.log(`Deleted ${reviewViews.count} review views`)

  const users = await prisma.user.deleteMany({
    where: { id: { in: toDeleteIds } },
  })
  console.log(`Deleted ${users.count} users`)

  const remaining = await prisma.user.findMany({
    select: { email: true },
  })
  console.log(`\nRemaining users: ${remaining.length}`)
  remaining.forEach(u => console.log(`  - ${u.email}`))

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: { not: 'pentester@sentinelchain.dev' },
      OR: [
        { email: { startsWith: 'debug' } },
        { email: { startsWith: 'sectest' } },
        { email: { startsWith: 'final-' } },
        { email: { startsWith: 'rl-' } },
        { email: { startsWith: 'pdf-' } },
        { email: { contains: 'phase6' } },
      ],
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  console.log(JSON.stringify(users, null, 2))
  console.log('Total:', users.length)

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })

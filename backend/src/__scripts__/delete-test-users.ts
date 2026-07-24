import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEST_USER_EMAILS = [
  'debug@test.com',
  'debug5@test.com',
  'debug6@test.com',
  'phase6-final-1783858219439@test.com',
  'final-1783858276189@test.com',
  'rl-1783858281897-0@test.com',
  'rl-1783858282467-1@test.com',
  'final-1783858390671@test.com',
  'rl-1783858398188-0@test.com',
  'rl-1783858398742-1@test.com',
  'rl-1783858399360-2@test.com',
  'rl-1783858399908-3@test.com',
  'final-1783859530019@test.com',
  'phase6-all-1783859612889@test.com',
  'pdf-test-1784026724433@test.com',
  'pdf-test2-1784026737093@test.com',
  'pdf-full-1784026751558@test.com',
  'debug-1784026781758@test.com',
  'final-1784027071779@test.com',
  'pdf-p9-1784028753926@test.com',
  'sectest-1784029515273@test.com',
  'sectest2-1784029517259@test.com',
  'sectest-1784029529190@test.com',
  'sectest-1784029650347@test.com',
  'sectest2-1784029651922@test.com',
  'sectest-1784029665793@test.com',
  'sectest-1784030713334@test.com',
  'sectest2-1784030715800@test.com',
  'sectest-1784030727108@test.com',
  'debug-20260715184354@test.com',
]

async function main() {
  const result = await prisma.user.deleteMany({
    where: { email: { in: TEST_USER_EMAILS } },
  })
  console.log(`Deleted ${result.count} users (and cascade-deleted all child records)`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })

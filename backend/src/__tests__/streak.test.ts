import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

jest.mock('../server', () => ({ prisma }))

const { updateStreak } = require('../modules/streak/service')

const TEST_USER_EMAIL = `streak-test-${Date.now()}@sentinelchain.dev`

beforeAll(async () => {
  await prisma.user.create({
    data: {
      email: TEST_USER_EMAIL,
      passwordHash: 'fake-hash',
      displayName: 'Streak Test User',
    },
  })
})

afterAll(async () => {
  const user = await prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } })
  if (user) {
    await prisma.auditLog.deleteMany({ where: { userId: user.id } })
    await prisma.progress.deleteMany({ where: { userId: user.id } })
    await prisma.session.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })
  }
  await prisma.$disconnect()
})

function daysAgo(n: number): Date {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

describe('updateStreak', () => {
  it('should set streak to 1 on first-ever solve', async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } })
    expect(user).not.toBeNull()

    await updateStreak(user!.id)

    const after = await prisma.user.findUnique({ where: { id: user!.id } })
    expect(after!.currentStreak).toBe(1)
    expect(after!.longestStreak).toBe(1)
    expect(after!.lastSolvedAt).not.toBeNull()
  })

  it('should increment streak on consecutive day', async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } })

    await prisma.user.update({
      where: { id: user!.id },
      data: { currentStreak: 2, longestStreak: 2, lastSolvedAt: daysAgo(1) },
    })

    await updateStreak(user!.id)

    const after = await prisma.user.findUnique({ where: { id: user!.id } })
    expect(after!.currentStreak).toBe(3)
    expect(after!.longestStreak).toBe(3)
  })

  it('should reset streak to 1 on missed day', async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } })

    await prisma.user.update({
      where: { id: user!.id },
      data: { currentStreak: 5, longestStreak: 5, lastSolvedAt: daysAgo(3) },
    })

    await updateStreak(user!.id)

    const after = await prisma.user.findUnique({ where: { id: user!.id } })
    expect(after!.currentStreak).toBe(1)
    expect(after!.longestStreak).toBe(5)
  })

  it('should be a no-op on same-day repeat', async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } })

    await prisma.user.update({
      where: { id: user!.id },
      data: { currentStreak: 3, longestStreak: 3, lastSolvedAt: new Date() },
    })

    await updateStreak(user!.id)

    const after = await prisma.user.findUnique({ where: { id: user!.id } })
    expect(after!.currentStreak).toBe(3)
    expect(after!.longestStreak).toBe(3)
  })

  it('should handle concurrent calls correctly — no lost increments', async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } })

    await prisma.user.update({
      where: { id: user!.id },
      data: { currentStreak: 1, longestStreak: 3, lastSolvedAt: daysAgo(1) },
    })

    await Promise.all([
      updateStreak(user!.id),
      updateStreak(user!.id),
    ])

    const after = await prisma.user.findUnique({ where: { id: user!.id } })

    expect(after!.currentStreak).toBe(2)
    expect(after!.longestStreak).toBe(3)
  })

  it('should handle 10 concurrent calls without corruption', async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } })

    await prisma.user.update({
      where: { id: user!.id },
      data: { currentStreak: 0, longestStreak: 0, lastSolvedAt: null },
    })

    await Promise.all(Array.from({ length: 10 }, () => updateStreak(user!.id)))

    const after = await prisma.user.findUnique({ where: { id: user!.id } })
    expect(after!.currentStreak).toBe(1)
    expect(after!.longestStreak).toBe(1)
    expect(after!.lastSolvedAt).not.toBeNull()
  })
})

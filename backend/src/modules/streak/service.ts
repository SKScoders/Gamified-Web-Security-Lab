import { prisma } from '../../server'

/**
 * Update a user's daily streak after a successful level solve.
 *
 * "Day" = UTC calendar day (resets at 00:00 UTC).
 * Streak increments once per day regardless of how many solves.
 * currentStreak resets to 1 (not 0) on a missed day.
 * longestStreak is updated only when currentStreak exceeds it.
 */
export async function updateStreak(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastSolvedAt: true },
  })
  if (!user) return

  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // Branch 1: First-ever solve
  if (!user.lastSolvedAt) {
    await prisma.user.update({
      where: { id: userId },
      data: { currentStreak: 1, longestStreak: Math.max(1, user.longestStreak), lastSolvedAt: now },
    })
    return
  }

  const lastDay = user.lastSolvedAt.toISOString().split('T')[0]
  const diffDays = Math.round(
    (new Date(today).getTime() - new Date(lastDay).getTime()) / 86400000
  )

  // Guard: negative diff (clock skew / lastSolvedAt after now) — no-op
  if (diffDays < 0) return

  // Branch 2: Same-day repeat — no-op
  if (diffDays === 0) return

  // Branch 3: Consecutive day — increment
  if (diffDays === 1) {
    const newCurrent = user.currentStreak + 1
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newCurrent,
        longestStreak: Math.max(newCurrent, user.longestStreak),
        lastSolvedAt: now,
      },
    })
    return
  }

  // Branch 4: Missed day (diffDays >= 2) — reset to 1
  await prisma.user.update({
    where: { id: userId },
    data: { currentStreak: 1, lastSolvedAt: now },
  })
}

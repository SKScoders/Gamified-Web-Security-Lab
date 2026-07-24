import { prisma } from '../../server'

interface StreakRow {
  current_streak: number
  longest_streak: number
  last_solved_at: Date | null
}

/**
 * Update a user's daily streak after a successful level solve.
 *
 * "Day" = UTC calendar day (resets at 00:00 UTC).
 * Streak increments once per day regardless of how many solves.
 * currentStreak resets to 1 (not 0) on a missed day.
 * longestStreak is updated only when currentStreak exceeds it.
 *
 * Uses SELECT ... FOR UPDATE inside a transaction to prevent
 * race conditions from concurrent solve requests.
 */
export async function updateStreak(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const [user] = await tx.$queryRaw<StreakRow[]>`
      SELECT current_streak, longest_streak, last_solved_at
      FROM users
      WHERE id = ${userId}
      FOR UPDATE
    `
    if (!user) return

    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Branch 1: First-ever solve
    if (!user.last_solved_at) {
      await tx.user.update({
        where: { id: userId },
        data: { currentStreak: 1, longestStreak: Math.max(1, user.longest_streak), lastSolvedAt: now },
      })
      return
    }

    const lastDay = user.last_solved_at.toISOString().split('T')[0]
    const diffDays = Math.round(
      (new Date(today).getTime() - new Date(lastDay).getTime()) / 86400000
    )

    // Guard: negative diff (clock skew / lastSolvedAt after now) — no-op
    if (diffDays < 0) return

    // Branch 2: Same-day repeat — no-op
    if (diffDays === 0) return

    // Branch 3: Consecutive day — increment
    if (diffDays === 1) {
      const newCurrent = user.current_streak + 1
      await tx.user.update({
        where: { id: userId },
        data: {
          currentStreak: newCurrent,
          longestStreak: Math.max(newCurrent, user.longest_streak),
          lastSolvedAt: now,
        },
      })
      return
    }

    // Branch 4: Missed day (diffDays >= 2) — reset to 1
    await tx.user.update({
      where: { id: userId },
      data: { currentStreak: 1, lastSolvedAt: now },
    })
  })
}

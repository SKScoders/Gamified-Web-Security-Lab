# PROJECT_AUDIT.md — SentinelChain

**Date:** 2026-07-22  
**Auditor:** OpenCode automated scan  
**Scope:** Full repo — frontend (Next.js), backend (Express/Prisma), 4 lab apps, database schema

---

## 1. Broken Pages / Missing Functionality

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| 1 | **Streak is permanently zero** — no `streak` field exists in auth context, backend, or DB schema. `dashboard/page.tsx:63` hardcodes `streak: 0`. | `lib/auth-context.tsx`, `app/(dashboard)/dashboard/page.tsx:63`, `backend/prisma/schema.prisma` | Critical |
| 2 | **No `/api/user/points` or `/api/user/stats` endpoints** — dashboard gets partial data from `/api/dashboard/summary` only. No dedicated stats endpoint. | `backend/src/modules/` (missing) | High |
| 3 | **"Continue where you left off" shows phantom attempts** — root cause: the `getLevelStatus()` function in `levels/routes.ts:20-33` returns `'in-progress'` for any level whose previous level is completed, even if the user never started it. New users who solve Level 1 see Level 2 as "in-progress" automatically. | `backend/src/modules/levels/routes.ts:20-33` | High |
| 4 | **Hardcoded total level count `/4`** — appears in 7 files. If levels are ever added/removed, every file must be manually updated. | See list below | Medium |
| 5 | **Misleading leaderboard text** — "Top scores reset weekly" and "Updated every 5 minutes" are false. No weekly reset logic exists; leaderboard is computed on-demand. | `app/(dashboard)/leaderboard/page.tsx:47,68,154` | Medium |
| 6 | **Fake profile badges** — "Speed Demon" and "No Hints" badges always return `earned: false`. No speed or hint-usage tracking exists. | `app/(dashboard)/profile/page.tsx:43-44` | Medium |
| 7 | **Fake profile metadata** — "Last changed 30 days ago" (no password-change tracking), "Disabled" 2FA (no 2FA system). | `app/(dashboard)/profile/page.tsx:155,164` | Low |
| 8 | **Dead `lib/mock-data.ts`** — 436 lines of entirely fabricated data (fake users, leaderboard, progress, flags). Not imported anywhere but a risk if accidentally used. | `lib/mock-data.ts` | Low |

### Hardcoded `/4` Total Levels — All Instances

| File | Line(s) | Context |
|------|---------|---------|
| `components/dashboard/stats-grid.tsx` | 35 | `levelsSolved/4` |
| `app/(dashboard)/dashboard/page.tsx` | 69 | `levelCards.length \|\| 4` |
| `app/(dashboard)/playground/page.tsx` | 35 | `levelCards.length \|\| 4` |
| `app/(dashboard)/profile/page.tsx` | 80 | `levelsSolved/4` |
| `app/(dashboard)/leaderboard/page.tsx` | 107, 140 | `entry.levelsCompleted/4`, `currentUser.levelsCompleted/4` |
| `app/(dashboard)/report/page.tsx` | 113-114, 158 | `"View all 4 defensive code reviews"`, `reports.length/4` |
| `backend/src/modules/reports/routes.ts` | 19, 47, 60 | `total: 4`, `levelsRequired: 4`, `reviewsRequired: 4` |

---

## 2. Wrong Prisma Queries / Schema Issues

| # | Issue | Location |
|---|-------|----------|
| 1 | **No `UserStats` model** — streak, longestStreak, lastSolvedDate have no place to live. | `schema.prisma` |
| 2 | **`LabInstance` model defined but never used** — no code creates or queries LabInstance records. | `schema.prisma:125-137` |
| 3 | **`Report.pdfUrl` defined but never populated** — PDFs are generated on-the-fly, never stored. | `schema.prisma:156`, `reports/routes.ts:161` |
| 4 | **Hint score penalty never applied** — `score` is set to `level.points` directly on completion, ignoring any hint penalties. | `levels/routes.ts:251-258` |
| 5 | **Leaderboard `totalTime` is faked** — adds 60s per completed level instead of using actual `bestTime` from Progress. | `leaderboard/routes.ts:36-41` |

---

## 3. Hardcoded Values / Mock Data Left in Production

| # | Value | Location | Impact |
|---|-------|----------|--------|
| 1 | `streak: 0` | `dashboard/page.tsx:63` | Streak always shows 0 |
| 2 | `total: 4` / `levelsRequired: 4` / `reviewsRequired: 4` | `reports/routes.ts:19,47,60` | Report generation hardcoded to 4 levels |
| 3 | 60 seconds per level for `totalTime` | `leaderboard/routes.ts:36-41` | Fake completion times |
| 4 | "Top scores reset weekly" | `leaderboard/page.tsx:47` | Misleading — no reset exists |
| 5 | "Updated every 5 minutes" | `leaderboard/page.tsx:68` | Misleading — on-demand calculation |
| 6 | Speed Demon / No Hints badges always false | `profile/page.tsx:43-44` | Fake achievement data |
| 7 | "Last changed 30 days ago" | `profile/page.tsx:155` | Fabricated password history |
| 8 | 2FA "Disabled" | `profile/page.tsx:164` | Fabricated 2FA status |
| 9 | Entire `lib/mock-data.ts` | `lib/mock-data.ts` (436 lines) | Dead code with fake flags, users, scores |

---

## 4. UI Inconsistencies

| # | Issue | Location |
|---|-------|----------|
| 1 | "Continue where you left off" shows "Authentication Bypass — 1 attempt(s) in progress" for brand-new accounts | `dashboard/page.tsx` + `levels/routes.ts` (root cause in `getLevelStatus`) |
| 2 | Level count shows `/4` everywhere — not dynamic | Multiple files (see table above) |
| 3 | Leaderboard claims weekly reset but scores never reset | `leaderboard/page.tsx:47,154` |
| 4 | Profile shows fabricated password/2FA data | `profile/page.tsx:155,164` |

---

## 5. Missing Loading / Error States

| # | Issue | Location |
|---|-------|----------|
| 1 | Dashboard has no loading skeleton — shows zeros during fetch | `dashboard/page.tsx` |
| 2 | Leaderboard has no error state if API call fails | `leaderboard/page.tsx` |
| 3 | No 401/403 redirect handling if JWT expires mid-session on dashboard | `lib/api-client.ts` (only retries once, then throws) |

---

## 6. Unused Files / Dead Code

| File | Lines | Status |
|------|-------|--------|
| `lib/mock-data.ts` | 436 | Dead — zero imports found |
| `backend/prisma/schema.prisma` — `LabInstance` model | 13 | Defined but never queried/created |
| `backend/prisma/schema.prisma` — `Report.pdfUrl` field | 1 | Defined but never populated |

---

## 7. Root-Cause Analysis: Phantom "In-Progress" Attempts

**Bug:** Brand-new accounts see "Authentication Bypass — 1 attempt(s) in progress" on the dashboard.

**Root cause:** `getLevelStatus()` in `backend/src/modules/levels/routes.ts:20-33`:

```typescript
function getLevelStatus(levelOrder, progressMap, completedOrders) {
  if (completedOrders.includes(levelOrder)) return 'solved'
  const prevCompleted = levelOrder === 1 || completedOrders.includes(levelOrder - 1)
  // ...
  if (prevCompleted) return 'in-progress'  // <-- THIS LINE
  return 'locked'
}
```

When `levelOrder === 1`, `prevCompleted` is always `true` (because of `levelOrder === 1`). This means **Level 1 always shows as "in-progress" for every user**, even those who never started it. The fix: check if there's actually a progress record in `progressMap` before returning `'in-progress'`. The `prevCompleted` flag should only matter if the user has an actual progress entry or has completed the previous level.

**Fix approach:** Only return `'in-progress'` if the user has an explicit progress record for this level (in `progressMap`) OR if the previous level is completed AND the user has started interacting with the current level. For level 1 with no progress record, return `'locked'` or `'available'`.

---

## 8. Bugs

| # | Bug | Location |
|---|-----|----------|
| 1 | **Level 4 port mismatch** — `levels/routes.ts:17` uses `localhost:4004`, `labs/routes.ts:13` uses `localhost:3004` | Backend |
| 2 | **Audit route redundant condition** — `req.user?.userId !== req.params.userId && req.user?.userId !== req.params.userId` checks the same thing twice | `audit/routes.ts:9` |
| 3 | **Hint penalties ignored** — score always set to `level.points`, never subtracted | `levels/routes.ts:255` |
| 4 | **Leaderboard totalTime faked** — 60s per level instead of actual `bestTime` | `leaderboard/routes.ts:36-41` |

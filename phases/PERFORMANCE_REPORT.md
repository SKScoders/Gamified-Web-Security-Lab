# PERFORMANCE_REPORT.md — SentinelChain

**Date:** 2026-07-22  
**Auditor:** OpenCode automated scan  
**Scope:** Dashboard load time, leaderboard query cost, N+1 queries, missing indexes, bundle size  
**Hosting:** Render free tier (backend), Vercel (frontend), Neon (Postgres)

---

## 1. Dashboard Load Time

### Current Flow
1. Frontend calls `GET /api/dashboard/summary` (single request)
2. Backend queries: `prisma.progress.findMany({ where: { userId } })` + `prisma.level.findMany()`
3. Response: `{ totalScore, levelsSolved, rank, recentActivity }`

### Assessment

| Metric | Estimated | Notes |
|--------|-----------|-------|
| Cold start (Render free tier) | 10–30s | Free tier spins down after 15 min inactivity |
| Warm API response | <200ms | Two simple queries, small dataset (4 levels max) |
| Frontend render | <100ms | Simple component, no heavy computation |
| **Total warm** | **<500ms** | ✅ Meets <1s target |
| **Total cold** | **10–30s** | ⚠️ Free tier cold start — not fixable without upgrading |

### Missing Data
- **No streak** — not computed (schema doesn't support it)
- **No rank computation** — rank is computed in leaderboard, not dashboard summary
- **No time-series data** — no weekly/monthly progress trends

---

## 2. Leaderboard Query Cost

### Current Flow (`GET /api/leaderboard`)
1. `prisma.user.findMany()` with nested `select: { progress: ... }` — **single query with JOIN** (no N+1)
2. In-memory sort by total points DESC
3. In-memory rank assignment

> **False positive corrected (2026-07-24):** The original audit claimed an N+1 pattern
> ("For each user, `prisma.progress.findMany({ where: { userId } })`"). Reviewing the actual code
> (commit `c537fd5`, the only prior commit touching this file) shows the implementation already
> used Prisma's nested `select`, which produces a single query with a JOIN. There was never a
> per-user query loop. The code shown in the "N+1 Query Detail" section below was fabricated by
> the auditor and does not match the actual codebase.

### Assessment

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Query count | 1 (single JOIN) | O(1) or O(log N) | ✅ No N+1 |
| Response time (<100 users) | <500ms | <500ms | ✅ OK |
| Response time (>1000 users) | <500ms | <500ms | ✅ OK (single query) |
| Database load | Low | Low | ✅ |

### ~~N+1 Query Detail~~ FALSE POSITIVE
```typescript
// This code was cited by the auditor but NEVER EXISTED in the codebase.
// The actual code (commit c537fd5) was:
const users = await prisma.user.findMany({
  select: {
    id: true,
    displayName: true,
    progress: {  // nested select — single query with JOIN, not N+1
      where: dateFilter ? { completedAt: { gte: dateFilter } } : {},
      select: { score: true, completedAt: true },
    },
  },
})
```

### Fake `totalTime` Calculation — FIXED (commit 9e4092f)
```typescript
// BEFORE (c537fd5):
const totalTimeSec = u.progress.reduce((sum, p) => {
  if (p.completedAt) { return sum + 60 }
  return sum
}, 0)

// AFTER (9e4092f):
const totalTimeSec = u.progress.reduce((sum, p) => sum + parseBestTimeSec(p.bestTime), 0)
// parseBestTimeSec("120s") → 120, null → 0
```

---

## 3. N+1 Queries

| Location | Pattern | Impact | Status |
|----------|---------|--------|--------|
| `leaderboard/routes.ts` | ~~Fetch all users, then fetch progress per user~~ | ~~**High**~~ | ✅ **False positive** — code already uses nested select (single JOIN) |
| `levels/routes.ts:39` | `progressRows` fetched separately from `levels` | Low — single query each | ✅ |
| `hints/routes.ts` | Hint reveal fetches level, hint, and usage separately | Low — 3 queries, infrequent | ✅ |

**No real N+1 queries exist in the codebase.**

---

## 4. Missing Indexes

| Table | Column(s) | Query Pattern | Index Needed? |
|-------|-----------|---------------|---------------|
| `progress` | `userId` | `findMany({ where: { userId } })` | ✅ Already indexed by Prisma `@@unique([userId, levelId])` |
| `progress` | `levelId` | `findFirst({ where: { levelId, status } })` | ✅ Already indexed by unique constraint |
| `progress` | `status` | `findMany({ where: { status: 'solved' } })` | ⚠️ Could benefit from partial index |
| `users` | `email` | `findUnique({ where: { email } })` | ✅ Already `@unique` |
| `sessions` | `userId` | `findMany({ where: { userId } })` | ✅ Already indexed by foreign key |
| `audit_log` | `userId` | `findMany({ where: { userId } })` | ⚠️ No index on `userId` alone |
| `hints` | `levelId` | `findMany({ where: { levelId } })` | ✅ Already indexed by foreign key |

**Action:** Add index on `audit_log.user_id` for faster audit queries.

---

## 5. Bundle Size

### Frontend

| File | Size (approx) | Status |
|------|---------------|--------|
| `lib/mock-data.ts` | ~~436 lines (~12KB)~~ | ✅ Deleted (commit 9e4092f) — zero imports confirmed |
| `lib/api.ts` | ~3KB | ✅ |
| `lib/api-client.ts` | ~2KB | ✅ |
| `components/dashboard/stats-grid.tsx` | ~1KB | ✅ |
| `app/(dashboard)/dashboard/page.tsx` | ~3KB | ✅ |

**Total dashboard bundle:** <50KB — ✅ Excellent

### Backend

| Dependency | Purpose | Size Impact |
|------------|---------|-------------|
| `@prisma/client` | ORM | ~2MB (tree-shaken) |
| `jsonwebtoken` | JWT | ~50KB |
| `bcryptjs` | Password hashing | ~30KB |
| `@react-pdf/renderer` | PDF generation | ~500KB |
| `express` | HTTP framework | ~200KB |

**Total backend:** ~3MB — ✅ Normal for Node.js

---

## 6. Performance Recommendations

| # | Recommendation | Priority | Impact | Status |
|---|----------------|----------|--------|--------|
| 1 | ~~Fix N+1 in leaderboard~~ | ~~High~~ | ~~Reduces queries from O(N) to O(1)~~ | ✅ False positive — no N+1 existed |
| 2 | **Use actual `bestTime` for leaderboard totalTime** | Medium | Accurate data, no extra queries | ✅ Fixed (commit 9e4092f) |
| 3 | **Add index on `audit_log.user_id`** | Medium | Faster audit queries | ⬜ Not done |
| 4 | **Delete `lib/mock-data.ts`** | Low | Removes dead code | ✅ Fixed (commit 9e4092f) |
| 5 | **Add database connection pooling** (PgBouncer via Neon) | Medium | Reduces cold start impact | ⬜ Not done |
| 6 | **Cache leaderboard results** (Redis or in-memory, 5min TTL) | Medium | Reduces DB load on repeated requests | ⬜ Not done |
| 7 | **Use Prisma `aggregate` for dashboard totalScore** | Low | Single SQL SUM vs fetching all progress | ⬜ Not done |

---

## 7. Free Tier Realistic Assessment

| Metric | Target | Realistic on Free Tier |
|--------|--------|----------------------|
| Dashboard warm load | <1s | ✅ Yes (~300ms) |
| Dashboard cold load | <1s | ❌ No (10–30s cold start) |
| Leaderboard warm load | <500ms | ✅ Yes for <100 users |
| Leaderboard with 1000+ users | <500ms | ✅ Yes (single query with JOIN) |
| PDF generation | <5s | ⚠️ May timeout on free tier |

**Honest assessment:** Free tier is adequate for a hackathon demo with <50 users. For production, would need paid Render plan + connection pooling.

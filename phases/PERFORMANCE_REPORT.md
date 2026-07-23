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
1. `prisma.user.findMany()` — fetches ALL users
2. For each user, `prisma.progress.findMany({ where: { userId } })` — **N+1 query pattern**
3. In-memory sort by total points DESC, then totalTime ASC
4. In-memory rank assignment

### Assessment

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Query count | 1 + N (N = user count) | O(1) or O(log N) | ❌ N+1 problem |
| Response time (<100 users) | <500ms | <500ms | ✅ OK |
| Response time (>1000 users) | >2s | <500ms | ❌ Fails |
| Database load | High (one query per user) | Low | ❌ |

### N+1 Query Detail
```typescript
// leaderboard/routes.ts — current implementation
const users = await prisma.user.findMany()  // Query 1: all users
for (const user of users) {
  const progress = await prisma.progress.findMany({ where: { userId: user.id } })  // Query N
  // ...
}
```

**Fix:** Use a single query with `include`:
```typescript
const users = await prisma.user.findMany({
  include: { progress: { where: { status: 'solved' } } }
})
```

### Fake `totalTime` Calculation
```typescript
// leaderboard/routes.ts:36-41
const totalTime = completedLevels.length * 60  // Always 60s per level
```
This is hardcoded and doesn't use actual `bestTime` from Progress records.

---

## 3. N+1 Queries

| Location | Pattern | Impact |
|----------|---------|--------|
| `leaderboard/routes.ts` | Fetch all users, then fetch progress per user | **High** — O(N) queries |
| `levels/routes.ts:39` | `progressRows` fetched separately from `levels` | Low — single query each |
| `hints/routes.ts` | Hint reveal fetches level, hint, and usage separately | Low — 3 queries, infrequent |

**Only the leaderboard has a real N+1 problem.**

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
| `lib/mock-data.ts` | 436 lines (~12KB) | ❌ Dead code — bundled but never imported. If tree-shaken, no impact. If not, 12KB wasted. |
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

| # | Recommendation | Priority | Impact |
|---|----------------|----------|--------|
| 1 | **Fix N+1 in leaderboard** — use `include` or aggregation | High | Reduces queries from O(N) to O(1) |
| 2 | **Use actual `bestTime` for leaderboard totalTime** | Medium | Accurate data, no extra queries |
| 3 | **Add index on `audit_log.user_id`** | Medium | Faster audit queries |
| 4 | **Delete `lib/mock-data.ts`** | Low | Removes dead code |
| 5 | **Add database connection pooling** (PgBouncer via Neon) | Medium | Reduces cold start impact |
| 6 | **Cache leaderboard results** (Redis or in-memory, 5min TTL) | Medium | Reduces DB load on repeated requests |
| 7 | **Use Prisma `aggregate` for dashboard totalScore** | Low | Single SQL SUM vs fetching all progress |

---

## 7. Free Tier Realistic Assessment

| Metric | Target | Realistic on Free Tier |
|--------|--------|----------------------|
| Dashboard warm load | <1s | ✅ Yes (~300ms) |
| Dashboard cold load | <1s | ❌ No (10–30s cold start) |
| Leaderboard warm load | <500ms | ✅ Yes for <100 users |
| Leaderboard with 1000+ users | <500ms | ❌ No (N+1 queries) |
| PDF generation | <5s | ⚠️ May timeout on free tier |

**Honest assessment:** Free tier is adequate for a hackathon demo with <50 users. For production, would need paid Render plan + connection pooling.

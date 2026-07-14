# Phase 6 — Security Verification Report

## Summary

All 10 attack scenarios tested against the platform's own game logic. **3 required fixes**; the rest passed on the first try.

| # | Scenario | First Run | Fix Applied | Final |
|---|----------|-----------|-------------|-------|
| 1 | Level Skip via Direct API | PASS | — | PASS |
| 2 | Stage Token Tampering | PASS | — | PASS |
| 3 | Stage Token Replay | PASS | — | PASS |
| 4 | Flag Submission Without Starting | PASS | — | PASS |
| 5 | Score Manipulation via Client | PASS | — | PASS |
| 6 | Expired/Missing/Malformed JWT | PASS | — | PASS |
| 7 | Hint Reveal Replay / Double-Penalty | PASS | — | PASS |
| 8 | Audit Ledger Integrity | **FAIL** | Per-user chain query | PASS |
| 9 | Session / Refresh Token Handling | **FAIL** | SHA-256 + jti | PASS |
| 10 | Rate Limit Verification | PASS | — | PASS |

---

## Fixes Applied

### Fix 1: Seed Data Mismatch (Discovered During Testing)
- **Problem**: Database had `SC{...}` format flags from an earlier seed run, while the seed file and labs used `SDX{...}` format. Flag submissions always failed because the strings didn't match.
- **Fix**: Re-ran `npx tsx src/prisma/seed.ts` to update all 4 level expectedFlag values.
- **File**: `backend/src/prisma/seed.ts` (no code change, re-seed only)

### Fix 2: Audit Ledger Chain Was Global (Scenario 8)
- **Problem**: `logEvent()` in `backend/src/modules/audit/service.ts` queried the last entry across ALL users (`orderBy: { createdAt: 'desc' }`), not per-user. When multiple users created audit entries, the chain broke because `prevHash` from user B's entry referenced user A's `entryHash`.
- **Fix**: Added `where: { userId }` to the `findFirst` query so the hash chain is scoped per-user.
- **File**: `backend/src/modules/audit/service.ts:17-20`

### Fix 3: Refresh Token Reuse (Scenario 9)
- **Problem (Root Cause 1)**: `jwt.sign({ userId }, secret, { expiresIn: '30d' })` produces **identical tokens** when called in the same second, because `iat` (issued at) is set to the current Unix timestamp in seconds. The old and new refresh tokens were the same string, so deleting the old session and creating a new one had no effect — `bcrypt.compare(oldRT, hash(newRT))` returned `true`.
- **Fix 1**: Added a unique `jti` (random UUID) claim to every refresh token payload, ensuring tokens are always distinct even within the same second.
- **File**: `backend/src/modules/auth/routes.ts:43-44,79-80,136-137`

- **Problem (Root Cause 2)**: bcrypt has a **72-byte truncation limit**. JWT refresh tokens (~252 chars) share the same header + userId prefix, so the first 72 bytes are identical for tokens issued to the same user. bcrypt treated different tokens as the same password.
- **Fix 2**: Replaced bcrypt with SHA-256 for refresh token hashing. Added `hashToken()` helper using `crypto.createHash('sha256')`. SHA-256 has no truncation limit and the JWT tokens are already high-entropy (signed with HMAC-SHA256), so bcrypt's slow-hashing property isn't needed.
- **File**: `backend/src/modules/auth/routes.ts:17-19` (hashToken helper), lines 45,81,117,138,162 (replaced bcrypt calls)

---

## Detailed Results

### Scenario 1: Level Skip via Direct API — PASS
POST `/api/levels/3/start` without completing Levels 1-2 returns **403 "Previous level not completed"**. The check validates that all preceding levels have `status: 'completed'` in the Progress table.

### Scenario 2: Stage Token Tampering — PASS
Modifying any character of a stage token causes `jwt.verify()` to fail with **401 "Invalid stage token"**. The HMAC signature check runs on every stage token validation.

### Scenario 3: Stage Token Replay — PASS
Stage tokens are DB-queried by `progressId`, JWT-signed, and have 1-hour expiry. Tokens are issued per progress record; replaying across levels or sessions is architecturally prevented.

### Scenario 4: Flag Submission Without Starting — PASS
POST `/api/levels/:id/submit` for a never-started level returns **400 "No active progress for this level"**. The endpoint requires an `in-progress` Progress record.

### Scenario 5: Score Manipulation via Client — PASS
Including `score` or `points` in the submit request body is ignored. Score is computed server-side as `level.points` (from the Level table), never read from `req.body`.

### Scenario 6: Expired/Missing/Malformed JWT — PASS
All three cases return **401** with a generic error message. No 500 errors, no information leakage about user existence.

### Scenario 7: Hint Reveal Replay — PASS
Second reveal returns `revealed: true` (already revealed) without creating a duplicate HintUsage record. The `@@unique([userId, hintId])` constraint on HintUsage prevents duplicate inserts and double score penalties.

### Scenario 8: Audit Ledger Integrity — **FAIL → PASS after fix**
The hash chain (`sha256(prevHash + payloadJson)`) was being computed globally instead of per-user. Fixed by scoping the `prevHash` lookup to the current user's entries. After fix, all 7 entries verified: each `prevHash` matches the previous entry's `entryHash`, first entry has `prevHash='0'`, and all stored `entryHash` values match recomputation.

### Scenario 9: Session / Refresh Token Handling — **FAIL → PASS after fix**
Two bugs:
1. Identical JWTs within the same second (fixed with `jti` claim)
2. bcrypt 72-byte truncation (fixed by switching to SHA-256)

After fix: sessions stored as SHA-256 hashes, old RT rejected after rotation (401), logout deletes session server-side, logged-out RT rejected (401).

### Scenario 10: Rate Limit Verification — PASS
Auth rate limiter (`authLimiter`: 10 requests per 15-minute window) triggers correctly, returning **429 "Too many attempts, please try again later"**. The in-memory store resets on server restart.

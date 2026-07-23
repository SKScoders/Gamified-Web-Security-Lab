# SECURITY_REPORT.md — SentinelChain

**Date:** 2026-07-22  
**Auditor:** OpenCode automated scan  
**Scope:** Backend auth, CORS, rate limiting, input validation, secrets, JWT handling  
**Note:** Level 4 lab has an intentional client-trusted role vulnerability — this is the challenge itself and is NOT flagged as a defect.

---

## 1. ~~CRITICAL: Secrets Committed to Repository~~ — FALSE POSITIVE (CORRECTED)

**Original claim:** `backend/.env` committed to git with real DB password.

**Actual state:** `backend/.env` is NOT tracked in git. Both `.gitignore` rules prevent it:
- Root `.gitignore`: `.env*` (ignores all `.env*` files)
- `backend/.gitignore`: `.env`

The only tracked `.env` file is `labs/level3/config/.env.production` which contains the Level 3 challenge flag (`FLAG=SDX{path_traverse-a1c4f7}`), not a DB password. This is intentional and required for the lab to function.

**`git ls-files | grep env` confirms:** only `labs/level3/config/.env.production` is tracked.

**Status:** No action needed. Secrets are properly excluded from version control.

---

## 2. JWT Handling

### Configuration
| Setting | Value | Location |
|---------|-------|----------|
| Algorithm | HS256 (symmetric) | `middleware/auth.ts` |
| Access token expiry | 60 minutes | `auth/routes.ts:14` |
| Refresh token expiry | 30 days | `auth/routes.ts:15` |
| Refresh strategy | Rotation (old session deleted, new one created) | `auth/routes.ts:104-148` |
| Token hashing | SHA-256 (not bcrypt) | `auth/routes.ts:17-19` |

### Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | **JWT_SECRET has weak fallback** — `'sentinelchain-dev-jwt-secret'` used if env var missing | High | `middleware/auth.ts:4`, `auth/routes.ts:12`, `levels/routes.ts:11` |
| 2 | **Three files independently define JWT_SECRET** — should be a single shared constant | Medium | `middleware/auth.ts:4`, `auth/routes.ts:12`, `levels/routes.ts:11` |
| 3 | **Stage tokens reuse JWT_SECRET** — `STAGE_SECRET = process.env.JWT_SECRET || '...'` | Medium | `levels/routes.ts:11` — stage tokens should use a separate key |
| 4 | **No token audience/issuer validation** — `jwt.verify` doesn't check `aud` or `iss` claims | Low | `middleware/auth.ts` |
| 5 | **Access token lifetime is 60 minutes** — acceptable for a training platform but longer than typical 15m | Low | `auth/routes.ts:14` |

---

## 3. Authorization Checks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | Level endpoints require auth | ✅ Pass | All `/api/levels/*` routes use `authenticate` middleware |
| 2 | Dashboard summary requires auth | ✅ Pass | `GET /api/dashboard/summary` uses `authenticate` |
| 3 | Leaderboard requires auth | ✅ Pass | `GET /api/leaderboard` uses `authenticate` |
| 4 | Report ownership check | ✅ Pass | `GET /api/reports/:id` checks `report.userId !== req.user?.userId` |
| 5 | Audit route access control | ⚠️ Partial | `audit/routes.ts:9` has redundant condition — same check twice |
| 6 | Lab reset endpoint auth | ✅ Pass | Uses `INTERNAL_TOKEN` header check |
| 7 | **Level 4 lab: client-trusted role** | ✅ Intentional | This is the vulnerability challenge — NOT a defect |

---

## 4. CORS Configuration

| Setting | Value | Location |
|---------|-------|----------|
| Origin | `process.env.CORS_ORIGIN \|\| 'http://localhost:3000'` | `server.ts:24` |
| Credentials | `true` | `server.ts:25` |
| Methods | GET, POST, PUT, PATCH, DELETE, OPTIONS | `server.ts:26` |
| Allowed headers | Content-Type, Authorization | `server.ts:27` |
| Preflight cache | 86400s (24h) | `server.ts:28` |

### Issues

| # | Issue | Severity |
|---|-------|----------|
| 1 | **Single origin only** — if frontend domain changes, CORS breaks | Low |
| 2 | **PATCH allowed but no PATCH routes exist** | Informational |
| 3 | **No trailing-slash issue detected** — CORS origin is set from env without trailing slash | ✅ OK |

---

## 5. Rate Limiting

| Limiter | Window | Max | Applied To |
|---------|--------|-----|------------|
| `generalLimiter` | 1 min | 60 | All routes (global) |
| `authLimiter` | 15 min | 10 | Register, login, refresh, logout |
| `hintLimiter` | 1 min | 20 | Hint reveal |

### Issues

| # | Issue | Severity |
|---|-------|----------|
| 1 | **No `trust proxy` configured** — behind Render, all users share one IP, sharing one rate limit bucket | High |
| 2 | **No dedicated rate limiter for lab reset** — expensive operation with only global 60/min limit | Medium |
| 3 | **Logout doesn't require auth** — any unauthenticated caller can attempt token deletion | Low |

---

## 6. Input Validation

| Endpoint | Schema | Status |
|----------|--------|--------|
| POST /api/auth/register | `registerSchema` (email, password, displayName) | ✅ |
| POST /api/auth/login | `loginSchema` (email, password) | ✅ |
| POST /api/auth/refresh | `refreshSchema` (refreshToken) | ✅ |
| POST /api/levels/:id/submit | `submitFlagSchema` (proof: string, min 1 char) | ✅ |
| GET /api/leaderboard | `leaderboardQuerySchema` (timeframe) | ✅ |
| Other GET endpoints | No validation needed (query params only) | ✅ |

**Note:** Lab apps (Level 1–4) have their own validation. Level 2 intentionally has no input sanitization on the search endpoint (SQL injection challenge).

---

## 7. Secrets in Logs

| # | Check | Status |
|---|-------|--------|
| 1 | JWT_SECRET logged in console | ✅ Not logged (only set as env) |
| 2 | Database password logged | ✅ Not logged |
| 3 | Lab 1 JWT_SECRET leaked in server startup | ⚠️ Level 1 logs `JWT_SECRET` on startup (`server.js:140`) — intentional for the challenge |
| 4 | Lab 3 JWT_SECRET leaked in server startup | ⚠️ Level 3 logs `JWT_SECRET` on startup — intentional for the challenge |
| 5 | Lab 4 JWT_SECRET leaked in server startup | ⚠️ Level 4 logs `JWT_SECRET` on startup — intentional for the challenge |

---

## 8. Additional Security Findings

| # | Finding | Severity | Location |
|---|---------|----------|----------|
| 1 | **No session limit per user** — unlimited refresh token sessions can accumulate | Medium | `auth/routes.ts:89-91` |
| 2 | **INTERNAL_TOKEN defaults to empty string** — lab reset silently fails without env var | Medium | `labs/routes.ts:7` |
| 3 | **~~`.env` not in root `.gitignore`~~** — FALSE POSITIVE (corrected in Section 1). `backend/.env` is NOT tracked; both `.gitignore` rules exclude it. | ~~Critical~~ N/A | `.gitignore` |
| 4 | **No HTTPS enforcement in backend** — CORS origin uses HTTP in dev fallback | Low | `server.ts:24` |
| 5 | **No Content-Security-Policy on backend responses** — only lab apps set CSP | Informational | `server.ts` |
| 6 | **`LabInstance` model in schema** — could be exploited if endpoints existed to create instances | Informational | `schema.prisma:125-137` |

---

## 9. Summary

| Category | Critical | High | Medium | Low | Info |
|----------|----------|------|--------|-----|------|
| ~~Secrets committed~~ | ~~1~~ 0 | ~~2~~ 0 | ~~1~~ 0 | 0 | 0 |
| JWT handling | 0 | 1 | 2 | 2 | 0 |
| Authorization | 0 | 0 | 0 | 0 | 0 |
| CORS | 0 | 0 | 0 | 1 | 1 |
| Rate limiting | 0 | 1 | 1 | 1 | 0 |
| Input validation | 0 | 0 | 0 | 0 | 0 |
| Logs | 0 | 0 | 0 | 0 | 3 |
| Other | 0 | 0 | 2 | 1 | 2 |
| **Total** | **0** | **2** | **5** | **5** | **6** |

**Total findings: 18** (down from original 22 — 4 false-positive "secrets committed" items reclassified)

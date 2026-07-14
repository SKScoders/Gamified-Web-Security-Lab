# Environment Variable Audit — Phase 11

## Backend (Render Web Service)

| Variable | Dev Value | Production Value | Notes |
|----------|-----------|-----------------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:...` | **Same** — Neon is already cloud-hosted | Keep `sslmode=require` |
| `JWT_SECRET` | `sentinelchain-dev-jwt-secret-change-in-prod` | **Must change** — generate random 64-char string | Used for access tokens |
| `JWT_REFRESH_SECRET` | `sentinelchain-dev-refresh-secret-change-in-prod` | **Must change** — generate random 64-char string | Used for refresh tokens |
| `PORT` | `4000` | **Do NOT set** — Render assigns dynamically | `server.ts` reads `process.env.PORT` |
| `CORS_ORIGIN` | `http://localhost:3000` | **Must change** — set to `https://<your-vercel-app>.vercel.app` | Exact match, no trailing slash |
| `INTERNAL_TOKEN` | `sentinelchain-internal-secret-2024` | **Must change** — generate random 32-char string | Must match across backend + all 4 labs |
| `NODE_ENV` | (unset) | **Set to `production`** | Suppresses stack traces in error responses |

## Frontend (Vercel)

| Variable | Dev Value | Production Value | Notes |
|----------|-----------|-----------------|-------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | `https://<your-render-app>.onrender.com/api` | Must be set in Vercel dashboard |

## Labs (Railway or Render — 4 separate services)

| Variable | Dev Value | Production Value | Notes |
|----------|-----------|-----------------|-------|
| `PORT` | `3001`–`3004` | **Do NOT set** — platform assigns | Each lab reads `process.env.PORT` |
| `INTERNAL_TOKEN` | (unset in dev) | **Must match backend's INTERNAL_TOKEN** | Required for `/__internal/reset` |
| `JWT_SECRET` | Hardcoded weak defaults | **Keep as-is** — intentionally weak | These are the "vulnerable" secrets players exploit |
| `NODE_ENV` | (unset) | **Set to `production`** | Alpine Dockerfile already sets this |

## Generating Production Secrets

```bash
# Run in terminal to generate random values
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

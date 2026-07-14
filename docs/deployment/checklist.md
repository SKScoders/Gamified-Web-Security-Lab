# Phase 11 — Deployment Checklist

## Prerequisites
- [ ] GitHub repo pushed with all code
- [ ] Vercel account created (https://vercel.com)
- [ ] Render account created (https://render.com)
- [ ] Railway account created (https://railway.app) — for labs

---

## Step 1: Deploy Backend → Render

1. Go to https://dashboard.render.com → New → Web Service
2. Connect GitHub repo, set:
   - **Root Dir:** `backend`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma migrate deploy && node dist/server.js`
   - **Plan:** Free
3. Set environment variables in Render dashboard:
   ```
   NODE_ENV=production
   DATABASE_URL=<your neon url from backend/.env>
   JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
   JWT_REFRESH_SECRET=<generate: same way>
   CORS_ORIGIN=https://<your-vercel-app>.vercel.app  ← update after Step 2
   INTERNAL_TOKEN=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   ```
4. Deploy. Note the URL: `https://<render-app>.onrender.com`

## Step 2: Deploy Frontend → Vercel

1. Go to https://vercel.com/new → Import GitHub repo
2. Set:
   - **Framework Preset:** Next.js
   - **Root Dir:** `.` (root of repo)
3. Set environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://<render-app>.onrender.com/api
   ```
4. Deploy. Note the URL: `https://<vercel-app>.vercel.app`
5. **Go back to Render** and update `CORS_ORIGIN` to `https://<vercel-app>.vercel.app`

## Step 3: Deploy Labs → Railway (4 services)

For each lab (level1–level4):

1. Go to https://railway.app → New Project → Empty Project
2. Add service → Docker Image → connect to repo
3. Set:
   - **Root Dir:** `labs`
   - **Dockerfile:** `Dockerfile`
   - **Build Args:**
     - `LAB=level1` (or level2, level3, level4)
     - `PORT=3001` (or 3002, 3003, 3004)
4. Set environment variables:
   ```
   INTERNAL_TOKEN=<same value as backend>
   JWT_SECRET=<keep the lab's intentional weak default>
   NODE_ENV=production
   ```
5. Deploy each. Note URLs: `https://<lab-N>.up.railway.app`

## Step 4: Final Backend Config

Go back to Render dashboard, add to backend env vars:
```
LAB_URL_1=https://<lab-1>.up.railway.app
LAB_URL_2=https://<lab-2>.up.railway.app
LAB_URL_3=https://<lab-3>.up.railway.app
LAB_URL_4=https://<lab-4>.up.railway.app
```

Trigger a redeploy.

## Step 5: Seed Production Database

Render shell or Render cron job:
```bash
npx prisma migrate deploy
npx tsx src/prisma/seed.ts
```

## Step 6: Smoke Test

- [ ] Frontend loads at Vercel URL
- [ ] Backend health check: `GET /api/health` returns 200
- [ ] Signup works
- [ ] Login works
- [ ] All 4 levels accessible
- [ ] Lab iframes load (cross-origin)
- [ ] Flag submission works
- [ ] Defensive reviews accessible after solving
- [ ] Report generation works
- [ ] PDF download works

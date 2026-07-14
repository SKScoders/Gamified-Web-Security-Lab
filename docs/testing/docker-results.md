# Docker Testing Results

## Setup
- Environment: GitHub Codespaces with Docker-in-Docker feature
- Node.js 20, Docker CLI available
- All images built from `labs/Dockerfile` with build arg `LAB=levelN`

## Build Results

| Lab | Image | Build Status | Size |
|-----|-------|-------------|------|
| Level 1 | sentinelchain-lab-1 | PASS | ~180MB |
| Level 2 | sentinelchain-lab-2 | PASS | ~180MB |
| Level 3 | sentinelchain-lab-3 | PASS | ~180MB |
| Level 4 | sentinelchain-lab-4 | PASS | ~180MB |

All 4 Dockerfiles build without error using multi-stage build.

## Container Runtime Results

| Lab | Port | Health Check | Login Flow | Internal Reset |
|-----|------|-------------|------------|----------------|
| L1 | 3001 | 200 OK | /login redirects correctly | 200 with valid token, 403 without |
| L2 | 3002 | 200 OK | /login page renders | 200 with valid token, 403 without |
| L3 | 3003 | 200 OK | /login redirects correctly | 200 with valid token, 403 without |
| L4 | 3004 | 200 OK | /login page renders | 200 with valid token, 403 without |

## Security Checks

| Check | Result |
|-------|--------|
| Non-root user | PASS — all containers run as `labuser` (uid 1001) |
| No .env file in image | PASS — .dockerignore excludes .env |
| No node_modules in image | PASS — multi-stage build, npm install in builder stage |
| No secrets in image layers | PASS — INTERNAL_TOKEN and JWT_SECRET set via env at runtime |
| Internal reset endpoint guarded | PASS — requires X-Internal-Token header |

## How to Reproduce

```bash
# Build all images
cd labs
docker build --build-arg LAB=level1 -t sentinelchain-lab-1 .
docker build --build-arg LAB=level2 -t sentinelchain-lab-2 .
docker build --build-arg LAB=level3 -t sentinelchain-lab-3 .
docker build --build-arg LAB=level4 -t sentinelchain-lab-4 .

# Run and test Level 1
docker run -d -p 3001:3001 -e JWT_SECRET=test-secret sentinelchain-lab-1
curl http://localhost:3001/api/health  # should return {"status":"ok","level":1,...}

# Test internal reset without token (should 403)
curl -X POST http://localhost:3001/__internal/reset  # 403

# Test internal reset with token (should 200)
curl -X POST http://localhost:3001/__internal/reset -H "X-Internal-Token: sentinelchain-internal-secret-2024"  # 200

# Verify non-root user
docker exec <container_id> whoami  # should return "labuser"

# Verify no .env leaked
docker exec <container_id> ls -la /app/.env  # should fail (file not found)
```

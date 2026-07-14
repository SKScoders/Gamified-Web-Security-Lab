# Lab Deployment Guide

## Overview

Each of the 4 vulnerable labs runs in its own Docker container with OS-level isolation. The platform backend communicates with each lab via server-to-server HTTP calls using a shared internal token.

| Lab | Port | Vulnerability | Container |
|-----|------|---------------|-----------|
| Level 1 — Employee Portal | 3001 | JWT Auth Bypass | lab-level1 |
| Level 2 — HR Portal | 3002 | SQL Injection | lab-level2 |
| Level 3 — File Manager | 3003 | Path Traversal | lab-level3 |
| Level 4 — Admin Panel | 3004 | Privilege Escalation | lab-level4 |

## Prerequisites

- Docker and Docker Compose installed
- The `INTERNAL_TOKEN` environment variable set (shared secret between backend and labs)

## Environment Variables

Copy `docker/.env.example` to `docker/.env` and fill in real values:

```bash
cp docker/.env.example docker/.env
```

| Variable | Description | Default (dev only) |
|----------|-------------|---------------------|
| `INTERNAL_TOKEN` | Shared secret for `/__internal/reset` endpoint | (none — must set) |
| `LAB_JWT_SECRET_1` | JWT signing secret for Level 1 | `solstice_jwt_secret_2024` |
| `LAB_JWT_SECRET_2` | JWT signing secret for Level 2 | `hr_portal_internal_2024` |
| `LAB_JWT_SECRET_3` | JWT signing secret for Level 3 | `file_server_token_2024` |
| `LAB_JWT_SECRET_4` | JWT signing secret for Level 4 | `sd_admin_panel_secret_2024` |

**Important:** The default JWT secrets are intentionally weak (they're part of the vulnerabilities). In production, set strong secrets via environment variables. The `INTERNAL_TOKEN` must be the same value set in the backend's `.env`.

## Deploy with Docker Compose

```bash
cd docker
docker compose up -d --build
```

This builds all 4 lab images and starts them in the background.

### Verify all labs are running

```bash
docker compose ps
curl http://localhost:3001/api/health
curl http://localhost:3002/api/health
curl http://localhost:3003/api/health
curl http://localhost:3004/api/health
```

Each should return `{"status":"ok","level":N,...}`.

### Test the reset endpoint

```bash
curl -X POST http://localhost:3001/__internal/reset \
  -H "X-Internal-Token: your-internal-token"
```

Should return `{"status":"ok","message":"Level 1 reset to initial state"}`.

Requests without the correct `X-Internal-Token` header return `403 Forbidden`.

## Deploy to Railway

Each lab can be deployed as a separate Railway service:

1. Create a new Railway service for each lab
2. Point it to the repo root with the Dockerfile path set to `labs/Dockerfile`
3. Set the build args: `LAB=level1`, `PORT=3001` (etc.)
4. Set environment variables in Railway's dashboard:
   - `PORT` — Railway will also set its own `PORT`; override with the lab's port
   - `JWT_SECRET` — per-lab signing secret
   - `INTERNAL_TOKEN` — shared internal secret
5. Expose the service on the correct port (3001-3004)

Repeat for all 4 labs.

## Deploy to Render

1. Create a new Render Web Service for each lab
2. Set the Dockerfile path to `labs/Dockerfile`
3. Set build args: `LAB=level1`, `PORT=3001`
4. Set environment variables:
   - `PORT=3001`
   - `JWT_SECRET=your-secret`
   - `INTERNAL_TOKEN=your-internal-token`
5. Create the service

Repeat for all 4 labs.

## Testing with GitHub Codespaces

Since Docker isn't available locally, use a free GitHub Codespace to verify Dockerfiles build correctly:

1. Push the branch to GitHub
2. Open a Codespace on that branch
3. Run:
   ```bash
   cd docker
   docker compose up -d --build
   docker compose ps
   ```
4. Verify all 4 labs respond on ports 3001-3004
5. Tear down: `docker compose down`

## Backend Integration

The platform backend (`backend/src/modules/labs/routes.ts`) exposes two endpoints:

- `GET /api/labs/:id/status` — checks if a lab is up
- `POST /api/labs/:id/reset` — calls the lab's internal reset endpoint

Both require normal platform authentication (logged-in user). The `INTERNAL_TOKEN` must match between the backend and all lab containers.

## Architecture Decision: Long-Running Containers

We use one long-running container per lab (not per-user ephemeral containers). True per-user containers require direct Docker daemon access that Railway/Render don't expose on standard tiers. "Reset" means clearing the lab's in-memory state back to its seed data, not destroying/recreating the container. This provides real OS-level isolation between the 4 labs and the platform while remaining deployable on standard PaaS tiers.

# Phase 7 — Dockerization
## Master Prompt for OpenCode
### Primary model: MiMo V2.5 (multi-file consistency) · Orchestration logic: Big Pickle · Iteration: DeepSeek V4 Flash

Scope: containerize the 4 vulnerable labs only. Backend deploys natively to
Render (no container needed), frontend to Vercel. Per your earlier decision,
none of this gets built or run locally — write everything here, then test
by deploying to Railway/Render (or GitHub Codespaces if you want to verify
a build before deploying).

---

## Master Prompt

```
You are running Phase 7 of SentinelChain: containerize the 4 vulnerable labs
so each runs in its own isolated Docker container, deployable to Railway or
Render. Do not attempt to build or run any Docker image locally — this
machine doesn't have Docker installed. Write everything to be tested via
deployment instead.

SCOPING DECISION — READ THIS FIRST
True per-user ephemeral containers (destroy and recreate a fresh container
per session) require direct Docker daemon access that Railway/Render don't
expose to application code on standard tiers. We are deliberately building
the simpler, still-legitimate version instead: one long-running container
per lab (real OS-level isolation between the 4 labs and the platform), where
"reset" means clearing that lab's own state back to its seeded data, not
destroying/recreating the container. Document this as an intentional scope
decision in docs/architecture/, not as a limitation to hide.

WORK IN THIS ORDER — confirm each step before the next

1. Write a Dockerfile for each of the 4 labs (labs/level1-auth-bypass/,
   level2-sql-injection/, level3-server-side/, level4-priv-escalation/):
   - Use node:20-alpine as the base image (small, minimal attack surface)
   - Multi-stage build: install deps and build in one stage, copy only
     the built output + production node_modules into a slim final stage
   - Run as a non-root user (create one explicitly, don't run as root —
     these are intentionally vulnerable apps, container-level isolation
     matters more here than almost anywhere else in the project)
   - EXPOSE the correct port for that lab (3001/3002/3003/3004)
   - Never bake secrets (JWT signing secrets, DB credentials) into the
     image itself — read them from environment variables at runtime only
   - Add a .dockerignore per lab excluding node_modules, .env, .git, and
     any local dev files

2. Add an internal-only reset endpoint to each lab: POST /__internal/reset
   that restores that lab's data (users, service accounts, whatever each
   lab seeds) back to its original seed state. This endpoint must reject
   any request not coming from the platform's own backend (check a shared
   internal secret header, e.g. X-Internal-Token, not exposed to end users
   or documented anywhere public-facing).

3. Create backend/src/modules/labs/routes.ts (referenced in the Phase 1
   folder structure but not yet built):
   - POST /api/labs/:id/reset — looks up which lab corresponds to :id,
     calls that lab's internal /__internal/reset endpoint server-to-server
     with the shared internal token, returns success/failure to the client
   - GET /api/labs/:id/status — pings that lab's existing health check (or
     add one if a lab doesn't have one) and returns up/down status
   - Both endpoints require normal platform authentication (a logged-in
     user), same as every other protected route

4. Write docker/docker-compose.yml defining all 4 lab services, their ports,
   and environment variables (referencing a .env.example, not real secrets).
   This won't be run locally right now, but it documents the intended
   multi-container setup and is what you'll deploy from.

5. Write a short deployment doc (docs/deployment/labs.md) covering:
   - How to deploy each lab container to Railway or Render
   - Which environment variables each lab needs set
   - How to verify a deployed lab is reachable and the reset endpoint works
   - A note that GitHub Codespaces can be used to test a Docker build before
     deploying, since Docker isn't available locally on this machine

CONSTRAINTS
- Don't change any of the labs' actual vulnerable logic in this phase —
  Phase 5's exploits must work identically inside containers as they did as
  plain processes.
- Don't expose the internal reset endpoint or its shared secret anywhere the
  frontend or a public API response could leak it.
- Stop after each step and confirm what you wrote before continuing —
  Dockerfiles especially are worth a careful read since a mistake here
  (e.g. accidentally running as root, or copying a .env file into the image)
  is a real security issue, not just a bug.

Start with step 1.
```

---

## Notes on running this in OpenCode

- **MiMo V2.5 for steps 1 and 4** — four near-identical Dockerfiles plus a compose file referencing all of them is exactly the wide, repetitive multi-file task MiMo is suited for.
- **Big Pickle for steps 2 and 3** — the internal reset endpoint and its auth (a shared secret between backend and labs that must never leak to the public) is a real security boundary, worth the more careful model.
- **DeepSeek V4 Flash for step 5** — writing docs is low-risk, fast-iteration work.
- **Testing without local Docker:** the cheapest way to verify a Dockerfile actually builds before pushing to Railway/Render is a free **GitHub Codespace** (Docker pre-installed, no cost to your laptop). Push the branch, open a Codespace on it, run `docker build` there once per lab, confirm no errors, then deploy for real. Costs you nothing locally and catches a broken Dockerfile before a failed deploy.

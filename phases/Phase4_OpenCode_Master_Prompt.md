# Phase 4 — Backend Development

## Master Prompt for OpenCode

### Primary model: Big Pickle · Bulk scaffolding: Hy3 · Multi-file wiring: MiMo V2.5 · Fast iteration: DeepSeek V4 Flash

Run this from the project root, with `backend/` already scaffolded per the
Phase 1 folder structure. Point OpenCode at the whole repo (not just
`backend/`) so it can read the frontend's `types/index.ts` and `lib/mock-data.ts`
from Phase 3 and match field names exactly.





Environment note before you start Phase 4:



\- Do NOT attempt to install, start, or reference Docker or a local

&#x20; PostgreSQL instance anywhere in this phase. There is no local database.

\- backend/.env already contains a DATABASE\_URL pointing to a hosted Neon

&#x20; Postgres instance. Use it as-is for the Prisma migration in step 2.

\- If DATABASE\_URL is missing or the migration fails to connect, stop and

&#x20; tell me rather than trying to provision a local database or container as

&#x20; a workaround.

\- Containerization (Docker) is intentionally deferred to Phase 7 and is out

&#x20; of scope for this phase entirely. Do not write any Dockerfiles, docker-

&#x20; compose files, or container-related code in Phase 4 — pure Node/Express/

&#x20; Prisma only, running as a normal local process.

\---



## Master Prompt

```
You are working on SentinelChain, a gamified web security training platform.
Phases 1–3 are complete: the database schema, API contract, and folder
structure are frozen (see docs/architecture/ and docs/api-spec.yaml), and the
frontend is fully wired to typed mock data matching that schema exactly.
Your job is Phase 4: build the real backend so the frontend can swap mock
data for live API calls without renaming a single field.

CONTEXT — READ BEFORE WRITING ANY CODE
- Read frontend/types/index.ts and frontend/lib/mock-data.ts first. Every
  Prisma model and every API response shape must match those types exactly —
  same field names, same casing, same nesting. Do not "improve" the naming.
- Read docs/api-spec.yaml (or the API list from Phase 1) and implement every
  endpoint listed there, at the exact path and method given. Do not invent
  alternate routes.
- Stack: Node.js, Express, PostgreSQL, Prisma ORM, TypeScript, JWT for auth
  (access + refresh tokens), bcrypt for password hashing. No new dependencies
  beyond what's needed for this stack unless you ask me first.

NON-NEGOTIABLE SECURITY RULE
Never trust the client for anything that affects game state or scoring.
Specifically:
- Level unlock state, level completion, and score must be computed and
  stored server-side only. The frontend may show optimistic UI, but the
  server is the source of truth on every request.
- A level's "expected exploit signature" must never be sent to the client in
  any response, at any point, including in dev tools/network tab. It's only
  ever compared server-side.
- Stage tokens (the signed artifact that unlocks the next level) must be
  verified cryptographically on every level-start request — reject with 403
  if missing, expired, or invalid. Don't just check a boolean "unlocked" flag
  in the database without also checking the signed token, since that
  reintroduces exactly the bypass Phase 1 flagged as a gap.

WORK IN THIS ORDER — confirm each step compiles and passes a manual test
before moving to the next
1. Set up the Express + TypeScript project skeleton under backend/src/,
   matching the modules/ folder structure from Phase 1 (auth, dashboard,
   levels, hints, labs, reports, audit). Add a health-check endpoint.
2. Write prisma/schema.prisma to match the Phase 1 database schema exactly
   (Users, Sessions, Levels, Progress, StageTokens, Hints, HintUsage,
   LabInstances, AuditLog, Reports). Run the initial migration against a
   local Postgres instance.
3. Auth module: POST /api/auth/register, /login, /refresh, /logout. Hash
   passwords with bcrypt. Access tokens short-lived (15 min), refresh tokens
   longer-lived and stored hashed in the Sessions table, rotated on refresh.
4. Audit ledger module first, before anything else depends on it: an
   append-only AuditLog writer where each entry's hash = SHA256(prev\_hash +
   canonical JSON of the entry payload). Expose it as an internal function
   other modules call (logEvent(userId, eventType, payload)), not just an API
   route — every module below must call this on every state-changing action.
5. Levels/progress module:
   - GET /api/levels — list with computed lock/active/complete state per
     user, driven by Progress + StageTokens, never a static flag.
   - POST /api/levels/:id/start — verify the previous level's stage token if
     this isn't level 1, log the event, create/return a Progress row.
   - POST /api/levels/:id/submit — accept a proof string, compare
     server-side against that level's stored expected signature (never
     returned to client), log the attempt (success or fail) to the audit
     ledger either way.
   - POST /api/levels/:id/complete — mint a signed stage token
     (JWT signed with a server secret, containing user\_id, level\_id,
     exploit\_signature\_hash, issued\_at, short expiry), persist it, log the
     event, update Progress.status.
6. Hints module: GET /api/levels/:id/hints (returns hint text only for
   already-revealed hints, otherwise just id/order/penalty), POST
   /api/levels/:id/hints/:hintId/reveal (applies -5/-10/-20 penalty for
   hint 1/2/3 respectively, logs to audit ledger, returns the revealed
   content).
7. Leaderboard: GET /api/leaderboard, aggregating Progress across users,
   sorted by score, with a query param for weekly vs all-time (filter by
   completed\_at).
8. Reports module: POST /api/reports/generate assembles CVSS/OWASP/MITRE
   fields (already present on the Levels table) plus per-user attempt/time/
   hint data from Progress and AuditLog into a summary\_json, stores a Reports
   row. Actual PDF rendering is Phase 8's job — this step only needs to
   produce the structured data the PDF generator will consume later.
9. Wire CORS, rate limiting on auth and hint-reveal endpoints, and basic
   input validation (zod or similar) on every route.
10. Replace the frontend's lib/mock-data.ts calls with real fetch calls to
    these endpoints, one page at a time, starting with Login and Dashboard.
    Confirm each page still renders correctly against live data before
    moving to the next.

CONSTRAINTS
- After each numbered step, stop and summarize which files you touched and
  what you verified (migration ran, endpoint returns expected shape, etc.)
  before continuing — don't run all 10 steps unattended.
- Don't touch anything in components/ui/ or components/layouts/ — this
  phase is backend + wiring only, not a redesign.
- If a step requires a decision I haven't specified (e.g. exact JWT expiry
  length, rate limit thresholds), pick a reasonable default, state what you
  chose and why, and move on rather than stopping to ask.

Start with step 1.
```

\---

## Notes on running this in OpenCode

* **Step 4 (audit ledger) is placed early on purpose** — steps 5–8 all call into it, so building it after the fact means going back to retrofit every module. If OpenCode tries to skip ahead to auth/levels first, redirect it back to the ledger.
* Switch to **Hy3** specifically for step 2 (the full Prisma schema) — schemas are exactly the kind of single large, structurally rigid file that benefits from a bigger output ceiling.
* Switch to **MiMo V2.5** for step 4, since threading `logEvent()` calls through every other module in steps 5–8 is a wide multi-file change more than a deep-reasoning one.
* Keep **Big Pickle** for steps 3, 5, and 6 specifically — auth, stage-token signing/verification, and the hint-penalty logic are the places where a subtle bug becomes a security or scoring bypass, not just a visual glitch.
* Save **DeepSeek V4 Flash** for step 9 onward (CORS, rate limiting, validation, and wiring the frontend) — mechanical, fast-iteration work.


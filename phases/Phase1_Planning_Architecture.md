# Phase 1 — Planning & Architecture
## PS 5.2 Gamified Web Security Lab
### Codename: **SentinelChain**

This document is the complete Phase 1 deliverable set: finalized features, system architecture, database schema, API list, and folder structure — designed to close the gap identified in the PS 5.2 gap analysis (server-side rigor, Docker isolation, hints, timing, and the CVSS/OWASP/MITRE report layer) while keeping the dashboard → playground → level shell that already scores well on realism.

---

## 1. Finalized Feature Set

| Module | Included in v1 |
|---|---|
| Auth (JWT + refresh tokens) | Yes |
| Dashboard (progress, leaderboard, certificates) | Yes |
| Playground with 4 sequentially-gated levels | Yes |
| Server-enforced stage gates | Yes |
| Hint system (3 hints/stage, score penalty) | Yes |
| Timer / attempt tracking | Yes |
| Dockerized lab per level, isolated per session | Yes |
| Automated pentest report (CVSS, OWASP, MITRE) | Yes |
| Defensive Code Review Mode | Yes |
| Leaderboard | Yes |

---

## 2. Unique & Powerful Design Concepts

These are the differentiators that turn a standard CTF clone into a defensible, judge-ready architecture.

**1. Zero-trust stage gate engine.** Level progression is modeled as a signed finite-state machine, not a boolean flag. Completing a level mints a short-lived, cryptographically signed "stage artifact" (a JWT-like token containing `user_id`, `level_id`, `exploit_signature_hash`, `issued_at`). The next level's container refuses to boot for that session unless it receives a valid, unexpired artifact — so skipping a level by editing local storage or replaying a request is cryptographically impossible, not just UI-hidden.

**2. Hash-chained audit ledger.** Every exploit attempt, hint request, and stage transition is appended to an immutable, hash-chained log (`entry.hash = SHA256(prev_hash + entry_payload)`), similar in spirit to a private blockchain. This gives three things for free: tamper-evident anti-cheat, a ready-made timeline for the final report, and a forensic trail that doubles as a teaching artifact ("here is exactly how you got in").

**3. Ephemeral, per-session lab containers.** Each of the four vulnerable apps runs in its own Docker container, spun up on-demand per user session via an orchestration service, and destroyed/reset on level exit or timeout. No shared state between players, no manual resets, and a clean "isolated environment" story for judges.

**4. Adaptive hint engine with decaying value.** Hints are not static text — they are generated/selected based on how long the user has been stuck and how many failed attempts they've logged, with an escalating score penalty (e.g. -5 / -10 / -20). This rewards genuine skill over guesswork without punishing normal exploration.

**5. Auto-mapping report engine.** Each exploit signature captured in the audit ledger maps deterministically (via a rules table, not manual entry) to a CVSS vector, OWASP Top-10 category, and MITRE ATT&CK technique ID. The report generator assembles these into a PDF automatically at level completion — no manual write-up required to demo the feature.

**6. Defense mirror mode.** After a level is cleared, the platform reveals a diff view: the vulnerable source on the left, a patched/secure version on the right, with inline annotations explaining *why* each change closes the exploit. This is generated once per level (static content authored ahead of time) rather than live, keeping it fast and reliable for a demo.

---

## 3. System Architecture

The layered architecture is shown above: **client → API gateway → application services → lab orchestration → data layer**, with the vulnerable lab pool sitting alongside orchestration as isolated, disposable containers. The application layer is deliberately split into four independent services (stage gate engine, hint/scoring, report engine, audit ledger, defense mirror) so any one of them can fail or be rebuilt during the hackathon without taking down the rest of the platform — useful when multiple team members are working in parallel under time pressure.

---

## 4. Database Schema

```
erDiagram
  USERS ||--o{ SESSIONS : has
  USERS ||--o{ PROGRESS : tracks
  USERS ||--o{ HINT_USAGE : requests
  USERS ||--o{ AUDIT_LOG : generates
  USERS ||--o{ REPORTS : owns
  LEVELS ||--o{ PROGRESS : "is target of"
  LEVELS ||--o{ HINTS : has
  LEVELS ||--o{ LAB_INSTANCES : spawns
  PROGRESS ||--o{ STAGE_TOKENS : mints
  HINTS ||--o{ HINT_USAGE : "is used in"

  USERS {
    uuid id PK
    string email
    string password_hash
    string display_name
    timestamp created_at
  }
  SESSIONS {
    uuid id PK
    uuid user_id FK
    string refresh_token_hash
    timestamp expires_at
  }
  LEVELS {
    uuid id PK
    int order_index
    string title
    string vuln_category
    string owasp_category
    string mitre_technique_id
    string cvss_base_vector
  }
  PROGRESS {
    uuid id PK
    uuid user_id FK
    uuid level_id FK
    string status
    int attempts
    int score
    timestamp started_at
    timestamp completed_at
  }
  STAGE_TOKENS {
    uuid id PK
    uuid progress_id FK
    string signed_token
    string exploit_signature_hash
    timestamp issued_at
    timestamp expires_at
  }
  HINTS {
    uuid id PK
    uuid level_id FK
    int hint_order
    string content
    int score_penalty
  }
  HINT_USAGE {
    uuid id PK
    uuid user_id FK
    uuid hint_id FK
    timestamp requested_at
  }
  LAB_INSTANCES {
    uuid id PK
    uuid level_id FK
    uuid session_id FK
    string container_id
    string status
    timestamp started_at
    timestamp expires_at
  }
  AUDIT_LOG {
    uuid id PK
    uuid user_id FK
    string event_type
    string payload_json
    string prev_hash
    string entry_hash
    timestamp created_at
  }
  REPORTS {
    uuid id PK
    uuid user_id FK
    string pdf_url
    string summary_json
    timestamp generated_at
  }
```

---

## 5. API List

### Auth
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Issue access + refresh tokens |
| POST | `/api/auth/refresh` | Rotate access token |
| POST | `/api/auth/logout` | Revoke session |

### Dashboard
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/dashboard/summary` | Progress, score, rank overview |
| GET | `/api/leaderboard` | Ranked list of users |
| GET | `/api/certificates/:userId` | Completion certificate |

### Playground / Levels
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/levels` | List levels + lock/unlock state |
| POST | `/api/levels/:id/start` | Provision Docker instance, start timer |
| POST | `/api/levels/:id/submit` | Submit exploit proof, validate server-side |
| POST | `/api/levels/:id/complete` | Mint signed stage token, unlock next level |

### Hints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/levels/:id/hints` | List available (locked) hints |
| POST | `/api/levels/:id/hints/:hintId/reveal` | Reveal hint, apply penalty |

### Lab Orchestration
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/labs/:id/reset` | Destroy and respawn container |
| GET | `/api/labs/:id/status` | Container health / expiry |

### Reports
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/reports/generate` | Compile CVSS/OWASP/MITRE report as PDF |
| GET | `/api/reports/:id` | Fetch generated report |

### Defensive Code Review
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/levels/:id/defense-mirror` | Vulnerable vs patched code + explanation |

### Audit
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/audit/:userId` | Hash-chained event timeline (admin/report use) |

---

## 6. Folder Structure

```
sentinelchain/
├── frontend/                     # Next.js + Tailwind + shadcn/ui
│   ├── app/
│   │   ├── (auth)/
│   │   ├── dashboard/
│   │   ├── playground/
│   │   ├── report/
│   │   └── layout.tsx
│   ├── components/
│   └── lib/
│
├── backend/                      # Node.js + Express + Prisma
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── levels/
│   │   │   ├── hints/
│   │   │   ├── labs/              # orchestration client
│   │   │   ├── reports/
│   │   │   └── audit/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── server.ts
│   └── package.json
│
├── labs/                          # 4 vulnerable applications, one per level
│   ├── level1-auth-bypass/
│   ├── level2-sql-injection/
│   ├── level3-server-side/
│   └── level4-priv-escalation/
│
├── docker/
│   ├── docker-compose.yml
│   ├── orchestrator/              # spins up/tears down per-session lab containers
│   └── nginx/                     # per-lab isolated routing
│
├── docs/
│   ├── architecture/
│   ├── api-spec.yaml
│   └── db-schema.md
│
└── README.md
```

---

## Suggested Phase 1 Wrap-up Checklist

- [ ] Confirm 4 vulnerability categories and their OWASP/MITRE/CVSS mappings
- [ ] Freeze database schema and generate Prisma migration
- [ ] Freeze API contract (this list) and share across frontend/backend/labs teams
- [ ] Confirm Docker orchestration approach (native `docker` SDK vs `docker-compose` per session)
- [ ] Lock folder structure so Phase 3/4 teams can start in parallel

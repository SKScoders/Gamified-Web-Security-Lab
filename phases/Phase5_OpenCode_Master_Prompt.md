# Phase 5 — Vulnerable Lab Development (Most Important)
## Master Prompt for OpenCode
### Primary model: Big Pickle · Bulk scaffolding: Hy3 · Multi-app coordination: MiMo V2.5

This is the phase judges will actually play. Run this after Phase 4 is
verified working end-to-end. No Docker yet (per your earlier decision —
that's Phase 7); each lab runs as its own plain Node/Express process.

---

## Master Prompt

```
You are building Phase 5 of SentinelChain: four standalone, intentionally
vulnerable web applications that form a single narrative chain. This is the
centerpiece of the whole platform — it needs to feel like a real company's
internal systems, not a generic "vulnerable-app-1, vulnerable-app-2" demo.

FICTIONAL COMPANY / NARRATIVE
All four apps belong to one fictional mid-size company: "Solstice Dynamics"
(a fake logistics/software company). Give it a consistent visual identity
across all four apps — logo initials "SD", a plausible internal domain like
"solsticedynamics.internal", consistent header/footer branding — so exploiting
level 2 and finding a reference to "the file server" in level 3 feels like
discovering a real company's internal sprawl, not four disconnected demos.

Populate with realistic fake data: employee names, departments (Engineering,
Finance, HR, Ops), fake email addresses (@solsticedynamics.internal), a
handful of fake internal documents/announcements, and a plausible org chart.
Nothing here should look like Lorem Ipsum or "test test test" placeholder
data — that's what makes it forgettable rather than attractive.

CORE RULE — NO ACCIDENTAL VULNERABILITIES
Each app has exactly ONE deliberate, documented vulnerability. Before writing
each app, list out every place user input reaches a database query, file
path, or trust decision, and verify none of them are exploitable except the
one intended flaw. Don't use string concatenation for SQL anywhere except
the one deliberately vulnerable query in Level 2 — every other query in every
other app must use parameterized queries. Don't leave debug endpoints, admin
backdoors, or commented-out auth checks anywhere. The intended vuln should be
findable through realistic reconnaissance (viewing page source, trying
common inputs, reading response headers) — not something that requires
guessing an unrelated, unintended bug.

Each lab must run standalone on its own port (3001–3004), as a plain
Express/Node process — no Docker, no docker-compose, nothing container-
related in this phase.

Each lab produces a FLAG string on successful exploitation, in the format
SDX{level_name-random_suffix}, e.g. SDX{auth_bypass-7f3a9c}. This flag is
what the platform's real backend POST /api/levels/:id/submit endpoint
compares against — coordinate the exact flag value with the seed data
already in backend/src/prisma/seed.ts (Level.expectedFlag) so submission
actually works end-to-end. Do not hardcode a different flag in the lab than
what's seeded in the platform database — read the seed file first.

BUILD ORDER — one level at a time, confirm each works before the next

LEVEL 1 — "Employee Portal" (Authentication Bypass) — port 3001
- A login page for Solstice Dynamics employees, styled to look like a real
  internal tool (not flashy — slightly dated corporate SSO aesthetic).
- Auth uses JWTs, but signed with a weak, guessable secret (something a
  real junior dev might actually pick, e.g. based on the company name —
  don't make it comically obvious like "password123", make it findable via
  realistic recon: exposed in a JS source map comment, a leftover debug
  console.log shipped to the client, or a .git folder accidentally exposed
  at /.git/config referencing it).
- Goal: forge a JWT claiming a higher-privilege role to access a "Directory"
  page that reveals the HR portal's internal URL and a low-privilege HR
  service account credential. That credential text doubles as the flag.
- No other vulnerability anywhere in this app — standard bcrypt-hashed
  passwords, parameterized queries, proper session handling everywhere
  except the one JWT secret weakness.

LEVEL 2 — "HR Portal" (SQL Injection) — port 3002
- Internal HR system, login with the credential recovered from Level 1.
- An employee search feature builds its SQL query via string concatenation
  (the one deliberate flaw), vulnerable to UNION-based injection.
- Goal: use the injection to dump a hidden "service_accounts" table
  containing a token for the internal file server (Level 3's address).
  That token is the flag for this level.
- Every other query in this app (login, viewing employee records normally)
  must use parameterized queries — the search feature is the only exception.

LEVEL 3 — "File Manager" (Server-Side Vulnerability — Path Traversal / LFI)
— port 3003
- Internal file browser for shared documents, authenticated with the token
  from Level 2.
- A file download/preview endpoint takes a filename parameter and reads it
  from disk without sanitizing path traversal sequences (../).
- Goal: traverse outside the intended shared-docs directory to read a
  config file containing an admin panel session token or private key. That
  value is the flag.
- Every other file operation in the app (listing files, normal downloads
  within the intended directory) must be properly sandboxed — only the one
  download endpoint has the traversal flaw.

LEVEL 4 — "Admin Panel" (Privilege Escalation / Data Exfiltration) — port 3004
- Admin dashboard, authenticated with the token from Level 3.
- The vulnerability: the app trusts a client-controllable field (e.g. a
  "role" value in the user's own profile-update request, or a JWT claim it
  never re-verifies server-side after initial issuance) to determine admin
  access, rather than checking the authoritative role stored server-side.
- Goal: escalate from a standard authenticated session to admin, and access
  a "data export" feature revealing a final flag representing exfiltrated
  sensitive data (e.g. a fake customer database dump).
- Every other access-control check in the app must be done correctly
  server-side — only the one privilege check trusts client input.

AFTER ALL FOUR LABS WORK STANDALONE
Confirm each lab's flag format and value matches backend/src/prisma/seed.ts
exactly. If they don't match, fix the seed file (not the labs) to keep the
flags realistic and embedded in the narrative rather than generic strings.

CONSTRAINTS
- Stop and show me each level working (screenshot description or curl/
  browser walkthrough of the exploit) before starting the next level.
- Do not add authentication complexity beyond what's described — keep each
  app's *unrelated* surfaces simple so the intended vulnerability is the
  clear, findable focus, not buried under incidental complexity.
- Reuse a shared minimal styling approach across all four apps (same base
  CSS, same "Solstice Dynamics" header) so they read as one company's
  software, not four different demo templates.

Start with Level 1.
```

---

## Notes on running this in OpenCode

- **Use Big Pickle for all four levels, not just some.** Unlike Phases 3–4, this isn't really a "swap models mid-task" situation — writing a vulnerability that's exploitable in exactly the intended way, and *only* that way, is a reasoning-heavy task every single time. A model that's fast but less careful here is how "no accidental vulnerabilities" quietly fails.
- Switch to **Hy3** only if a single level's generation gets cut off mid-file due to length (the file manager or admin panel apps, with more surrounding realistic content, are the most likely candidates).
- Use **MiMo V2.5** if you ask OpenCode to do a pass across all four apps at once to unify the shared styling/header — that's a wide multi-file consistency task, not a deep reasoning one.
- **Test the exploit yourself, level by level, before trusting the walkthrough.** Since these apps' whole purpose is being exploitable, "it compiles and the page loads" tells you nothing — actually forge the JWT, actually run the injection, actually traverse the path, actually escalate the role, before considering a level done.

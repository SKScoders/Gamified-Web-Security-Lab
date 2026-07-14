# Phase 10 — Testing
## Master Prompt for OpenCode
### Primary model: Big Pickle (security regression) · Collection/script writing: MiMo V2.5 · Iteration: DeepSeek V4 Flash

You've been testing continuously throughout the build rather than saving it
all for the end — this phase isn't starting from zero. It's about (1)
turning the ad-hoc curl/browser checks from Phases 4, 6, 8, and 9 into a
repeatable test suite anyone (including a judge) can rerun, and (2) actually
testing the one thing that's never been tested for real: the Phase 7
Dockerfiles, which have never touched a real Docker daemon.

---

## Master Prompt

```
You are running Phase 10 of SentinelChain: formalize testing across API,
UI, security, and Docker. Much of this has been manually verified already —
your job is to turn that into a repeatable suite, and to close the one real
gap: Docker builds have never actually been tested.

1. API TESTING — Bruno collection
Create a Bruno collection (docs/testing/sentinelchain.bru or the appropriate
Bruno project structure) covering every endpoint in the Phase 1 API list:
auth (register/login/refresh/logout/me), dashboard summary, levels
(list/start/submit/complete), hints (list/reveal), leaderboard, labs
(reset/status), reports (generate/fetch/download), audit, and the defense-
mirror endpoint. For each endpoint include both a valid-request case and at
least one negative case already known from earlier phases — e.g. level skip
attempt, expired/malformed JWT, report ownership violation, defense-mirror
before completion, report generation before all reviews viewed. This
collection should be runnable end-to-end against a fresh seeded database
and pass entirely on a working build. Store it in the repo so it's a real,
reusable artifact — not a one-off.

2. UI TESTING — cross-browser and responsive pass
Manually verify (list findings, don't just assume) each of the 8 pages in
both Chrome and Firefox specifically — Firefox surfaced the CORS issue
earlier that Chrome may not have caught the same way, so both matter, not
just one. For each page, check:
- Browser console is clean (no errors, no unhandled promise rejections)
- The page is usable at tablet width (per the Phase 3 constraint that grids
  collapse to single column, nothing overflows)
- Every interactive element (buttons, form fields, tabs) has a visible
  keyboard focus state — tab through each page without a mouse and confirm
  you can reach and activate everything
Report findings as a simple table: page x browser x pass/fail, with notes
on anything that failed.

3. SECURITY TESTING — formalize the Phase 6/8/9 checks into one script
Write a single script (backend/scripts/security-check.js or similar) that
runs all of these against a running instance and reports pass/fail for
each, rather than requiring manual curl commands every time:
- Level skip via direct API call (Phase 6 scenario 1)
- Stage token tampering and replay (Phase 6 scenarios 2-3)
- Score manipulation attempt (Phase 6 scenario 5)
- Report ownership violation — fetch another user's report ID (Phase 8)
- Defense-mirror access before level completion (Phase 9)
- Report generation attempt before all reviews viewed (Phase 9)
- Rate limit trigger on auth endpoint (Phase 6 scenario 10)
Also add one new check: confirm NODE_ENV=production suppresses stack
traces and internal error details in API error responses — a production
error response should never leak file paths, SQL, or stack traces to the
client, only a safe generic message.

4. DOCKER TESTING — the real gap
The 4 Dockerfiles from Phase 7 have never been built or run, since this
machine has no local Docker. Set up a GitHub Codespaces devcontainer config
(or equivalent) so each Dockerfile can actually be built and run once,
in the cloud, to confirm:
- Each image builds without error
- Each container starts and responds correctly on its expected port
  (same behavior as the plain-process version — same redirects, same
  health check response)
- The internal /__internal/reset endpoint works when called with the
  correct shared secret header, and is rejected without it
- No image accidentally contains a .env file, secrets, or is running as
  root (verify with `docker inspect` or `whoami` inside the running
  container)
Document the steps taken and the results in docs/testing/docker-results.md,
since I don't have local Docker to reproduce this myself easily.

After all four sections, produce a single docs/testing/Phase10_Test_Report.md
summarizing pass/fail across all four categories, and flag anything that
failed as needing a fix before Phase 11 deployment.
```

---

## Notes on running this in OpenCode

- **Big Pickle for section 3** (security script) — this is directly re-verifying the access-control work from Phases 6, 8, and 9; worth the careful model since a bug in the *test* itself (a check that always passes regardless of the real behavior) would be worse than not testing at all.
- **MiMo V2.5 for sections 1 and 2** — writing a broad, repetitive Bruno collection across ~15 endpoints, and a systematic page-by-page UI pass, are both wide-but-shallow tasks.
- **Big Pickle again for section 4** — Docker security details (non-root user, no leaked secrets) matter and are worth the more careful model, even though the mechanical "does it build" part is simple.
- This is a good phase to actually read the final `Phase10_Test_Report.md` yourself in full before moving to deployment — it's the closest thing you'll have to a judge's-eye view of whether the platform is actually solid, versus "compiles clean" which you've been treating (correctly) as necessary but not sufficient this whole build.

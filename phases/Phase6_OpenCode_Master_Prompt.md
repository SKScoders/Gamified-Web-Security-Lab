# Phase 6 — Security Engine
## Master Prompt for OpenCode
### Primary model: Big Pickle (this entire phase is reasoning-heavy — don't switch models mid-phase)

Most of what Phase 6 originally called for — server-side validation, stage
gates, token verification, secure progress storage — was already built in
Phase 4. This phase is a **verification and hardening pass**: actively try
to break your own game logic the way a dishonest player would, and fix
whatever actually breaks.

---

## Master Prompt

```
You are running Phase 6 of SentinelChain: a security verification pass on
the platform's own game logic (not the vulnerable labs — this is about
whether the PLATFORM itself can be cheated).

Read backend/src/modules/levels/routes.ts, backend/src/middleware/auth.ts,
and backend/src/modules/audit/service.ts first, since Phase 4 already
implemented stage tokens, JWT auth, and the audit ledger — this phase is
about proving those actually hold up, not rebuilding them.

RUN EACH OF THESE ATTACK SCENARIOS AGAINST YOUR OWN BACKEND. For each one,
state whether it currently succeeds (bad) or fails correctly (good), and if
it succeeds, fix it before moving to the next scenario.

1. LEVEL SKIP VIA DIRECT API CALL
   Without ever completing Level 1, call POST /api/levels/3/start directly
   (e.g. with curl/Postman, bypassing the UI entirely). This must fail with
   403 — verify the check isn't just "is there a Progress row" but actually
   validates a real signed stage token from the previous level.

2. STAGE TOKEN TAMPERING
   Take a legitimately issued stage token, modify one character of the
   payload or signature, and attempt to use it to start the next level.
   Must be rejected — verify the JWT signature check actually runs and
   isn't accidentally skipped anywhere.

3. STAGE TOKEN REPLAY
   Use the same valid stage token twice — once to legitimately unlock a
   level, then again later (e.g. after that level is already complete, or
   in a different session). Decide and enforce: should stage tokens be
   single-use? If so, verify a used token can't be replayed. If they're
   time-limited instead, verify expired tokens are actually rejected, not
   just checked and ignored.

4. FLAG SUBMISSION WITHOUT STARTING
   Call POST /api/levels/:id/submit for a level that was never started
   (no Progress row exists yet). Must fail cleanly, not throw an unhandled
   500 or silently create a false "completed" state.

5. SCORE MANIPULATION VIA CLIENT
   Check every endpoint that touches Progress.score — confirm none of them
   accept a score or points value directly from the request body. Score
   must only ever be computed server-side from stage completion + hint
   penalties, never trusted from the client.

6. EXPIRED / MISSING JWT ON PROTECTED ROUTES
   Call any protected endpoint with an expired access token, then with no
   token at all, then with a malformed token. All three must return 401,
   not 500, and must not leak whether a user ID or resource exists.

7. HINT REVEAL REPLAY / DOUBLE-PENALTY
   Reveal the same hint twice via direct API calls. Confirm the score
   penalty is only applied once (the second reveal should just return the
   already-revealed content, not double the deduction) — check
   HintUsage for a uniqueness constraint per (user, hint).

8. AUDIT LEDGER INTEGRITY CHECK
   Write a verification script (can be a one-off script, not necessarily a
   permanent endpoint) that walks the AuditLog table in order and recomputes
   each entry's hash from its payload + the previous entry's hash, confirming
   it matches the stored hash. This proves the hash chain is actually being
   computed correctly, not just present as unused columns.

9. SESSION / REFRESH TOKEN HANDLING
   Confirm: refresh tokens are stored hashed (never plaintext) in Sessions,
   a used-and-rotated refresh token can't be reused (old one invalidated on
   rotation), and logout actually invalidates the session server-side rather
   than just clearing client-side storage.

10. RATE LIMIT VERIFICATION
    Confirm the Step 9 rate limiters from Phase 4 actually trigger — send
    15+ rapid requests to a rate-limited endpoint and confirm a 429 shows up,
    not just that the limiter code exists but never fires due to a
    misconfigured window/key.

After all 10, produce a short summary: which scenarios failed correctly on
the first try (already secure), which required a fix, and what the fix was.

CONSTRAINTS
- Do not weaken any existing check to make a test "pass easier" — if a
  scenario currently succeeds when it shouldn't, the fix is to close the
  gap, never to loosen the test.
- Don't touch the vulnerable labs (ports 3001-3004) at all in this phase —
  those are supposed to be exploitable, this phase is only about the
  platform's own game logic.
```

---

## Notes on running this in OpenCode

- **Stay on Big Pickle for all 10 scenarios.** This phase is unusual in that every single scenario is a "does the security logic actually hold" question — there's no mechanical/low-risk sub-task to hand off to a faster model this time.
- **Scenario 3 (replay) requires you to make an actual design decision** — single-use vs. time-limited stage tokens — that Phase 1 didn't fully pin down. Either is defensible; just make sure OpenCode picks one and enforces it consistently rather than leaving it ambiguous.
- If scenario 1 or 2 actually succeeds (i.e., you find you *can* skip a level or forge a token against your own platform), that's worth treating as the most important bug in the whole project so far — it directly undermines the "sequential stage gates" claim that scored 10/10 in your original Phase 1 gap analysis.

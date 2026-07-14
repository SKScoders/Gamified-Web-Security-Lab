# Phase 9 — Defensive Code Review Mode
## Master Prompt for OpenCode
### Primary model: Big Pickle (access gating) · Bulk content: Hy3 · Frontend wiring: MiMo V2.5

The diff-view UI itself was already built in Phase 3 (side-by-side/unified
toggle, pre-annotated line data, no external syntax-highlighting library) and
wired to mock data. This phase replaces the mock data with real content
pulled from the actual lab source code, gated so it only unlocks after a
user genuinely completes that level.

---

## Master Prompt

```
You are running Phase 9 of SentinelChain: real content and real access
control for the Defensive Code Review page, which currently shows mock data.

READ FIRST
- Read components/dashboard/code-comparison.tsx (built in Phase 3) — confirm
  it still uses only a regex-based tokenizer for syntax highlighting, no
  highlight.js or similar library. If one snuck in since Phase 3, remove it.
- Read app/(dashboard)/level/[id]/review/page.tsx to see the current mock
  data shape it expects.
- Read the actual source files for each lab (labs/level1-auth-bypass/,
  level2-sql-injection/, level3-server-side/, level4-priv-escalation/) —
  the vulnerable code shown in this feature must be the REAL vulnerable
  code from the labs, not fabricated examples. Find the specific lines
  containing each level's deliberate flaw.
- Read the remediation text already written in Phase 8 (Level.remediation
  column) — reuse it as the source for this feature's "best practices"
  summary rather than writing separate, possibly inconsistent guidance.

SECURITY REQUIREMENT — THIS IS THE MAIN POINT OF THIS PHASE
The defensive code review for a level must only be viewable by a user after
they have actually completed that specific level (Progress.status ===
"complete" for that user + level). This must be enforced server-side on the
API endpoint itself, not just hidden in the UI — a direct API call before
completion must be rejected. This is the same category of bug Phase 6 found
and fixed elsewhere (never trust the client, never assume UI hiding is
access control) — apply that lesson here from the start rather than fixing
it in a second pass.

BUILD ORDER

1. Add a way to store defensive-review content per level: either a JSON
   column on the Levels table, or a new DefensiveReview table linked to
   Level by level_id — your call, but keep the shape matching what
   code-comparison.tsx already expects: an array of lines per side
   ({ line, content, type: "unchanged"|"added"|"removed", note? }).
   Migrate and seed real content for all 4 levels.

2. For each level, write:
   - The actual vulnerable code (pulled from the real lab source, trimmed
     to the relevant function/section, not the entire file)
   - A patched version of that same section fixing the specific flaw
   - Inline notes on the changed lines explaining why the change closes the
     exploit (2-3 sentences max per note, plain language)
   - A short "best practices" summary reusing/lightly adapting the Phase 8
     remediation text for that level

3. Add GET /api/levels/:id/defense-mirror:
   - Requires authentication (existing JWT middleware)
   - Checks Progress for (req.user.id, levelId) — if status isn't
     "complete", return 403, not partial content and not a 404 that could
     leak whether the level exists
   - Returns the vulnerable/patched line data + best-practices summary for
     that level

4. Update app/(dashboard)/level/[id]/review/page.tsx to fetch from this
   endpoint instead of mock data. If a user somehow lands on this page
   without having completed the level (e.g. direct URL navigation), show a
   clear "Complete this level first" state — don't let the page crash on a
   403 or silently show nothing.

5. DECISION: the Final Report requires all 4 levels complete AND all 4
   defensive code reviews viewed — these are linked, not independent. Add
   tracking for "viewed": the simplest approach is to record a
   ReviewViewed row (user_id, level_id, viewed_at) the first time a user's
   GET /api/levels/:id/defense-mirror request succeeds (i.e. successfully
   viewing it, which already implies the level was completed, counts as
   having viewed it — no separate "mark as read" click needed).

6. Update the report-generation logic (wherever POST /api/reports/generate
   currently checks "all 4 levels complete") to also check "all 4
   ReviewViewed rows exist for this user." If either condition fails,
   return a clear error indicating what's missing — don't just fail
   generically.

7. Update the frontend report page: if the report isn't unlockable yet,
   show which of the 4 reviews still need to be viewed (e.g. "3/4 code
   reviews viewed — view Level 2's review to unlock your report"), with a
   direct link to whichever review page(s) are still unviewed. Don't just
   show a locked state with no explanation of what to do next.

8. Test as a real user: complete all 4 levels but skip viewing one review,
   confirm the report is still locked with a clear message naming the
   missing review. Then view that last review and confirm the report
   unlocks immediately after.

9. Test the original access-control case too: attempt to hit
   /api/levels/:id/defense-mirror for a level you haven't completed yet
   (via curl/Postman, bypassing the UI) — confirm it's rejected. Then
   complete that level for real and confirm the same request now succeeds
   with real content matching the actual lab code.

CONSTRAINTS
- Don't invent vulnerabilities or fixes that don't match what's actually in
  the lab source — a mismatch here would teach the wrong lesson and looks
  bad if a judge compares the two side by side.
- Keep code snippets focused (the specific vulnerable function/block), not
  entire files — this is a teaching tool, not a code dump.
- Confirm the tokenizer/highlighting approach still has zero new
  dependencies before finishing this phase.

Start with step 1.
```

---

## Notes on running this in OpenCode

- **Big Pickle for steps 1 and 3** — the completion-gating check is real access control, the same class of bug Phase 6 spent real effort on; worth the careful model rather than assuming a quick `if` statement is correct.
- **Hy3 for step 2** — writing real code snippets + patched versions + inline notes for all 4 levels in one pass is a lot of structured content; the larger output ceiling helps avoid a cut-off generation partway through level 3 or 4.
- **MiMo V2.5 for step 4** — wiring one page from mock to live data is a contained, mechanical multi-file change once the endpoint exists.
- **Test step 5 yourself, not just trust OpenCode's report** — this is the same "attack your own system" instinct from Phase 6: actually try the API call before completing the level, don't just read the code and assume the check works.

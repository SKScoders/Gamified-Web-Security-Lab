# Phase 3 — Frontend Development
## Master Prompt for OpenCode
### Primary model: Big Pickle · Large single-file generation: Hy3 · Fast iteration: DeepSeek V4 Flash

Paste the block below as your first OpenCode message in the project root (where
`frontend/`, `components/`, `docs/` already exist per the Phase 1 folder
structure). Point OpenCode at the repo before running this so it can read the
existing files rather than starting from a blank slate.

---

## Master Prompt

```
You are working on SentinelChain, a gamified web security training platform.
Phase 1 (planning) and Phase 2 (UI/UX design in v0.dev) are complete. Your job
is Phase 3: turn the existing design into a fully wired, working Next.js
frontend.

CONTEXT — READ BEFORE WRITING ANY CODE
- Read every file already present under components/ui/, components/layouts/,
  and any page files under app/ before generating anything new. Match their
  existing patterns exactly: prop naming, className composition style
  (string arrays joined with .join(" ")), and file structure.
- Design tokens are fixed and must not be changed: background #0A0B0D, accent
  #2DD4BF (cyan), status colors green/amber/red used only on badges and score
  deltas, Inter for UI text, JetBrains Mono for code/logs/timestamps. Flat
  design, 1px borders, no gradients, no glows, no glassmorphism.
- Stack: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui patterns,
  lucide-react for icons. No new dependencies beyond what's already used
  unless you explicitly ask me first and I confirm.
- The 8 pages already designed in v0.dev are: Login, Dashboard, Playground,
  Level detail, Leaderboard, Profile, Final report, Defensive code review.
  Your job is not to redesign them — it's to make them functional.

GOAL FOR THIS PHASE
Wire every page to typed mock data (no real backend yet — that's Phase 4),
so the entire user flow is clickable end-to-end: login -> dashboard ->
playground -> level detail -> submit -> unlock next level -> final report ->
defensive code review.

WORK IN THIS ORDER — confirm each step works before moving to the next
1. Define shared TypeScript types in a single `types/index.ts`: User, Level,
   Progress, Hint, StageToken, LabInstance, AuditLogEntry, Report — matching
   the field names in the Phase 1 database schema exactly, so Phase 4's real
   API responses can drop in without renaming anything on the frontend.
2. Create a `lib/mock-data.ts` file with realistic fake data for all 8 pages:
   one user, 4 levels (Authentication Bypass, SQL Injection, Server-Side
   Vulnerability, Privilege Escalation) with mixed locked/active/complete
   states, a handful of leaderboard entries, and one fully-populated final
   report so that page isn't empty during the demo.
3. Wire the Dashboard page to mock-data: hero progress stepper, 3 stat cards,
   continue card, activity feed. No hardcoded numbers left in the JSX.
4. Wire the Playground page: 4 level cards driven by the mock levels array,
   locked state visually muted with the lock overlay, vertical progress line
   reflecting real completion state.
5. Wire the Level detail page: draggable split divider (pointer events, not
   CSS resize, min 360px / max 75% width), tabs (Objective / Hints / Submit
   proof) using the existing Tabs component, client-side timer using
   useState + useEffect that starts on mount, hint reveal wired to the
   Collapsible component with the score-penalty rule (-5 / -10 / -20 for
   hints 1/2/3).
6. Wire Submit proof: a form that accepts a pasted flag string, compares
   against the mock level's expected flag client-side for now (Phase 4 will
   move this check server-side), and on success marks the level complete and
   unlocks the next one in mock-data state.
7. Wire the Leaderboard page: sortable-by-score table using the existing
   Table component, current user's row kept in natural sort position plus a
   second row pinned via `position: sticky; bottom: 0` inside the table's own
   scroll container, segment control for This week / All time (can just
   filter the same mock array differently for now).
8. Wire the Profile page: user header, certificates grid (render one per
   completed level from mock data), history table, settings section (forms
   don't need to submit anywhere yet, just be visually complete and
   accessible).
9. Wire the Final report page: one expandable section per level pulling
   CVSS/OWASP/MITRE fields from mock data, "Download PDF" button can be a
   stub for now (Phase 8 owns real PDF generation) but should show a toast
   or disabled state rather than doing nothing silently.
10. Wire the Defensive code review page: render the vulnerable/patched code
    comparison from a pre-annotated line-by-line data structure (line,
    content, type: unchanged/added/removed, optional note) — do not compute
    a live diff algorithm. Use a small regex-based tokenizer for syntax
    highlighting, no highlight.js or other external highlighting library.
    Include the side-by-side / unified toggle.

CONSTRAINTS
- Every interactive element needs a visible keyboard focus state — don't
  strip default focus rings without replacing them.
- Every page must remain usable at tablet width (collapse grids to single
  column, don't just let content overflow).
- Don't invent new color tokens or components that duplicate something that
  already exists in components/ui/ — extend the existing ones instead.
- After each numbered step, stop and summarize what you changed and which
  files you touched before continuing to the next step, so I can review
  incrementally instead of getting one giant diff at the end.

Start with step 1.
```

---

## Notes on running this in OpenCode

- **Model switching mid-project is expected and fine.** Start the whole sequence on **Big Pickle** for steps 1–2 (types + mock data — needs project-wide consistency). If a single step produces a very large file (the Level detail page with the divider + tabs + timer all wired together is the most likely candidate), switch to **Hy3** just for that step so you're not fighting a truncated output, then switch back to Big Pickle.
- Use **DeepSeek V4 Flash** for anything you send *after* this master prompt finishes — small fixes like "the pinned leaderboard row border is the wrong shade" don't need a reasoning-heavy model and will come back faster on Flash.
- The step-by-step + "stop and summarize" instruction at the end matters more than it looks: OpenCode agents (like most agentic coders) tend to drift on a 10-step prompt if left to run unattended. Reviewing after each step keeps Big Pickle from quietly changing the design system three steps in.

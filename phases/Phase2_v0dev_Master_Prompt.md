# Phase 2 — UI/UX Design
## Master Prompt for v0.dev
### Platform: SentinelChain — Gamified Web Security Lab

This is built for **v0.dev**. Paste the **Master Prompt** block below as your first message to start the project, then use the **Page Prompts** as follow-up messages inside the same v0 chat thread — v0 keeps context, so each page will inherit the design system from the master prompt instead of drifting.

---

## Master Prompt (paste this first)

```
Design a professional cybersecurity training platform called "SentinelChain" — a
gamified web security lab where users progress through 4 chained, realistic
vulnerability challenges inside a corporate-style dashboard shell.

AESTHETIC DIRECTION
Not a generic SaaS dashboard and not a stereotypical "hacker green terminal on
black" cliché. Aim for the visual language of a serious enterprise security
product — think the polish of Linear or Vercel's own dashboard, crossed with
the operational seriousness of a SOC (security operations center) console.

- Base mode: dark, near-black background (#0A0B0D), not pure black
- Surface elevation via subtle 1px borders and very slightly lighter panels,
  not drop shadows or glows
- One signal accent color: a desaturated cyan/teal (#2DD4BF family) used
  sparingly for active states, progress, and primary actions only
- A second, distinct accent for severity/status: amber for in-progress /
  caution, red for critical/failed, green for solved/secure — used only on
  badges, status pills, and score deltas, never as decoration
- Typography: a clean geometric sans (Inter or similar) for UI text, and a
  monospace font (JetBrains Mono or similar) for anything code-, token-, or
  log-related — terminal output, exploit payloads, hashes, JWTs
- Flat design. No gradients, no neumorphism, no glassmorphism. Sharp
  information hierarchy over decoration.
- Data-dense but calm: generous line-height, clear grouping, no visual noise
  competing with the content a pentester actually needs to read (payloads,
  logs, scores)

TECH CONSTRAINTS
- Next.js App Router, Tailwind CSS, shadcn/ui components
- Fully responsive: desktop-first (this is a working tool, not primarily
  mobile) but must degrade gracefully to tablet width
- Dark mode is the default and primary mode; a light mode toggle should exist
  but dark is what gets designed first

CORE INFORMATION ARCHITECTURE
Dashboard (home) -> Playground (4 sequential levels) -> Level detail (lab +
terminal + hints) -> Final Report -> Defensive Code Review. Plus Login,
Profile, and Leaderboard as supporting pages.

Start by generating the LOGIN PAGE and the DASHBOARD (home) page together,
establishing the full design system (colors, typography, spacing, card style,
button style, badge/status style) so it can be reused consistently across the
rest of the app in follow-up prompts.
```

---

## Page Prompts (send as follow-ups, one at a time)

### 1. Login page
```
Now design the login page for SentinelChain using the established design
system. Split-screen layout: left side is the login form (email, password,
"remember me", SSO-style secondary button for "Continue with SSO"), right
side is a dark editorial panel with a subtle animated grid/circuit-line
background (CSS only, no heavy imagery) and a short tagline about training
security skills on realistic, chained vulnerabilities. Include a link to
register and a "forgot password" link. Keep the form itself minimal and
calm — this is the first impression of a serious tool, not a marketing page.
```

### 2. Dashboard (home)
```
Design the main dashboard. Top bar: logo, nav (Dashboard, Playground,
Leaderboard, Profile), user avatar menu. Below that:
- A hero progress card showing overall completion (X/4 levels), current
  score, and elapsed time across the whole chain, with a horizontal stepper
  showing the 4 levels and which are locked/active/complete
- A 3-column stat row: Rank, Score, Hints used (each a compact stat card)
- A "Continue where you left off" card that deep-links into the current
  active level
- A recent activity feed (monospace timestamps) showing the last few audit
  events: attempts, hints revealed, levels completed
Keep it information-dense but scannable — this is a tool the user opens many
times, not a page they linger on.
```

### 3. Playground (level list)
```
Design the Playground page: a vertical sequence of 4 level cards representing
Authentication Bypass, SQL Injection, Server-Side Vulnerability, and Privilege
Escalation. Each card shows: level number, title, vulnerability category
badge, OWASP category tag, lock/active/complete state, attempts count, and a
primary action button ("Enter lab" / "Locked" / "Review"). Locked levels are
visually muted with a lock icon overlay, not hidden. Connect the cards with a
vertical progress line that fills in as levels are completed, reinforcing the
chained/sequential nature of the challenge.
```

### 4. Level detail (the lab environment)
```
Design the level detail / "in the lab" page for an active level. Layout is a
resizable split view: left panel is an embedded iframe representing the live
vulnerable web app (show a placeholder browser-chrome frame with a fake URL
bar), right panel is a tabbed sidebar with three tabs: "Objective" (challenge
brief + target), "Hints" (3 collapsed hint rows, each showing its score
penalty before reveal, with a "Reveal hint" button), and "Submit proof" (a
form to paste the captured flag/token). A persistent top strip shows a live
timer, attempt counter, and current score delta. Keep the terminal/monospace
styling for anything resembling captured data or logs.
```

### 5. Leaderboard
```
Design the leaderboard page: a ranked table (rank, avatar + name, score,
levels completed, total time), with the current user's row visually pinned
and highlighted even if it's far down the list. Top 3 get a subtle distinct
treatment (not gaudy medals — think a quiet rank badge in the accent color).
Include a filter/segment control for "This week" vs "All time".
```

### 6. Profile
```
Design the profile page: user info header (avatar, name, join date, overall
rank), a grid of earned certificates (one per completed chain), a compact
history table of past attempts per level with score and time, and account
settings section (password change, notification preferences) below the fold.
```

### 7. Final report
```
Design the final report page, generated after completing all 4 levels. Header
with overall score, total time, and a "Download PDF" primary action. Below:
one expandable section per level, each showing: vulnerability name, CVSS
score with severity color coding, OWASP category, MITRE ATT&CK technique ID
and name, a short remediation summary, and time/attempts/hints used for that
level. Style this section like a real pentest report — clean, structured,
printable — since it doubles as the PDF export.
```

### 8. Defensive code review mode
```
Design the defensive code review page shown after a level is cleared. Split
view: left panel shows the vulnerable source code (syntax highlighted,
monospace), right panel shows the patched/secure version, with the specific
changed lines highlighted and connected by subtle inline annotation callouts
explaining why each change closes the exploit. Include a toggle to switch
between side-by-side and unified diff view.
```

---

## Notes for using this with v0.dev

- Keep everything in **one v0 chat thread** — v0 reuses your established components and Tailwind tokens across prompts in the same thread, so the pages stay visually consistent without you having to repeat the design system every time.
- After the first two pages generate, if the accent color or spacing isn't quite right, correct it once in that same thread ("make the accent color a touch more muted") before moving to the next page prompt — corrections compound forward.
- Export each generated page's code and drop it into `frontend/app/...` per the Phase 1 folder structure, then wire up real data in Phase 3/4.

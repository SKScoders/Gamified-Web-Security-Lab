Before building the Phase 8 PDF report generator, fix two things:

1. OWNERSHIP CHECK ON REPORTS
Open backend/src/modules/reports/routes.ts and check GET /api/reports/:id.
Confirm it verifies the report's user_id matches the authenticated user
making the request (req.user.id from the JWT). If it currently just looks
up a report by :id with no ownership check, fix it — any authenticated user
must only ever be able to fetch their own report, never another user's by
guessing or incrementing the ID. Return 403 (or 404, your call — 404 avoids
confirming a report ID exists at all) if the report belongs to someone else.

2. PDF LIBRARY CHOICE
When we build the PDF generator later this phase, use @react-pdf/renderer,
not Puppeteer or any other headless-browser-based PDF tool. This machine
doesn't have the memory headroom for a bundled Chromium process — same
reasoning as using bcryptjs instead of native bcrypt earlier in this
project. Add @react-pdf/renderer as a dependency now if you want to start
scaffolding the template, but confirm with me before pulling in anything
else beyond that one package.

Fix item 1 first and confirm it's actually enforced (test it: try fetching
a report that isn't yours and confirm you get rejected) before moving on to
any PDF generation work.




# Phase 8 — Pentest Report Generator
## Master Prompt for OpenCode
### Primary model: Big Pickle (access control) · Bulk template: Hy3 · Consistency pass: MiMo V2.5 · Iteration: DeepSeek V4 Flash

The report data (CVSS/OWASP/MITRE per level) already exists from Phase 4 —
this phase turns it into an actual downloadable PDF. "Download PDF" has been
a stub since Phase 3.

---

## Master Prompt

```
You are running Phase 8 of SentinelChain: generate a real, professional PDF
pentest report from data that already exists in the database.

Use @react-pdf/renderer, not Puppeteer or any headless-browser-based PDF
tool — this machine doesn't have the memory headroom for a bundled Chromium
process, and react-pdf's own layout engine avoids that entirely. Add it as
a new dependency (this is one of the few places in the project justified in
adding something new — confirm with me only if it pulls in anything beyond
@react-pdf/renderer itself).

SECURITY FIRST — READ BEFORE BUILDING ANYTHING
The existing GET /api/reports/:id endpoint from Phase 4 must only return a
report belonging to the authenticated user making the request. Check this
right now: does the current implementation verify the report's user_id
matches req.user.id, or does it just look up by :id with no ownership
check? If there's no check, any logged-in user could read another user's
report by guessing/incrementing IDs — fix this first, before adding PDF
generation on top of it.

DATA GAP TO FILL
The Levels table has owasp_category, mitre_technique_id, and cvss_base_vector,
but no remediation guidance text. Add a `remediation` text column via a
Prisma migration, and write real, specific remediation content for each of
the 4 seeded levels — not generic "follow security best practices" text:

- Level 1 (JWT weak secret): explain using a cryptographically random,
  sufficiently long secret (or better, asymmetric signing), never deriving
  it from guessable values, and never leaking it via source maps/debug logs/
  exposed .git folders.
- Level 2 (SQL injection): explain parameterized queries / prepared
  statements, and that input validation alone isn't sufficient — query
  construction itself must never concatenate user input.
- Level 3 (path traversal): explain canonicalizing and validating resolved
  file paths stay within an allowed base directory, rejecting any path
  containing traversal sequences rather than trying to blocklist "../".
- Level 4 (broken access control): explain that authorization must be
  re-checked server-side on every request against the authoritative stored
  role, never trusted from a client-supplied field or a stale token claim.

BUILD ORDER

1. Add the remediation column + content (migration + seed update).
2. Fix the ownership check on GET /api/reports/:id if missing (see above).
3. Build the PDF template as a React-pdf document component
   (backend/src/modules/reports/pdf-template.tsx or similar): cover section
   with overall score/time/user name, then one section per level showing
   vulnerability name, CVSS score with a severity-colored badge (reuse the
   same severity thresholds/colors as the web report page — critical/high/
   medium/low), OWASP category, MITRE technique ID + name, the new
   remediation text, and that level's time/attempts/hints-used. Style it to
   read as a real, printable pentest report — clean structure, not a copy
   of the web page's dark theme (a PDF meant to be printed/shared should be
   light-background, professional document styling, not dark-mode).
4. Add GET /api/reports/:id/download — verifies ownership (same check as
   step 2), generates the PDF from that report's stored summary_json using
   the template, and streams it back with
   Content-Type: application/pdf and
   Content-Disposition: attachment; filename="sentinelchain-report-<id>.pdf"
   Generate on-the-fly per request rather than persisting the PDF file to
   disk — Render's filesystem isn't guaranteed to persist across restarts,
   and regenerating from the stored JSON each time avoids that problem
   entirely.
5. Update the frontend report page's "Download PDF" button to call this
   endpoint and trigger a real browser download (not the stub/toast from
   Phase 3).
6. Test with a real completed run: finish all 4 levels as an actual user,
   generate the report, download the PDF, and open it — confirm every
   field is accurate and matches what's shown on the web report page.

CONSTRAINTS
- Don't let PDF generation block the Node event loop noticeably — if
  generation is slow, that's worth knowing, but @react-pdf/renderer is
  CPU-bound not I/O-bound, so keep an eye on response times under this
  change specifically.
- The report must only be downloadable once the user has actually completed
  all 4 levels — don't let a partial-completion user hit this endpoint and
  get a report with missing sections silently rendered as blank.

Start with step 1.
```

---

## Notes on running this in OpenCode

- **Big Pickle for steps 1–2 specifically** — the ownership check is a real access-control fix in the same category Phase 6 was built to catch, worth the careful model rather than assuming it's fine.
- **Hy3 for step 3** — a full PDF template with styled sections for 4 levels plus a cover page is a large single file; its bigger output ceiling avoids a truncated generation.
- **MiMo V2.5** if you want a follow-up pass reconciling the PDF's severity-color thresholds against the web report page's — making sure "critical" means the same CVSS range in both places.
- **DeepSeek V4 Flash for step 5** — wiring a button to an existing endpoint and triggering a file download is mechanical.

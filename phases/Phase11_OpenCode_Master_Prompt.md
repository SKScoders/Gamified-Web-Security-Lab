# Phase 11 — Deployment
## Master Prompt for OpenCode
### Primary model: Big Pickle (production security config) · Platform config/env wiring: MiMo V2.5 · Iteration: DeepSeek V4 Flash

Target: Frontend → Vercel · Backend → Render · Database → Neon (already
live since Phase 4) · Vulnerable labs → Railway or Render (per your Phase 7
decision).

**Before running this:** you'll need accounts on Vercel and Railway/Render
if you don't already have them (both have free tiers). This phase involves
you clicking through each platform's dashboard alongside OpenCode — it
can't create these accounts or click "Deploy" for you.

---

## Master Prompt

```
You are running Phase 11 of SentinelChain: deploy the platform so it's
reachable on the public internet, not just localhost. This is the first
phase where real exposure matters — anything that only worked because it
was tested on localhost needs re-verification against real HTTPS URLs.

1. ENVIRONMENT VARIABLE AUDIT — do this first
   List every environment variable currently used across backend/.env and
   each lab's .env: DATABASE_URL, JWT secrets, CORS_ORIGIN,
   INTERNAL_RESET_TOKEN, PORT, NODE_ENV, and anything else. For each one,
   note whether it needs a different value in production versus local dev.
   Confirm NODE_ENV=production is set for all deployed services — re-check
   the Phase 10 finding that this suppresses stack traces/internal error
   detail in API responses, since that matters far more once this is
   public than it did on localhost.

2. BACKEND → RENDER
   Prepare the backend for a Render web service: confirm the start command
   (npm run build && npm start, or equivalent), confirm it reads PORT from
   the environment (Render assigns this dynamically, don't hardcode 4000
   for the deployed instance), and set all required env vars in Render's
   dashboard (DATABASE_URL pointing at the existing Neon instance, JWT
   secrets, NODE_ENV=production). Do not commit any of these values to the
   repo — confirm .env is gitignored.

3. FRONTEND → VERCEL
   Set NEXT_PUBLIC_API_URL (or whatever the frontend's API base URL
   variable is named) to the real deployed Render backend URL, not
   localhost. Confirm the build succeeds on Vercel and the site loads.

4. LABS → RAILWAY OR RENDER
   Deploy each of the 4 lab Dockerfiles as separate services. Set
   INTERNAL_RESET_TOKEN and any other required env vars to match what the
   backend expects. Once deployed, update the backend's LAB_URLS mapping
   (or wherever lab URLs are configured) to point at the real deployed lab
   URLs instead of localhost:3001-3004.

5. CORS — UPDATE FOR PRODUCTION
   Update CORS_ORIGIN on the deployed backend to the real Vercel frontend
   URL (exact match, including https://, no trailing slash unless the
   frontend URL actually has one). The dev CORS bug from earlier in this
   project was caused by exactly this kind of mismatch — double check it
   carefully rather than assuming it's fine.

6. CROSS-ORIGIN IFRAME CHECK — LIKELY NEW ISSUE
   The deployed labs and the deployed frontend will be on different domains
   entirely (not just different ports like localhost was). Confirm the
   iframe embedding still works: check each lab's response headers for
   X-Frame-Options or Content-Security-Policy frame-ancestors directives
   that might block being framed by the Vercel domain, and update them to
   explicitly allow it if needed. Also confirm all URLs involved are
   https:// — browsers block mixed content (an https page loading an http
   iframe), and Render/Railway/Vercel all serve https by default, so this
   should be fine as long as nothing is hardcoded to http:// anywhere.

7. FULL PRODUCTION SMOKE TEST
   Once everything is deployed, do NOT just check that pages load — repeat
   the full Phase 4/5 end-to-end walkthrough against the real production
   URLs: signup, login, all 4 levels including the real lab iframes, all 4
   flag submissions, all 4 defensive reviews, final report generation and
   PDF download. Report exactly what you tested and the result of each
   step.

CONSTRAINTS
- Never commit real secrets to the repo, even temporarily, even in a commit
  you plan to amend later — assume every commit is permanent history.
- If anything that passed on localhost fails once deployed, treat it as a
  new bug to fix, not a deployment inconvenience to route around.
```

---

## Notes on running this in OpenCode

- **You'll be doing real clicking-around in Vercel/Railway/Render dashboards yourself** — OpenCode can tell you what to configure and can edit the repo's config files, but account creation and clicking "Deploy" happen in a browser you control.
- **Big Pickle for steps 1, 5, and 6** — production CORS/security config and cross-origin iframe headers are exactly the category of mistake that's invisible until a judge's browser hits it live; worth the careful model.
- **MiMo V2.5 for steps 2–4** — repetitive platform-by-platform config wiring.
- **One tradeoff worth deciding now, not discovering on demo day:** Render's free tier spins down inactive services, meaning a lab's first request after being idle can take ~30 seconds to respond. If you're demoing live to judges, either keep something pinging the labs periodically beforehand, or explicitly mention the cold-start behavior so it doesn't look like the platform is broken mid-demo.

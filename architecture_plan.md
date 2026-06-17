# ClientForge — Architecture Review

> Senior engineering / product / founder review of the current codebase against the roadmap.
> Reviewer assumption: this is a portfolio-grade SaaS intended to convince recruiters and hiring managers
> that the author can ship real, production-shaped software.

---

## 0. TL;DR (read this first)

- **Current status after the June 17 restart:** portal tenancy, the main object-level API authorization gaps, local upload storage, auth secret naming, basic route boundaries, core input validation, rate limiting, permission tests, an owner/client deliverable e2e flow, a real README, one-click demo entry points, richer landing sections, metadata/OpenGraph defaults, real global search, AI summaries with fallback, analytics charts, a more polished client portal experience, lightweight client portal invites, basic client creation, basic project creation, basic deliverable creation, and project completion actions have been added. The next highest-priority blocker is production deployment verification.
- **You are realistically at the end of Phase 8, with partial slices of Phases 9–12 already built.** You jumped ahead and built notifications, comments, deliverable workflow, and a portal. The biggest remaining "done but not production-ready" areas are real AI, command palette polish, and production deployment verification.
- **You CAN recover your login right now.** Your owner credentials are hard-coded in `prisma/seed.ts`:
  - Owner: `angeleslaurenjohn@gmail.com` / `password123`
  - Client test user: `client@clientforge.app` / `client123`
  - If the DB was reset, just re-run the seed. (Full recovery steps in Section 7.)
- **Two things are still actively weak for production / portfolio review:**
  1. Cloudinary is wired in code, but the deployment still needs real `CLOUDINARY_*` env vars and an upload smoke test.
  2. The app still needs **production deployment verification** and a few remaining polish items before sharing publicly.
- **Maturity level today: stronger mid-level moving toward senior signal.** The app now has real multi-tenant client isolation and better API authorization. With real file storage, validation, tests, real AI, and a Linear/Notion-grade landing page, it becomes a **convincing senior-level** portfolio piece.

### Restart Progress
- ✅ Fixed portal tenancy by adding `Client.userId`, linking the seeded client user to one client record, and scoping `/portal` to that client only.
- ✅ Added object-level authorization checks across the main project, deliverable, dashboard, client, workspace, comments, review, and activity API surfaces.
- ✅ Added `/portal` to middleware protection.
- ✅ Replaced local upload writes with Cloudinary-backed upload storage and added `.env.example`.
- ✅ Added real analytics charts for project status, deliverable outcomes, and recent activity.
- ✅ Expanded the client portal from a basic deliverable list into a client workspace with metrics, project progress, review panels, comments, file links, and recent activity.
- ✅ Added lightweight owner-driven client portal invites plus a portal sign-out / switch-account action.
- ✅ Added a validated Add Client flow so owners can create client records before inviting portal access.
- ✅ Added a validated Create Project flow so owners can attach projects to existing clients.
- ✅ Added a Create Deliverable form on project detail pages so new projects can move into upload/review workflow.
- ✅ Added a non-destructive Mark Completed project action that sets completed status/progress and logs activity.
- ⏭️ Next: verify deployment.

---

## 1. Where you actually are (phase-by-phase audit)

Legend: ✅ done & solid · 🟡 done but flawed/incomplete · ❌ not done / fake

| Phase | Status | Evidence in code |
|------|--------|------------------|
| 0 — Product foundation | 🟡 | No source-of-truth doc exists in repo (this file fixes that). |
| 1 — Setup & design system | ✅ | Next 16, TS, Tailwind v4, shadcn-style `components/ui/*`, `PageShell`, dark premium theme, sidebar/topbar. |
| 2 — DB & auth foundation | ✅ | Prisma + Postgres (Neon `directUrl`), NextAuth credentials, bcrypt, `middleware.ts` guards. |
| 3 — Workspace + roles | 🟡 | `WorkspaceRole` enum + `requireRole`/`requireInternalAccess`/`requireClientAccess` exist. **But:** no workspace switcher, no "create workspace" UI, code always uses `memberships[0]`, so multi-workspace is not real. |
| 4 — Clients module | ✅ | `app/(dashboard)/clients`, `/api/clients`, search/filter, workspace-scoped. |
| 5 — Projects module | 🟡 | List + detail + deliverables + activity. **Missing:** assignees, real stages/Kanban, the "comments/overview/analytics" tabs are thin. |
| 6 — Client portal | ✅ | `/portal` + `requireClientAccess` exist. Client users are linked to `Client.userId`, portal queries are scoped to that client, and client review/comment/activity access is constrained by linked client ownership. |
| 7 — Deliverables & approval | ✅ | Upload + status transitions + approve/request-revision + file metadata. Local disk writes have been replaced with Cloudinary and a real upload was smoke-tested successfully. |
| 8 — Comments / notes / audit | ✅ | `ActivityLog`, `Comment`, `lib/activity.ts`, `lib/notifications.ts`, notification bell/dropdown/pages. Strong work. |
| 9 — Analytics | ✅ | `/api/analytics/overview` returns workspace-scoped KPIs plus chart datasets, and the analytics page renders project status, deliverable outcome, and activity trend charts with Recharts. |
| 10 — AI w/ fallback | ✅ | `lib/ai/project-summary.ts` uses OpenAI when `OPENAI_API_KEY` is configured and falls back to the deterministic summary if the key is missing or the AI response fails validation. |
| 11 — Search/filters/shortcuts | 🟡 | Topbar search now queries workspace-scoped clients, projects, and deliverables. Still missing command palette and keyboard shortcuts. |
| 12 — Notifications/automation | 🟡 | In-app notifications + unread counts ✅. No digest/cron, no reminders. |
| 13 — Production hardening | ❌ | No `not-found.tsx`/`error.tsx`, no zod validation, no rate limiting, no tests, no SEO/legal, and auth env naming still needs cleanup. `.env.example` now exists. |

**Net:** You are *past* where you think (Phase 8 done). Phase 6 is now credible, and Phase 7 is close. The biggest remaining debt before a serious demo is env/config cleanup, validation/tests, and recruiter-facing polish.

---

## 2. Architecture & technical gaps (the things a senior reviewer will catch)

### Recently fixed
- **Portal multi-tenant data leak.** `Client.userId` now links a client login to a specific client record, and portal data is scoped to the signed-in client.
- **Main object-level API authorization gaps.** The key project, deliverable, client, dashboard, workspace, comment, activity, and client-review routes now check workspace ownership before returning or mutating records.
- **`/portal` middleware protection.** Portal routes are included in the middleware matcher.
- **Non-portable local upload writes.** `lib/uploads.ts` now uploads through Cloudinary instead of writing to `public/uploads`, the upload route is pinned to Node runtime, `cloudinary` is installed, `.env.example` documents upload config, and `public/uploads` is ignored.
- **`AUTH_SECRET` / NextAuth config drift.** Auth now prefers `NEXTAUTH_SECRET` and falls back to `AUTH_SECRET` in both NextAuth options and middleware token decoding.
- **Missing route boundaries.** Added global `not-found.tsx`, dashboard `error.tsx`, dashboard `loading.tsx`, and portal `loading.tsx`.
- **Missing input validation layer.** Added zod and a shared JSON parser, then validated signup, settings updates, comments, deliverable creation, status changes, and client review actions.
- **No rate limiting.** Added Upstash-compatible rate limiting with a local-memory fallback, then applied it to signup, upload, comments, client review, deliverable status, and deliverable creation routes.
- **No tests at all.** Added Vitest plus focused unit coverage for deliverable tenancy/permission rules.
- **No end-to-end test.** Added Playwright plus a seeded owner/client flow proving owner upload/status change and client approval through the portal.
- **Default README.** Replaced the starter Next.js README with a recruiter-facing overview, demo credentials, architecture notes, setup steps, scripts, and test coverage.
- **Frictionful demo entry.** Added one-click owner/client demo login buttons on the landing and login pages, with client demo routing to `/portal`.
- **Thin landing page and metadata.** Expanded the marketing page with trust badges, problem/solution storytelling, feature sections, personas, architecture proof points, final CTA, and richer metadata/OpenGraph defaults.
- **Fake global search.** Added `/api/search` and wired the topbar search to workspace-scoped clients, projects, and deliverables.
- **Fake AI summary.** Added OpenAI-backed project summaries with a deterministic fallback path and visible source badge.

### Critical (fix before showing anyone / deploying)
1. **Production deployment still needs verification.** Deploy to Vercel + Neon, verify auth, uploads, seed data, and demo accounts in production.
2. **Analytics visuals are now charted.** Keep future analytics work lightweight unless it directly improves the public demo.

### Important (do during the 30 days)
3. **`Session` model is dead schema.** You use JWT strategy, so the DB `sessions` table is never written. Either remove it or switch to the database session strategy. Dead schema reads as confusion.

### Polish (cheap wins, high signal)
8. **README screenshots would improve the first impression.** The README now has the core story, setup, demo creds, and architecture notes; add screenshots once the landing/dashboard visuals are final.
9. **Topbar fetches workspace via client `useEffect`** — fine, but it's a render-blocking flash. Prefer passing from a server layout.

---

## 3. Re-sequencing: move earlier / later / cut

**Move EARLIER (do now — they're either broken-marked-done or high signal):**
- Demo seed banner / one-click demo entry — needed before *any* recruiter visits.
- Landing page overhaul (see Section 6) — it's the first and often only thing a recruiter sees.

**Move LATER / keep light:**
- Saved views, keyboard shortcuts (Phase 11) — nice, not differentiating. A command palette (⌘K) is the one worth doing.
- Daily digest / cron (Phase 12) — keep to a single daily Vercel cron or skip; don't build a scheduler.

**CUT or down-scope (not worth portfolio time):**
- True multi-workspace switching with org billing — **simulate** it (switcher UI that swaps `memberships[i]`), don't build org management/billing.
- Audit "log records for critical actions" as a separate system — your `ActivityLog` already covers it; don't build a second audit subsystem.
- Heavy analytics (warehouse/aggregation pipelines) — you correctly flagged this; aggregate with Prisma `groupBy` only.

---

## 4. What's over-engineered vs under-engineered

- **Over-engineered for a portfolio:** separate Notification + ActivityLog + Comment graphs are already quite deep; that's fine, but resist adding more entity types. Multi-workspace org management would be over-engineering.
- **Under-engineered (where seniors actually score points):** real storage, validation, tests, and observability/error handling. Authorization is now much stronger; keep applying the same object-level pattern to every new route.

---

## 5. Features that make recruiters lean in (add 2–3, not all)

1. **A real, scoped client portal with a public read-only demo link** — "share this project with your client" magic-link/token. Unique and product-y.
2. **Command palette (⌘K)** for navigation + actions — instantly reads as "this person uses Linear."
3. **Real AI with graceful fallback** — wire your existing template as the fallback, add an actual LLM call for "summarize feedback / draft weekly update." The *fallback architecture* is the senior signal.
4. **Activity timeline + optimistic UI** on deliverable approvals — feels expensive.
5. **Role-based demo switcher on the landing/login** ("Explore as Owner / as Client") — removes friction for recruiters and shows off your RBAC. Huge for a portfolio.
6. **Seeded, self-healing demo workspace + "Reset demo data" button** — shows you think about real users.

---

## 6. Landing page & pre-auth experience (your main concern)

Your current `components/marketing/hero.tsx` is a single hero with three feature cards. To feel like **Linear / Notion / ClickUp**, build a real **scroll narrative**. Recommended section order:

1. **Sticky top nav** (logo, Product / Features / Pricing-ish anchors, Log in, "Get started" CTA). You currently float links absolutely — replace with a proper nav bar that shrinks on scroll.
2. **Hero** — keep it punchier:
   - One outcome-driven headline ("Client work, from kickoff to sign-off — in one workspace"), one sub-line, **two CTAs**: primary "Try the live demo" (auto-login as demo owner), secondary "Explore client portal."
   - Add a **real product screenshot / app mock** (not abstract cards). A framed dashboard image with subtle shadow + gradient glow.
3. **Logo / trust strip** — even "Built with Next.js · Postgres · Prisma · NextAuth" badges work as *engineering* social proof for recruiters.
4. **Problem → Solution storytelling** — 3 short "before/after" beats (scattered email approvals → one timeline; lost files → versioned deliverables; no visibility → client portal).
5. **Feature sections (alternating left/right)** with annotated UI shots: Projects & deliverables, Approval workflow, Client portal, Notifications, Analytics, AI summaries. Each: short headline + 2-line benefit + visual.
6. **Interactive demo block** — embed a live, role-aware sandbox or a "click to log in as Owner/Client" panel. This is the conversion centerpiece for *your* audience (recruiters).
7. **"Built for" personas** — Agencies / Freelancers / Service teams (who it's for).
8. **Architecture/Engineering section (your secret weapon)** — a tasteful diagram: Next.js App Router · server actions/route handlers · Prisma · Neon · RBAC · Cloudinary · Upstash · AI w/ fallback. *Most portfolios hide the architecture; surface it.*
9. **Social proof** — a couple of stylized testimonial cards (clearly demo) + GitHub link + "View source."
10. **Final CTA band** + **footer** (Product, demo creds, GitHub, privacy/terms placeholders).

**Design system / conversion patterns to apply:**
- Strong visual hierarchy: one H1, generous spacing, max ~2 accent colors, consistent radius (you already use rounded-2xl/3xl).
- Motion: subtle fade/slide-in on scroll (Framer Motion), hover lift on cards. Don't overdo it.
- Gradient mesh / grid background (you have `grid-pattern`) + a glow behind the hero mock.
- Make it **fully responsive** and run **Lighthouse** (aim 90+). Add real `metadata`/OpenGraph for link previews — recruiters share links.
- Add a persistent **"Live demo" badge** so nobody has to sign up.

---

## 7. Authentication: recovery, inspection, and verification

### A. How auth is set up (files to check first)
- `lib/auth.ts` — NextAuth options (Credentials provider, bcrypt compare, JWT strategy, `signIn: /login`).
- `middleware.ts` — route protection via `getToken`; dashboard and portal routes are covered.
- `lib/workspace.ts` — `getCurrentUserWithWorkspace()` (membership/role resolution; uses `memberships[0]`).
- `lib/guards.ts` — `requireRole` / `requireInternalAccess` / `requireClientAccess`.
- `app/api/auth/[...nextauth]/route.ts`, `app/api/signup/route.ts`, `prisma/seed.ts`.

### B. Recover access (you already have credentials)
The seed file contains your owner login:
- Email: `angeleslaurenjohn@gmail.com`
- Password: `password123`

Try logging in with those first. If the DB was wiped, regenerate everything:

    npx prisma generate
    npx prisma migrate deploy        # or: npx prisma migrate dev
    npm run db:seed                  # re-creates owner + client + demo data

### C. Inspect the database directly

    npx prisma studio                # GUI: open the `users` table, confirm your email + passwordHash

### D. Create a NEW admin/owner safely (if you want fresh creds)
Two safe options:
1. **Edit `prisma/seed.ts`** to your preferred email/password, then `npm run db:seed` (it upserts, so it won't duplicate).
2. **One-off script** (recommended for a personal account) — create `scripts/create-owner.ts`:

    import { PrismaClient, WorkspaceRole } from "@prisma/client";
    import bcrypt from "bcryptjs";
    const prisma = new PrismaClient();
    async function main() {
      const passwordHash = await bcrypt.hash("CHOOSE_A_STRONG_PASSWORD", 10);
      const user = await prisma.user.upsert({
        where: { email: "you@example.com" },
        update: { passwordHash },
        create: { name: "Your Name", email: "you@example.com", passwordHash },
      });
      const ws = await prisma.workspace.upsert({
        where: { slug: "my-workspace" },
        update: {},
        create: { name: "My Workspace", slug: "my-workspace" },
      });
      await prisma.membership.upsert({
        where: { userId_workspaceId: { userId: user.id, workspaceId: ws.id } },
        update: { role: WorkspaceRole.OWNER },
        create: { userId: user.id, workspaceId: ws.id, role: WorkspaceRole.OWNER },
      });
      console.log("Owner ready:", user.email);
    }
    main().finally(() => prisma.$disconnect());

Run with: `npx tsx scripts/create-owner.ts`

### E. Verify auth is working (checklist)
- `npm run dev`, go to `/login`, sign in with seeded owner → lands on `/dashboard`.
- Visit `/dashboard` while logged out → redirected to `/login?callbackUrl=...`.
- Log in as the CLIENT user → should be sent to `/portal` (and *blocked* from `/dashboard`).
- Confirm `NEXTAUTH_SECRET`/`AUTH_SECRET` and `NEXTAUTH_URL` are set in `.env`; mismatched secrets are the #1 cause of "logged in but bounced" loops.

---

## 8. Maturity verdict (honest)

- **Roadmap as written:** aspirationally **senior-level** (RBAC, multi-tenancy, workflow, AI-with-fallback, free-tier-aware infra). Good instincts.
- **Code as it exists today:** **strong mid-level with some senior-shaped correctness work now in place.** Real schema, real auth, scoped client portal, object-level route checks, Cloudinary-backed upload code, relational features, and a clean component system. But fake search, fake AI, weak validation, missing upload smoke tests, and zero automated tests are still the gaps that separate "mid" from "senior" in a code review.
- **Staff-level?** No, and you don't need it. Staff signal would be things like measured performance budgets, multi-tenant isolation tests, and observability — out of scope for a portfolio. Don't chase it.
- **Path to a credible senior portfolio:** Cloudinary env verification → `.env`/auth cleanup → validation and tests → real AI w/ fallback → a Linear-grade landing page + README + live demo. That's the updated plan below.

---

## 9. Prioritized 30-day action plan

### Week 1 — Correctness & credibility (current sprint)
- [x] Fix portal multi-tenancy: add `Client.userId` link; scope `/portal` + client review/comment/activity access to the signed-in client.
- [x] Add object-level authz to the main `/api/**` project, deliverable, client, dashboard, workspace, comment, activity, and review surfaces.
- [x] Add `/portal` to middleware matcher.
- [x] Replace local file storage with **Cloudinary**. Gitignore `public/uploads`, keep the existing deliverable metadata fields, and stop writing uploads to disk.
- [x] Add `.env.example` with database, auth, and Cloudinary variables.
- [x] Add real Cloudinary credentials locally and verify a production-like upload flow.
- [x] Reconcile `AUTH_SECRET` vs `NEXTAUTH_SECRET`.
- [x] Add `app/not-found.tsx`, dashboard `error.tsx`, and route-level `loading.tsx`.

### Week 2 — Recruiter-facing demo foundation
- [x] Write README: what/why/who, demo creds, architecture notes, local setup, scripts, and test coverage.
- [x] Rebuild landing as the multi-section narrative in Section 6 (nav, hero, demo block, features, architecture proof points, CTA, footer-style close).
- [x] Add **"Explore live demo as Owner / as Client"** one-click login buttons.
- [x] Add metadata/OpenGraph defaults.
- [ ] Add favicon/product screenshots and run Lighthouse, fix to 90+.

### Week 3 — Differentiators
- [x] Wire **real AI** project summaries with the existing template as the **fallback** path.
- [x] Make the topbar search actually search clients/projects/deliverables.
- [ ] Add **⌘K command palette** for navigation and actions.
- [x] Add real charts to analytics (recharts) using workspace-scoped aggregates: project status distribution, deliverable outcomes, and activity trends.

### Week 4 — Hardening & ship
- [x] Add **zod** validation across core API mutation routes.
- [x] Add **Upstash-compatible rate limiting** to signup/upload/comment/deliverable mutation routes.
- [x] Add Vitest for permission/tenancy logic.
- [x] Add one Playwright e2e (owner uploads a deliverable; client approves or requests revision).
- [ ] Deploy to Vercel + Neon; verify uploads, auth, and the demo accounts in production; add privacy/terms placeholders.
- [ ] Add a "Reset demo data" action so the public demo self-heals.

### Stretch (only if ahead)
- [ ] Simulated workspace switcher (swap `memberships[i]`).
- [ ] Daily digest via a single Vercel cron.
- [ ] Kanban board for internal project stages.

---

## 10. Definition of "portfolio-ready / hireable"
A recruiter or hiring engineer can, in under 5 minutes:
- Open the live URL and immediately understand what it does and who it's for (landing page).
- Click "demo as Owner" and "demo as Client" without signing up, and feel the RBAC difference.
- Open the GitHub README and see screenshots, an architecture diagram, demo creds, and a one-command local setup.
- Skim the code and find: scoped multi-tenant queries, validated inputs, real file storage, AI-with-fallback, and at least a few meaningful tests.

Hit those and ClientForge stops looking like a tutorial project and starts looking like something you'd ship at a company.
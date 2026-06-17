# ClientForge

ClientForge is a portfolio-grade client portal SaaS for freelancers, agencies, and service teams. It brings client records, project tracking, deliverables, approvals, comments, notifications, analytics, and a scoped client portal into one production-shaped workspace.

The project is intentionally built to show more than UI: it includes multi-tenant authorization, Cloudinary file storage, input validation, rate limiting, route boundaries, seeded demo data, unit tests, and an end-to-end owner/client workflow.

## Demo Accounts

Seeded local credentials:

```txt
Owner
Email: angeleslaurenjohn@gmail.com
Password: password123

Client
Email: client@clientforge.app
Password: client123
```

The client account is linked to the `Northstar Labs` client record, so `/portal` only exposes that client's projects and deliverables.

## Product Highlights

- Workspace-scoped clients, projects, deliverables, comments, activity logs, and notifications.
- Internal dashboard for owners/admins/members.
- Client portal with linked-client isolation via `Client.userId`.
- Deliverable workflow: draft, in review, approved, revision requested.
- Cloudinary-backed deliverable file uploads.
- Analytics overview for project and deliverable health.
- AI summary placeholder with a deterministic fallback path.
- Production hardening: route guards, object-level authorization, zod validation, rate limiting, error/loading/not-found boundaries.
- Tests: Vitest permission unit tests and Playwright owner/client approval flow.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma + PostgreSQL
- NextAuth credentials auth
- Cloudinary uploads
- Upstash-compatible rate limiting
- Zod validation
- Vitest + Playwright

## Architecture

```txt
Browser
  -> Next.js App Router pages and route handlers
  -> NextAuth credentials session
  -> Guard helpers: requireInternalAccess / requireClientAccess
  -> Object-level authorization in API queries
  -> Prisma Client
  -> PostgreSQL

Deliverable uploads
  -> /api/deliverables/[id]/file
  -> Cloudinary
  -> fileUrl/fileName/fileSize/fileType stored on Deliverable

Client portal
  -> User with WorkspaceRole.CLIENT
  -> linked Client.userId
  -> projects filtered by workspaceId + clientId
```

## Local Setup

Install dependencies:

```bash
npm install
```

Create your local environment:

```bash
cp .env.example .env
```

Fill in:

```txt
DATABASE_URL
DIRECT_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
OPENAI_API_KEY
```

Optional for production-grade rate limiting:

```txt
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

If Upstash variables are missing locally, ClientForge uses an in-memory rate-limit fallback.

Prepare the database:

```bash
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Inspect data:

```bash
npx prisma studio
```

## Scripts

```bash
npm run dev        # Start local dev server
npm run build      # Production build
npm run lint       # ESLint
npm test           # Vitest unit tests
npm run test:e2e   # Playwright e2e tests
npm run db:seed    # Seed demo workspace/users/projects
```

## Test Coverage

Current automated coverage:

- `lib/permissions.test.ts`: verifies workspace and client deliverable access rules.
- `e2e/owner-client-deliverable.spec.ts`: owner uploads a deliverable, moves it to review, and the linked client approves it in the portal.

Run all current checks:

```bash
npm test
npx tsc --noEmit
npm run lint
npm run test:e2e -- e2e/owner-client-deliverable.spec.ts
```

## Security And Correctness Notes

- Client portal data is scoped through `Client.userId`.
- API mutations verify workspace ownership before touching project or deliverable records.
- Zod validates core mutation inputs.
- Cloudinary replaces local filesystem uploads for Vercel-safe storage.
- AI summaries use OpenAI when configured and fall back to deterministic summaries if unavailable.
- Rate limiting protects signup, uploads, comments, deliverable creation/status, and client review actions.
- Dashboard server fetches forward cookies so authenticated internal APIs do not redirect to login.

## Roadmap

See `architecture_plan.md` for the working roadmap. Near-term priorities:

- Upgrade the marketing landing page into a full scroll narrative.
- Add one-click demo entry points for owner/client roles.
- Replace placeholder AI summaries with an LLM-backed route and fallback.
- Wire global search or a command palette.
- Add real charts to analytics.

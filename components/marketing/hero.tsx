"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Workflow,
  Bell,
  BarChart3,
  CheckCircle2,
  Building2,
  Cloud,
  Database,
  LockKeyhole,
  TestTube2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoLoginButtons } from "@/components/marketing/demo-login-buttons";

const trustBadges = [
  "Next.js 16",
  "PostgreSQL",
  "Prisma",
  "NextAuth",
  "Cloudinary",
  "Vitest + Playwright",
];

const storyBeats = [
  {
    before: "Approvals scattered across email threads",
    after: "Deliverables move through draft, review, approval, and revision states.",
  },
  {
    before: "Files disappear into local folders and chat uploads",
    after: "Every deliverable keeps Cloudinary-backed file metadata in the workspace.",
  },
  {
    before: "Clients see too much or ask for status updates",
    after: "The portal scopes each client to their linked client record and project work.",
  },
];

const featureSections = [
  {
    icon: Workflow,
    title: "Projects and deliverables stay connected",
    description:
      "Track client work from project overview to individual deliverable status, comments, files, and activity.",
    bullets: ["Workspace-scoped project data", "Deliverable status workflow", "Activity history"],
  },
  {
    icon: ShieldCheck,
    title: "Client portal without data leaks",
    description:
      "Client users are linked to a specific Client record, so the portal only shows their projects and review actions.",
    bullets: ["Client.userId ownership", "Object-level API authorization", "Portal-only review actions"],
  },
  {
    icon: BarChart3,
    title: "Operational signal, not just CRUD",
    description:
      "Dashboard and analytics views summarize project health, approval outcomes, and recent workspace activity.",
    bullets: ["Analytics overview", "Unread notifications", "AI summary fallback"],
  },
];

const architectureItems = [
  {
    icon: Database,
    title: "Relational core",
    text: "Prisma models workspaces, clients, projects, deliverables, comments, notifications, and activity.",
  },
  {
    icon: LockKeyhole,
    title: "Authorization first",
    text: "Route guards and query-level workspace checks protect owner, member, and client workflows.",
  },
  {
    icon: Cloud,
    title: "Production storage",
    text: "Cloudinary handles deliverable uploads while PostgreSQL stores durable file metadata.",
  },
  {
    icon: TestTube2,
    title: "Verified flows",
    text: "Vitest covers tenancy rules and Playwright proves the owner upload/client approval path.",
  },
];

export function Hero() {
  const { data: session } = useSession();

  return (
    <section className="relative overflow-hidden">
      <div className="grid-pattern absolute inset-0 opacity-30" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16">
        <div className="absolute left-6 right-6 top-6 flex items-center justify-between gap-4 text-sm">
          <Link href="/" className="font-semibold tracking-tight text-white">
            ClientForge
          </Link>

          <div className="hidden items-center gap-5 text-gray-400 md:flex">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#live-demo" className="hover:text-white">
              Demo
            </a>
            <a href="#architecture" className="hover:text-white">
              Architecture
            </a>
          </div>

          <div className="flex items-center gap-4">
          {session ? (
            <Link href="/dashboard" className="text-white hover:opacity-80">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white">
                Log in
              </Link>

              <Link
                href="/signup"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white hover:bg-white/10"
              >
                Get started
              </Link>
            </>
          )}
          </div>
        </div>

        <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-300">
          <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
          Multi-workspace client collaboration SaaS
        </div>

        <div className="grid items-center gap-14 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
              Client work, from kickoff to sign-off, in one workspace.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-400">
              Manage clients, projects, deliverables, approvals, analytics,
              notifications, and AI-powered project summaries in a polished platform
              built for agencies, freelancers, and modern service teams.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-2xl">
                <Link href={session ? "/dashboard" : "#live-demo"}>
                  {session ? "Enter dashboard" : "Try the live demo"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              {!session ? (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <Link href="/login">Log in</Link>
                </Button>
              ) : null}

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="#architecture">View architecture</Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
                Role-based access
              </div>

              <div className="flex items-center gap-2">
                <Workflow className="h-4 w-4 text-[var(--accent)]" />
                Project + deliverable workflows
              </div>

              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[var(--accent)]" />
                Notifications and approvals
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {trustBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-gray-400"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-400">Workspace Snapshot</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    Built for client operations
                  </p>
                </div>
                <BarChart3 className="h-6 w-6 text-[var(--accent)]" />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Projects
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">Live tracking</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Reviews
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">Client approvals</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Access
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">Internal + portal</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Insights
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">Analytics + AI</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <Workflow className="h-6 w-6 text-[var(--accent)]" />
                <h3 className="mt-4 text-lg font-medium text-white">
                  Workflow-focused
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Projects, deliverables, comments, and approvals connected in one
                  system.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <ShieldCheck className="h-6 w-6 text-[var(--accent)]" />
                <h3 className="mt-4 text-lg font-medium text-white">
                  Role-based access
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Separate agency workflows from the client-facing portal without
                  confusion.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <Sparkles className="h-6 w-6 text-[var(--accent)]" />
                <h3 className="mt-4 text-lg font-medium text-white">
                  AI with fallback
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Smart summaries and insights layered on top of real operational
                  data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {!session ? (
          <div
            id="live-demo"
            className="mt-20 rounded-[2rem] border border-cyan-300/20 bg-cyan-300/[0.04] p-6 shadow-2xl shadow-cyan-950/20"
          >
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-200">
                  Live demo
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                  Compare the owner dashboard and the scoped client portal.
                </h2>
                <p className="mt-4 text-sm leading-7 text-gray-400">
                  Use seeded accounts to see both sides of the workflow without
                  signing up. The client demo is linked to one client record, so
                  it only sees Northstar Labs work.
                </p>
              </div>

              <DemoLoginButtons />
            </div>
          </div>
        ) : null}

        <div className="mt-20 grid gap-4 lg:grid-cols-3">
          {storyBeats.map((item) => (
            <div
              key={item.before}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                Before
              </p>
              <p className="mt-3 text-sm leading-6 text-gray-400">{item.before}</p>
              <div className="my-5 h-px bg-white/10" />
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">
                After
              </p>
              <p className="mt-3 text-sm leading-6 text-white">{item.after}</p>
            </div>
          ))}
        </div>

        <div id="features" className="mt-24 space-y-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-200">
              Product workflow
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Built around the work clients actually review.
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {featureSections.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6"
                >
                  <Icon className="h-6 w-6 text-cyan-200" />
                  <h3 className="mt-5 text-xl font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-gray-400">
                    {feature.description}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {feature.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-center gap-3 text-sm text-gray-300"
                      >
                        <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-24 grid gap-4 md:grid-cols-3">
          {[
            ["Agencies", "Keep approvals, client feedback, and project status in one shared system."],
            ["Freelancers", "Give clients a polished review experience without building a custom portal."],
            ["Service teams", "Track deliverables, ownership, and client-visible progress across accounts."],
          ].map(([title, text]) => (
            <div
              key={title}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
            >
              <Users className="h-5 w-5 text-cyan-200" />
              <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">{text}</p>
            </div>
          ))}
        </div>

        <div id="architecture" className="mt-24 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-200">
                Engineering notes
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                Production-shaped, not tutorial-shaped.
              </h2>
              <p className="mt-4 text-sm leading-7 text-gray-400">
                ClientForge surfaces the boring correctness that matters in a SaaS:
                scoped tenancy, durable files, validated inputs, rate limits, tests,
                and clear operational boundaries.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {architectureItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-white/10 bg-black/10 p-5"
                  >
                    <Icon className="h-5 w-5 text-cyan-200" />
                    <h3 className="mt-4 text-base font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-24 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
          <Building2 className="mx-auto h-8 w-8 text-cyan-200" />
          <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white">
            Review the product as both the operator and the client.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-gray-400">
            Use the seeded demo to inspect RBAC, uploads, approvals, comments,
            notifications, analytics, and the scoped portal.
          </p>
          {!session ? (
            <div className="mx-auto mt-8 max-w-2xl">
              <DemoLoginButtons />
            </div>
          ) : (
            <Button asChild size="lg" className="mt-8 rounded-2xl">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
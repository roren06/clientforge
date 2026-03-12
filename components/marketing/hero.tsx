"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  const { data: session } = useSession();

  return (
    <section className="relative overflow-hidden">
      <div className="grid-pattern absolute inset-0 opacity-30" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-24">
        <div className="absolute right-0 top-8 flex items-center gap-4 text-sm">
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
        <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-300">
          <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
          Senior-level portfolio SaaS project
        </div>

        <div className="max-w-4xl">
          <h1 className="text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
            A premium client portal for agencies, freelancers, and modern teams.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-400">
            Manage clients, projects, deliverables, approvals, analytics, and AI-assisted
            updates in one polished workspace built for real-world workflows.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg" className="rounded-2xl">
            <Link href={session ? "/dashboard" : "/signup"}>
              {session ? "Enter dashboard" : "Get started"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <Link href="#features">Explore features</Link>
            </Button>
          </div>
        </div>

        <div id="features" className="mt-16 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <Workflow className="h-6 w-6 text-[var(--accent)]" />
            <h3 className="mt-4 text-lg font-medium text-white">Workflow-focused</h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Projects, approvals, and client collaboration in one clear system.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <ShieldCheck className="h-6 w-6 text-[var(--accent)]" />
            <h3 className="mt-4 text-lg font-medium text-white">Role-based access</h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Separate internal team workflows from the client-facing experience.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <Sparkles className="h-6 w-6 text-[var(--accent)]" />
            <h3 className="mt-4 text-lg font-medium text-white">AI with fallback</h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Useful AI summaries and drafting features that never block the product.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
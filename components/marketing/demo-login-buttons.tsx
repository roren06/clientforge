"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type DemoRole = "owner" | "client";

const demoAccounts: Record<
  DemoRole,
  {
    label: string;
    helper: string;
    email: string;
    password: string;
    destination: string;
  }
> = {
  owner: {
    label: "Explore as Owner",
    helper: "Dashboard, clients, projects, uploads, analytics",
    email: "demoacc@gmail.com",
    password: "password123",
    destination: "/dashboard",
  },
  client: {
    label: "Explore Client Portal",
    helper: "Scoped portal, deliverables, approvals",
    email: "client@clientforge.app",
    password: "client123",
    destination: "/portal",
  },
};

export function DemoLoginButtons({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<DemoRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loginAs(role: DemoRole) {
    const account = demoAccounts[role];

    setError(null);
    setLoadingRole(role);

    const result = await signIn("credentials", {
      email: account.email,
      password: account.password,
      redirect: false,
    });

    setLoadingRole(null);

    if (result?.error) {
      setError("Demo login failed. Run `npm run db:seed` and try again.");
      return;
    }

    router.push(account.destination);
    router.refresh();
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className={compact ? "grid gap-3" : "grid gap-3 sm:grid-cols-2"}>
        {(Object.keys(demoAccounts) as DemoRole[]).map((role) => {
          const account = demoAccounts[role];
          const loading = loadingRole === role;

          return (
            <button
              key={role}
              type="button"
              onClick={() => loginAs(role)}
              disabled={loadingRole !== null}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-cyan-300/40 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex items-center justify-between gap-3 text-sm font-semibold text-white">
                {loading ? "Signing in..." : account.label}
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-200" />
                ) : (
                  <ArrowRight className="h-4 w-4 text-cyan-200 transition group-hover:translate-x-0.5" />
                )}
              </span>
              <span className="mt-2 block text-xs leading-5 text-gray-400">
                {account.helper}
              </span>
            </button>
          );
        })}
      </div>

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}

      {!compact ? (
        <Button
          asChild
          variant="outline"
          size="lg"
          className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          <a href="/login">Use another account</a>
        </Button>
      ) : null}
    </div>
  );
}

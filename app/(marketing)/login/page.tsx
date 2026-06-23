"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DemoLoginButtons } from "@/components/marketing/demo-login-buttons";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    const roleResponse = await fetch("/api/me/workspace", {
      cache: "no-store",
    }).catch(() => null);
    const roleData = roleResponse?.ok ? await roleResponse.json() : null;
    const mustChangePassword = Boolean(roleData?.mustChangePassword);
    const destination =
      roleData?.role === "CLIENT"
        ? mustChangePassword
          ? "/portal/set-password"
          : "/portal"
        : "/dashboard";

    router.push(destination);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white">
        <h1 className="text-3xl font-semibold">Login</h1>
        <p className="mt-2 text-sm text-gray-400">
          Sign in to access your ClientForge workspace.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-gray-300">Email</label>
            <input
              type="email"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-300">Password</label>
            <input
              type="password"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-gray-400 underline hover:text-white"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-white text-black px-4 py-3 font-medium transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-gray-500">
          <span className="h-px flex-1 bg-white/10" />
          Demo
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <DemoLoginButtons compact />

        <p className="mt-6 text-sm text-gray-400">
          Don’t have an account?{" "}
          <a href="/signup" className="text-white underline">
            Create one
          </a>
        </p>
      </div>
    </main>
  );
}
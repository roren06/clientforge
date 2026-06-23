"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage(null);

    if (!token) {
      setError("This reset link is invalid.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        newPassword,
        confirmPassword,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to reset password.");
      if (data.issues?.[0]?.message) {
        setError(data.issues[0].message);
      }
      return;
    }

    setMessage(data.message || "Password reset successfully.");
  }

  if (!token) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
        This reset link is invalid. Request a new one from the forgot password
        page.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label className="mb-2 block text-sm text-gray-300">New password</label>
        <input
          type="password"
          required
          minLength={8}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <p className="mt-2 text-xs text-gray-500">Must be at least 8 characters.</p>
      </div>

      <div>
        <label className="mb-2 block text-sm text-gray-300">
          Confirm new password
        </label>
        <input
          type="password"
          required
          minLength={8}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {message}{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading || Boolean(message)}
        className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-black transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Resetting..." : "Reset password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white">
        <h1 className="text-3xl font-semibold">Reset password</h1>
        <p className="mt-2 text-sm text-gray-400">
          Choose a new password for your ClientForge account.
        </p>

        <Suspense
          fallback={
            <div className="mt-8 text-sm text-gray-400">Loading reset form...</div>
          }
        >
          <ResetPasswordForm />
        </Suspense>

        <p className="mt-6 text-sm text-gray-400">
          Need a new link?{" "}
          <Link href="/forgot-password" className="text-white underline">
            Request another reset
          </Link>
        </p>
      </div>
    </main>
  );
}

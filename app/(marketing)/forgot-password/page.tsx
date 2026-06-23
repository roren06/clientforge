"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to send reset link.");
      return;
    }

    setSubmitted(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white">
        <h1 className="text-3xl font-semibold">Forgot password</h1>

        {submitted ? (
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-sm text-emerald-100">
              <p className="font-medium text-emerald-50">Check your email</p>
              <p className="mt-2">
                If an account exists for{" "}
                <span className="font-medium text-white">{email}</span>, we sent
                a password reset link.
              </p>
              <p className="mt-2">
                Open the email and click{" "}
                <span className="font-medium text-white">Reset your password</span>{" "}
                to choose a new one. The link expires in one hour.
              </p>
            </div>

            <p className="text-sm text-gray-400">
              Didn&apos;t get it? Check spam, wait a minute, or try again with the
              same email.
            </p>

            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setError("");
              }}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
            >
              Send another link
            </button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-gray-400">
              Enter your email and we&apos;ll send a reset link if an account
              exists.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-gray-300">Email</label>
                <input
                  type="email"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-black transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-sm text-gray-400">
          Remember your password?{" "}
          <Link href="/login" className="text-white underline">
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}

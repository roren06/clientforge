"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { PageShell } from "@/components/layout/page-shell";

export default function PortalSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/me/workspace", { cache: "no-store" });

        if (!res.ok) {
          throw new Error("Failed to load account settings.");
        }

        const json = await res.json();
        setName(json.user?.name ?? "");
        setEmail(json.user?.email ?? "");
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function handleSaveProfile() {
    try {
      setSavingProfile(true);
      setProfileMessage(null);

      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to update profile.");
      }

      setProfileMessage("Profile updated successfully.");
      setName(json.user.name);
    } catch (error) {
      setProfileMessage(
        error instanceof Error ? error.message : "Failed to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    try {
      setSavingPassword(true);
      setPasswordMessage(null);

      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match.");
      }

      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.issues?.[0]?.message) {
          throw new Error(json.issues[0].message);
        }

        throw new Error(json.error || "Failed to update password.");
      }

      setPasswordMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordMessage(
        error instanceof Error ? error.message : "Failed to update password."
      );
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <PageShell
      title="Account settings"
      description="Update your profile and password for the client portal."
    >
      <div className="mb-4">
        <Link
          href="/portal"
          className="text-sm text-gray-400 underline hover:text-white"
        >
          Back to client portal
        </Link>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-gray-400">
          Loading account settings...
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-semibold text-white">Profile</h2>
            <p className="mt-1 text-sm text-gray-400">
              Update how your name appears in the portal.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-gray-300">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">Email</label>
                <input
                  value={email}
                  disabled
                  className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{profileMessage ?? " "}</p>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 disabled:opacity-60"
                >
                  {savingProfile ? "Saving..." : "Save profile"}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-semibold text-white">Change password</h2>
            <p className="mt-1 text-sm text-gray-400">
              Use your current password to set a new one.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Current password
                </label>
                <input
                  type="password"
                  name="portal-settings-current-password"
                  autoComplete="off"
                  readOnly
                  onFocus={(e) => e.target.removeAttribute("readOnly")}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  New password
                </label>
                <input
                  type="password"
                  name="portal-settings-new-password"
                  autoComplete="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Must be at least 8 characters.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Confirm new password
                </label>
                <input
                  type="password"
                  name="portal-settings-confirm-password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{passwordMessage ?? " "}</p>
                <button
                  onClick={handleChangePassword}
                  disabled={savingPassword}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 disabled:opacity-60"
                >
                  {savingPassword ? "Updating..." : "Update password"}
                </button>
              </div>
            </div>
          </section>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      )}
    </PageShell>
  );
}

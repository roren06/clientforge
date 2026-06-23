"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";

type SettingsData = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  } | null;
  role: string | null;
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [data, setData] = useState<SettingsData | null>(null);

  const [profileName, setProfileName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [workspaceMessage, setWorkspaceMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  async function loadSettings() {
    try {
      setLoading(true);

      const res = await fetch("/api/me/workspace", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load settings.");
      }

      const json = await res.json();

      const nextData: SettingsData = {
        user: json.user,
        workspace: json.workspace,
        role: json.role,
      };

      setData(nextData);
      setProfileName(nextData.user.name ?? "");
      setWorkspaceName(nextData.workspace?.name ?? "");
      setWorkspaceDescription(nextData.workspace?.description ?? "");
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    try {
      setSavingProfile(true);
      setProfileMessage(null);

      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profileName,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to update profile.");
      }

      setProfileMessage("Profile updated successfully.");

      setData((prev) =>
        prev
          ? {
              ...prev,
              user: {
                ...prev.user,
                name: json.user.name,
              },
            }
          : prev
      );
    } catch (error) {
      console.error(error);
      setProfileMessage(
        error instanceof Error ? error.message : "Failed to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveWorkspace() {
    try {
      setSavingWorkspace(true);
      setWorkspaceMessage(null);

      const res = await fetch("/api/settings/workspace", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: workspaceName,
          description: workspaceDescription,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to update workspace.");
      }

      setWorkspaceMessage("Workspace updated successfully.");

      setData((prev) =>
        prev
          ? {
              ...prev,
              workspace: prev.workspace
                ? {
                    ...prev.workspace,
                    name: json.workspace.name,
                    description: json.workspace.description,
                    slug: json.workspace.slug,
                  }
                : null,
            }
          : prev
      );
    } catch (error) {
      console.error(error);
      setWorkspaceMessage(
        error instanceof Error ? error.message : "Failed to update workspace."
      );
    } finally {
      setSavingWorkspace(false);
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
        headers: {
          "Content-Type": "application/json",
        },
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
      console.error(error);
      setPasswordMessage(
        error instanceof Error ? error.message : "Failed to update password."
      );
    } finally {
      setSavingPassword(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (data?.role === "CLIENT") {
      router.replace("/portal/settings");
    }
  }, [data?.role, router]);

  const canEditWorkspace =
    data?.role === "OWNER" || data?.role === "ADMIN";

  return (
    <PageShell
  title="Settings"
  description="Manage your profile, password, and workspace preferences."
>
  {loading || !data ? (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-gray-400">
      Loading settings...
    </div>
  ) : (
    <div className="space-y-6">

      {/* 🔹 Identity Header */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-white">
            {data.user.name}
          </p>
          <p className="text-sm text-gray-400">
            {data.user.email}
          </p>

          {data.workspace && (
            <p className="mt-2 text-xs uppercase tracking-wide text-gray-500">
              {data.workspace.name} · {data.role}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-gray-300">
          Workspace Active
        </div>
      </div>

      <section className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.04] p-6">
          <h2 className="text-lg font-semibold text-white">Change Password</h2>
          <p className="mt-1 text-sm text-gray-400">
            Update your account password. You&apos;ll need your current password.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                New password
              </label>
              <input
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
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
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-400">{passwordMessage ?? " "}</p>

            <button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 disabled:opacity-60"
            >
              {savingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </section>

      {/* 🔹 Main Grid */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* 🟦 Profile (Primary) */}
        <section className="xl:col-span-2 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-lg font-semibold text-white">
            Profile Settings
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Update your personal profile details.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm text-gray-300">Name</label>
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">Email</label>
              <input
                value={data.user.email}
                disabled
                className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                {profileMessage ?? " "}
              </p>

              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 disabled:opacity-60"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </section>

        {/* 🟨 Workspace (Secondary Card) */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-white">
            Workspace
          </h2>

          <div className="mt-4 space-y-4 text-sm text-gray-300">
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="text-white">{workspaceName}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Slug</p>
              <p className="text-gray-400">{data.workspace?.slug}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Description</p>
              <p className="text-gray-400">
                {workspaceDescription || "No description"}
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* 🔹 Editable Workspace Panel */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">
          Edit Workspace
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            disabled={!canEditWorkspace}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            placeholder="Workspace name"
          />

          <input
            value={data.workspace?.slug ?? ""}
            disabled
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-500"
          />
        </div>

        <textarea
          value={workspaceDescription}
          onChange={(e) => setWorkspaceDescription(e.target.value)}
          disabled={!canEditWorkspace}
          rows={4}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          placeholder="Workspace description"
        />

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {workspaceMessage ??
              (canEditWorkspace
                ? " "
                : "Only owners/admins can edit workspace")}
          </p>

          <button
            onClick={handleSaveWorkspace}
            disabled={!canEditWorkspace || savingWorkspace}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 disabled:opacity-60"
          >
            {savingWorkspace ? "Saving..." : "Save Workspace"}
          </button>
        </div>
      </section>

    </div>
  )}
</PageShell>
  );
}
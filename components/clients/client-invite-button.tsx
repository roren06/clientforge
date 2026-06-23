"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type InviteResponse = {
  message?: string;
  error?: string;
  email?: string;
  temporaryPassword?: string | null;
  status?: string;
};

type ClientInviteButtonProps = {
  clientId: string;
  clientEmail: string | null;
  hasPortalAccess: boolean;
};

export function ClientInviteButton({
  clientId,
  clientEmail,
  hasPortalAccess,
}: ClientInviteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<InviteResponse | null>(null);

  async function handleInvite() {
    try {
      setLoading(true);
      setInvite(null);

      const res = await fetch(`/api/clients/${clientId}/invite`, {
        method: "POST",
      });
      const data: InviteResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to invite client.");
      }

      setInvite(data);
      router.refresh();
    } catch (error) {
      setInvite({
        error:
          error instanceof Error ? error.message : "Failed to invite client.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Portal Access
          </p>
          <p className="mt-2 text-sm font-medium text-white">
            {hasPortalAccess ? "Active" : clientEmail ? "Not invited" : "Email needed"}
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-400">
            {hasPortalAccess
              ? "This client can sign in and only see their linked projects."
              : clientEmail
              ? "Create a client portal account linked to this client record."
              : "Add a client email before creating portal access."}
          </p>
        </div>

        <button
          type="button"
          disabled={loading || !clientEmail}
          onClick={handleInvite}
          className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Inviting..."
            : hasPortalAccess
            ? "Refresh access"
            : "Invite client"}
        </button>
      </div>

      {invite?.error ? (
        <p className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-xs leading-5 text-rose-100">
          {invite.error}
        </p>
      ) : null}

      {invite && !invite.error ? (
        <div className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-xs leading-5 text-emerald-50">
          <p>{invite.message ?? "Client portal access updated."}</p>
          {invite.email ? <p className="mt-1">Email: {invite.email}</p> : null}
          {invite.temporaryPassword ? (
            <p className="mt-1">
              Temporary password:{" "}
              <span className="font-semibold">{invite.temporaryPassword}</span>
            </p>
          ) : null}
          {invite.temporaryPassword ? (
            <p className="mt-1 text-emerald-100/80">
              Share this securely. The client must change it on first login.
            </p>
          ) : invite.message?.includes("already active") ? (
            <p className="mt-1 text-emerald-100/80">
              No new password was generated for an existing account.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

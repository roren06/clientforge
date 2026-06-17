"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const statusOptions = [
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "REVISION_REQUESTED",
] as const;

export function DeliverableStatusActions({
  deliverableId,
  currentStatus,
}: {
  deliverableId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  async function updateStatus(status: string) {
    setLoading(true);
    setMessage(null);
    setMessageType(null);

    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update deliverable.");
      }

      setMessage(`Status updated to ${status}.`);
      setMessageType("success");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update deliverable status."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((status) => {
          const active = currentStatus === status;

          return (
            <button
              key={status}
              type="button"
              data-testid={`deliverable-status-${deliverableId}-${status}`}
              disabled={loading || active}
              onClick={() => updateStatus(status)}
              className={`rounded-xl border px-3 py-1.5 text-xs transition ${
                active
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {loading && !active ? "Updating..." : status}
            </button>
          );
        })}
      </div>

      {message ? (
        <p
          className={`text-xs ${
            messageType === "success" ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
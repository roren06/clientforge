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

  async function updateStatus(status: string) {
    setLoading(true);

    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error("Failed to update deliverable");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to update deliverable status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {statusOptions.map((status) => {
        const active = currentStatus === status;

        return (
          <button
            key={status}
            type="button"
            disabled={loading || active}
            onClick={() => updateStatus(status)}
            className={`rounded-xl border px-3 py-1.5 text-xs transition ${
              active
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
            } disabled:opacity-50`}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
}
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ClientDeliverableActions({
  deliverableId,
  currentStatus,
}: {
  deliverableId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: "APPROVED" | "REVISION_REQUESTED") {
    setLoading(true);

    try {
      const res = await fetch(`/api/client/deliverables/${deliverableId}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const raw = await res.text();

      let data: { error?: string } | null = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(
          data?.error || `Failed to update deliverable (status ${res.status})`
        );
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to submit review action."
      );
    } finally {
      setLoading(false);
    }
  }

  const isFinal =
    currentStatus === "APPROVED" || currentStatus === "REVISION_REQUESTED";
  const canReview = currentStatus === "IN_REVIEW";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid={`client-review-${deliverableId}-APPROVED`}
          disabled={loading || !canReview}
          onClick={() => updateStatus("APPROVED")}
          className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Approve"}
        </button>

        <button
          type="button"
          data-testid={`client-review-${deliverableId}-REVISION_REQUESTED`}
          disabled={loading || !canReview}
          onClick={() => updateStatus("REVISION_REQUESTED")}
          className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Request changes
        </button>
      </div>

      <p className="text-xs text-gray-500">
        {canReview
          ? "Your decision will notify the workspace team."
          : isFinal
          ? "Review decision has already been recorded."
          : "This deliverable is not ready for client review yet."}
      </p>
    </div>
  );
}
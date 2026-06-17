"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProjectCompleteActionProps = {
  projectId: string;
  currentStatus: string;
  currentProgress: number;
};

export function ProjectCompleteAction({
  projectId,
  currentStatus,
  currentProgress,
}: ProjectCompleteActionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );
  const isCompleted = currentStatus === "COMPLETED" && currentProgress === 100;

  async function markCompleted() {
    try {
      setLoading(true);
      setMessage(null);
      setMessageType(null);

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "COMPLETED",
          progress: 100,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to complete project.");
      }

      setMessage("Project marked completed.");
      setMessageType("success");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to complete project."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white">Project Completion</p>
          <p className="mt-1 text-xs leading-5 text-gray-400">
            Mark this project finished when all deliverables are wrapped.
          </p>
        </div>

        <button
          type="button"
          onClick={markCompleted}
          disabled={loading || isCompleted}
          className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCompleted
            ? "Completed"
            : loading
            ? "Completing..."
            : "Mark completed"}
        </button>
      </div>

      {message ? (
        <p
          className={`mt-3 text-xs ${
            messageType === "success" ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

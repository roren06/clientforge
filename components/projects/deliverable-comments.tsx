"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type DeliverableCommentsResponse = {
  comments: CommentItem[];
  total: number;
};

type DeliverableCommentsProps = {
  deliverableId: string;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

export function DeliverableComments({
  deliverableId,
}: DeliverableCommentsProps) {
  const router = useRouter();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/deliverables/${deliverableId}/comments`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load comments.");
      }

      const data: DeliverableCommentsResponse = await res.json();
      setComments(data.comments ?? []);
    } catch (error) {
      console.error("Failed to load comments:", error);
      setMessage("Failed to load comments.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, [deliverableId]);

  async function handleSubmit() {
    try {
      const trimmed = body.trim();

      if (!trimmed) {
        setMessage("Comment cannot be empty.");
        setMessageType("error");
        return;
      }

      setSubmitting(true);
      setMessage(null);
      setMessageType(null);

      const res = await fetch(`/api/deliverables/${deliverableId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: trimmed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add comment.");
      }

      setBody("");
      setMessage("Comment added successfully.");
      setMessageType("success");
      await loadComments();
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to add comment."
      );
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div>
        <p className="text-sm font-medium text-white">Comments</p>
        <p className="mt-1 text-xs text-gray-400">
          Discuss feedback, changes, and review notes for this deliverable.
        </p>
      </div>

      <div className="space-y-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Write a comment..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500"
        />

        <div className="flex items-center justify-between gap-3">
          <p
            className={`text-xs ${
              messageType === "success"
                ? "text-emerald-300"
                : messageType === "error"
                ? "text-rose-300"
                : "text-gray-400"
            }`}
          >
            {message ?? " "}
          </p>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Posting..." : "Add Comment"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-gray-400">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3 text-sm text-gray-400">
            No comments yet.
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">
                  {comment.user.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDateTime(comment.createdAt)}
                </p>
              </div>

              <p className="mt-2 text-sm leading-6 text-gray-300">
                {comment.body}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

type CreateDeliverableResponse = {
  message?: string;
  error?: string;
};

const initialForm = {
  title: "",
  type: "DOC",
  status: "DRAFT",
  notes: "",
};

export function AddDeliverableForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage(null);
      setMessageType(null);

      const res = await fetch(`/api/projects/${projectId}/deliverables`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data: CreateDeliverableResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create deliverable.");
      }

      setForm(initialForm);
      setMessage(data.message ?? "Deliverable created successfully.");
      setMessageType("success");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to create deliverable."
      );
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white">Create Deliverable</p>
          <p className="mt-1 text-sm text-gray-400">
            Add work items to this project, then upload files and move them into
            client review.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/15"
        >
          {open ? "Close form" : "Add deliverable"}
        </button>
      </div>

      {open ? (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="Title">
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                required
                maxLength={160}
                placeholder="Homepage mockup"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500"
              />
            </FormField>

            <FormField label="Type">
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, type: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="DOC" className="bg-slate-950">
                  Document
                </option>
                <option value="PDF" className="bg-slate-950">
                  PDF
                </option>
                <option value="FIGMA" className="bg-slate-950">
                  Figma
                </option>
                <option value="IMAGE" className="bg-slate-950">
                  Image
                </option>
                <option value="VIDEO" className="bg-slate-950">
                  Video
                </option>
                <option value="OTHER" className="bg-slate-950">
                  Other
                </option>
              </select>
            </FormField>

            <FormField label="Initial status">
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="DRAFT" className="bg-slate-950">
                  Draft
                </option>
                <option value="IN_REVIEW" className="bg-slate-950">
                  In Review
                </option>
                <option value="APPROVED" className="bg-slate-950">
                  Approved
                </option>
                <option value="REVISION_REQUESTED" className="bg-slate-950">
                  Revision Requested
                </option>
              </select>
            </FormField>
          </div>

          <FormField label="Notes">
            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              maxLength={1000}
              rows={4}
              placeholder="What should the client review?"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500"
            />
          </FormField>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p
              className={`text-sm ${
                messageType === "success"
                  ? "text-emerald-300"
                  : messageType === "error"
                  ? "text-rose-300"
                  : "text-gray-500"
              }`}
            >
              {message ?? " "}
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create deliverable"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-gray-300">{label}</span>
      {children}
    </label>
  );
}

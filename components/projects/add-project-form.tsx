"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

type ClientOption = {
  id: string;
  name: string;
  company: string | null;
};

type CreateProjectResponse = {
  message?: string;
  error?: string;
};

const initialForm = {
  clientId: "",
  title: "",
  description: "",
  status: "ACTIVE",
  progress: 0,
  deadline: "",
};

export function AddProjectForm({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    ...initialForm,
    clientId: clients[0]?.id ?? "",
  });
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

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data: CreateProjectResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create project.");
      }

      setForm({
        ...initialForm,
        clientId: clients[0]?.id ?? "",
      });
      setMessage(data.message ?? "Project created successfully.");
      setMessageType("success");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to create project."
      );
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-lg font-semibold text-white">Create Project</p>
          <p className="mt-1 max-w-2xl text-sm text-gray-400">
            Attach work to an existing client so it appears in the project list
            and, once shared, in that client&apos;s portal.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          disabled={clients.length === 0}
          className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {open ? "Close form" : "Create project"}
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-gray-400">
          Add a client before creating a project.
        </div>
      ) : null}

      {open && clients.length > 0 ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Client">
              <select
                value={form.clientId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, clientId: event.target.value }))
                }
                required
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              >
                {clients.map((client) => (
                  <option
                    key={client.id}
                    value={client.id}
                    className="bg-slate-950"
                  >
                    {client.name}
                    {client.company ? ` · ${client.company}` : ""}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Project title">
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                required
                maxLength={160}
                placeholder="Website redesign"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500"
              />
            </FormField>

            <FormField label="Status">
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="PLANNING" className="bg-slate-950">
                  Planning
                </option>
                <option value="ACTIVE" className="bg-slate-950">
                  Active
                </option>
                <option value="REVIEW" className="bg-slate-950">
                  Review
                </option>
                <option value="COMPLETED" className="bg-slate-950">
                  Completed
                </option>
              </select>
            </FormField>

            <FormField label="Deadline">
              <input
                type="date"
                value={form.deadline}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, deadline: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              />
            </FormField>
          </div>

          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              maxLength={1200}
              rows={4}
              placeholder="Scope, goals, and delivery context..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500"
            />
          </FormField>

          <FormField label={`Progress (${form.progress}%)`}>
            <input
              type="range"
              min={0}
              max={100}
              value={form.progress}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  progress: Number(event.target.value),
                }))
              }
              className="w-full accent-cyan-300"
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
              {submitting ? "Creating..." : "Create project"}
            </button>
          </div>
        </form>
      ) : null}
    </section>
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

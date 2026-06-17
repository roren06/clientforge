"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { FormEvent, useState } from "react";

type CreateClientResponse = {
  message?: string;
  error?: string;
};

const initialForm = {
  name: "",
  email: "",
  company: "",
  status: "ACTIVE",
  notes: "",
};

export function AddClientForm() {
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

      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data: CreateClientResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create client.");
      }

      setForm(initialForm);
      setMessage(data.message ?? "Client created successfully.");
      setMessageType("success");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to create client."
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
          <p className="text-lg font-semibold text-white">Add Client</p>
          <p className="mt-1 max-w-2xl text-sm text-gray-400">
            Create a client record first, then invite them to portal access from
            their client card.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15"
        >
          {open ? "Close form" : "Add client"}
        </button>
      </div>

      {open ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Client name">
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
                maxLength={120}
                placeholder="Northstar Labs"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500"
              />
            </FormField>

            <FormField label="Client email">
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                required
                maxLength={160}
                placeholder="client@example.com"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500"
              />
            </FormField>

            <FormField label="Company">
              <input
                value={form.company}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, company: event.target.value }))
                }
                maxLength={120}
                placeholder="Acme Studio"
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
                <option value="ACTIVE" className="bg-slate-950">
                  Active
                </option>
                <option value="PENDING" className="bg-slate-950">
                  Pending
                </option>
                <option value="LEAD" className="bg-slate-950">
                  Lead
                </option>
                <option value="INACTIVE" className="bg-slate-950">
                  Inactive
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
              placeholder="Context, scope, or relationship notes..."
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
              {submitting ? "Creating..." : "Create client"}
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

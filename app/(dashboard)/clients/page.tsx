import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddClientForm } from "@/components/clients/add-client-form";
import { ClientInviteButton } from "@/components/clients/client-invite-button";
import { requireInternalAccess } from "@/lib/guards";
import { cookies } from "next/headers";

type Client = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  status: string;
  notes: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
};

async function getClients(): Promise<{ clients: Client[]; total: number }> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const cookieHeader = (await cookies()).toString();

  const res = await fetch(`${baseUrl}/api/clients`, {
    cache: "no-store",
    headers: {
      Cookie: cookieHeader,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch clients");
  }

  return res.json();
}

function getClientStatusClasses(status: string) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "INACTIVE":
      return "border-white/10 bg-white/5 text-gray-300";
    case "PENDING":
      return "border-amber-400/20 bg-amber-400/10 text-amber-200";
    default:
      return "border-white/10 bg-white/5 text-gray-300";
  }
}

export default async function ClientsPage() {
  await requireInternalAccess();

  const { clients, total } = await getClients();

  const activeClients = clients.filter((client) => client.status === "ACTIVE").length;
  const withCompany = clients.filter((client) => client.company).length;
  const portalActive = clients.filter((client) => client.userId).length;

  return (
    <PageShell
      title="Clients"
      description="Manage external clients inside your workspace using real database data."
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-lg font-semibold text-white">
                Client Directory
              </p>
              <p className="mt-1 max-w-2xl text-sm text-gray-400">
                View, track, and manage the clients connected to your workspace.
                Keep contact details, company identity, and notes organized in one place.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryPill label="Total" value={String(total)} />
              <SummaryPill label="Active" value={String(activeClients)} />
              <SummaryPill label="Companies" value={String(withCompany)} />
              <SummaryPill label="Portal Active" value={String(portalActive)} />
            </div>
          </div>
        </section>

        <AddClientForm />

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Total Clients"
            value={total}
            helper="All client records in the current workspace"
          />
          <MetricCard
            label="Active Clients"
            value={activeClients}
            helper="Clients currently marked as active"
          />
          <MetricCard
            label="Portal Access"
            value={`${total === 0 ? 0 : Math.round((portalActive / total) * 100)}%`}
            helper="Client records linked to portal users"
          />
        </section>

        {clients.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-medium text-white">No clients yet</p>
            <p className="mt-1 text-sm text-gray-400">
              Add your first client to start organizing projects, deliverables,
              and collaboration workflows.
            </p>
          </div>
        ) : (
          <section className="grid gap-4 xl:grid-cols-2">
            {clients.map((client) => (
              <Card
                key={client.id}
                className="rounded-3xl border-white/10 bg-white/[0.03] text-white"
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <p className="mt-1 text-sm text-gray-400">
                        {client.company || "No company name provided"}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getClientStatusClasses(
                        client.status
                      )}`}
                    >
                      {client.status}
                    </span>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${
                      client.userId
                        ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                        : "border-amber-300/20 bg-amber-300/10 text-amber-100"
                    }`}
                  >
                    {client.userId ? "Portal active" : "Not invited"}
                  </span>
                </CardHeader>

                <CardContent className="space-y-4 text-sm text-gray-400">
                  <div className="grid gap-3 md:grid-cols-2">
                    <InfoTile
                      label="Email"
                      value={client.email || "No email provided"}
                    />
                    <InfoTile
                      label="Created"
                      value={new Date(client.createdAt).toLocaleDateString()}
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Notes
                    </p>
                    <p className="mt-2 text-sm leading-6 text-gray-300">
                      {client.notes || "No notes added for this client yet."}
                    </p>
                  </div>

                  <ClientInviteButton
                    clientId={client.id}
                    clientEmail={client.email}
                    hasPortalAccess={Boolean(client.userId)}
                  />
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </div>
    </PageShell>
  );
}

function SummaryPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-xs text-gray-500">{helper}</p>
    </div>
  );
}

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-sm text-gray-300">{value}</p>
    </div>
  );
}
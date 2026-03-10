import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Client = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

async function getClients(): Promise<{ clients: Client[]; total: number }> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/clients`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch clients");
  }

  return res.json();
}

export default async function ClientsPage() {
  const { clients, total } = await getClients();

  return (
    <PageShell
      title="Clients"
      description="Manage external clients inside your workspace using real database data."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-white/10 bg-white/[0.03] text-white">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{total}</div>
            <p className="mt-2 text-xs text-gray-400">
              Pulled live from the database
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {clients.map((client) => (
          <Card
            key={client.id}
            className="rounded-3xl border-white/10 bg-white/[0.03] text-white"
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>{client.name}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
                  {client.status}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm text-gray-400">
              <p>
                <span className="text-white">Company:</span>{" "}
                {client.company || "—"}
              </p>
              <p>
                <span className="text-white">Email:</span>{" "}
                {client.email || "—"}
              </p>
              <p>
                <span className="text-white">Notes:</span>{" "}
                {client.notes || "—"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
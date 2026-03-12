import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInternalAccess } from "@/lib/guards";
import { DeliverableStatusActions } from "@/components/projects/deliverable-status-actions";

type ProjectDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  deadline: string | null;
  createdAt: string;
  client: {
    id: string;
    name: string;
    company: string | null;
    email: string;
  };
};

type Deliverable = {
  id: string;
  title: string;
  type: string;
  status: string;
  notes: string | null;
  createdAt: string;
};

async function getProject(id: string): Promise<ProjectDetail | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/projects/${id}`, {
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch project");

  return res.json();
}

async function getDeliverables(
  id: string
): Promise<{ deliverables: Deliverable[]; total: number }> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/projects/${id}/deliverables`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch deliverables");

  return res.json();
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  await requireInternalAccess();

  const { id } = await params;

  const [project, deliverablesData] = await Promise.all([
    getProject(id),
    getDeliverables(id),
  ]);

  if (!project) {
    notFound();
  }

  const { deliverables, total } = deliverablesData;

  return (
    <PageShell
      title={project.title}
      description="Project detail view powered by live relational database data."
    >
      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-3xl border-white/10 bg-white/[0.03] text-white xl:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-300">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Description</p>
              <p className="mt-2 leading-7 text-gray-300">
                {project.description || "No description yet."}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Status</p>
                <p className="mt-2 text-base font-medium text-white">{project.status}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Progress</p>
                <p className="mt-2 text-base font-medium text-white">{project.progress}%</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Deadline</p>
                <p className="mt-2 text-base font-medium text-white">
                  {project.deadline
                    ? new Date(project.deadline).toLocaleDateString()
                    : "No deadline"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Created</p>
                <p className="mt-2 text-base font-medium text-white">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.03] text-white">
          <CardHeader>
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-300">
            <div>
              <p className="text-lg font-medium text-white">{project.client.name}</p>
              <p className="mt-1 text-gray-400">{project.client.company || "No company name"}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">Contact Email</p>
              <p className="mt-2 text-sm text-white">{project.client.email}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4">
        <Card className="rounded-3xl border-white/10 bg-white/[0.03] text-white">
          <CardHeader>
            <CardTitle>Deliverables ({total})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deliverables.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-gray-400">
                No deliverables yet for this project.
              </div>
            ) : (
              deliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-medium text-white">
                      {deliverable.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      Type: {deliverable.type} · Status: {deliverable.status}
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                    {deliverable.status}
                  </span>
                </div>

                <div className="mt-3">
                  <DeliverableStatusActions
                    deliverableId={deliverable.id}
                    currentStatus={deliverable.status}
                  />
                </div>

                <p className="mt-3 text-sm leading-6 text-gray-400">
                  {deliverable.notes || "No notes provided."}
                </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
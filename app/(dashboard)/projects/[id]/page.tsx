import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

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
    </PageShell>
  );
}
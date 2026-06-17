import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInternalAccess } from "@/lib/guards";
import { DeliverableStatusActions } from "@/components/projects/deliverable-status-actions";
import { AddDeliverableForm } from "@/components/projects/add-deliverable-form";
import { ProjectCompleteAction } from "@/components/projects/project-complete-action";
import { prisma } from "@/lib/prisma";
import { generateProjectSummary } from "@/lib/ai/project-summary";
import { DeliverableFileUpload } from "@/components/projects/deliverable-file-upload";
import { DeliverableComments } from "@/components/projects/deliverable-comments";
import { cookies } from "next/headers";

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

  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
};

type ActivityItem = {
  id: string;
  message: string;
  createdAt: Date;
  user?: {
    name?: string | null;
  } | null;
};

async function getProject(id: string): Promise<ProjectDetail | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const cookieHeader = (await cookies()).toString();

  const res = await fetch(`${baseUrl}/api/projects/${id}`, {
    cache: "no-store",
    headers: {
      Cookie: cookieHeader,
    },
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
  const cookieHeader = (await cookies()).toString();

  const res = await fetch(`${baseUrl}/api/projects/${id}/deliverables`, {
    cache: "no-store",
    headers: {
      Cookie: cookieHeader,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch deliverables");

  return res.json();
}

async function getActivity(projectId: string): Promise<ActivityItem[]> {
  return prisma.activityLog.findMany({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  await requireInternalAccess();

  const { id } = await params;

  const [project, deliverablesData, activity] = await Promise.all([
  getProject(id),
  getDeliverables(id),
  getActivity(id),
]);

  if (!project) {
    notFound();
  }

  const { deliverables, total } = deliverablesData;

  const aiSummary = await generateProjectSummary(project, deliverables, activity);

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

            <ProjectCompleteAction
              projectId={project.id}
              currentStatus={project.status}
              currentProgress={project.progress}
            />
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
  <Card className="rounded-3xl border-cyan-400/20 bg-cyan-400/[0.04] text-white">
    <CardHeader>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle>AI Project Summary</CardTitle>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
          {aiSummary.source === "ai" ? "AI generated" : "Fallback summary"}
        </span>
      </div>
    </CardHeader>

    <CardContent className="space-y-4">
      <p className="text-sm leading-7 text-gray-200">
        {aiSummary.summary}
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        {aiSummary.highlights.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-300"
          >
            {item}
          </div>
        ))}
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
            <AddDeliverableForm projectId={project.id} />

            {deliverables.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-gray-400">
                No deliverables yet for this project.
              </div>
            ) : (
              deliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  data-testid={`deliverable-card-${deliverable.id}`}
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

                <div className="mt-3">
                  <DeliverableFileUpload
                    deliverableId={deliverable.id}
                    existingFileUrl={deliverable.fileUrl}
                    existingFileName={deliverable.fileName}
                  />
                </div>

                <p className="mt-3 text-sm leading-6 text-gray-400">
                  {deliverable.notes || "No notes provided."}
                </p>

                <div className="mt-4">
                  <DeliverableComments deliverableId={deliverable.id} />
                </div>

                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
      <section className="mt-4">
  <Card className="rounded-3xl border-white/10 bg-white/[0.03] text-white">
    <CardHeader>
      <CardTitle>Activity</CardTitle>
    </CardHeader>

    <CardContent className="space-y-3">
      {activity.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-gray-400">
          No activity yet.
        </div>
      ) : (
        activity.map((item: ActivityItem) => (
          <div
            key={item.id}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
          >
            <p className="text-sm text-white">
              {item.message}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              {item.user?.name ?? "System"} ·{" "}
              {new Date(item.createdAt).toLocaleString()}
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
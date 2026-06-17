import { PageShell } from "@/components/layout/page-shell";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppBaseUrl } from "@/lib/app-url";
import { requireInternalAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

type DashboardResponse = {
  stats: {
    clientsCount: number;
    totalProjects: number;
    activeProjects: number;
    reviewProjects: number;
    averageProgress: number;
  };
  recentActivity: {
    id: string;
    title: string;
    clientName: string;
    status: string;
    progress: number;
    createdAt: string;
  }[];
};

type AnalyticsOverview = {
  activeProjects: number;
  projectsInReview: number;
  plannedProjects: number;
  completedProjects: number;
  totalClients: number;
  averageProgress: number;
  deliverablesInReview: number;
  deliverablesApproved: number;
  deliverablesRevisionRequested: number;
  totalActivityLast7Days: number;
};

async function getDashboardData(): Promise<DashboardResponse> {
  const baseUrl = getAppBaseUrl();
  const cookieHeader = (await cookies()).toString();

  const res = await fetch(`${baseUrl}/api/dashboard`, {
    cache: "no-store",
    headers: {
      Cookie: cookieHeader,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return res.json();
}

async function getAnalyticsOverview(workspaceId: string): Promise<AnalyticsOverview> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    activeProjects,
    projectsInReview,
    plannedProjects,
    completedProjects,
    totalClients,
    averageProgressAggregate,
    deliverablesInReview,
    deliverablesApproved,
    deliverablesRevisionRequested,
    totalActivityLast7Days,
  ] = await Promise.all([
    prisma.project.count({
      where: {
        workspaceId,
        status: "ACTIVE",
      },
    }),

    prisma.project.count({
      where: {
        workspaceId,
        status: "REVIEW",
      },
    }),

    prisma.project.count({
      where: {
        workspaceId,
        status: "PLANNING",
      },
    }),

    prisma.project.count({
      where: {
        workspaceId,
        status: "COMPLETED",
      },
    }),

    prisma.client.count({
      where: {
        workspaceId,
      },
    }),

    prisma.project.aggregate({
      where: {
        workspaceId,
      },
      _avg: {
        progress: true,
      },
    }),

    prisma.deliverable.count({
      where: {
        project: {
          workspaceId,
        },
        status: "IN_REVIEW",
      },
    }),

    prisma.deliverable.count({
      where: {
        project: {
          workspaceId,
        },
        status: "APPROVED",
      },
    }),

    prisma.deliverable.count({
      where: {
        project: {
          workspaceId,
        },
        status: "REVISION_REQUESTED",
      },
    }),

    prisma.activityLog.count({
      where: {
        workspaceId,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    }),
  ]);

  return {
    activeProjects,
    projectsInReview,
    plannedProjects,
    completedProjects,
    totalClients,
    averageProgress: Math.round(averageProgressAggregate._avg.progress ?? 0),
    deliverablesInReview,
    deliverablesApproved,
    deliverablesRevisionRequested,
    totalActivityLast7Days,
  };
}

export default async function DashboardPage() {
  const result = await requireInternalAccess();

  const [{ stats, recentActivity }, analytics] = await Promise.all([
    getDashboardData(),
    getAnalyticsOverview(result.workspace.id),
  ]);

  return (
    <PageShell
      title="Dashboard"
      description="Monitor client work, project health, and workspace activity using real database data."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active Projects"
          value={String(analytics.activeProjects)}
          helper={`${stats.totalProjects} total projects`}
        />
        <StatCard
          label="Projects in Review"
          value={String(analytics.projectsInReview)}
          helper="Awaiting approval or final feedback"
        />
        <StatCard
          label="Clients"
          value={String(analytics.totalClients)}
          helper="Live count from your workspace"
        />
        <StatCard
          label="Average Progress"
          value={`${analytics.averageProgress}%`}
          helper="Based on all current projects"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-3xl border-white/10 bg-white/[0.03] text-white xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Project Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-400">
            {recentActivity.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-white">No recent activity yet</p>
                <p className="mt-1">
                  Create projects to start populating the dashboard.
                </p>
              </div>
            ) : (
              recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <p className="text-white">{item.title}</p>
                  <p className="mt-1">
                    Client: {item.clientName} · Status: {item.status} · Progress:{" "}
                    {item.progress}%
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.03] text-white">
          <CardHeader>
            <CardTitle>Workspace Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-400">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="font-medium text-white">
                {analytics.activeProjects > 0
                  ? "Projects are moving"
                  : "No active projects yet"}
              </p>
              <p className="mt-1">
                {analytics.activeProjects > 0
                  ? `${analytics.activeProjects} active project(s) currently in progress.`
                  : "Seed or create projects to activate the workspace."}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
              <p className="font-medium text-white">
                {analytics.projectsInReview > 0
                  ? `${analytics.projectsInReview} project(s) in review`
                  : "No projects waiting for review"}
              </p>
              <p className="mt-1">
                {analytics.projectsInReview > 0
                  ? "These may need approval or client feedback soon."
                  : "Review queue is currently clear."}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
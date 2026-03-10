import { PageShell } from "@/components/layout/page-shell";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

async function getDashboardData(): Promise<DashboardResponse> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/dashboard`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return res.json();
}

export default async function DashboardPage() {
  const { stats, recentActivity } = await getDashboardData();

  return (
    <PageShell
      title="Dashboard"
      description="Monitor client work, project health, and workspace activity using real database data."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active Projects"
          value={String(stats.activeProjects)}
          helper={`${stats.totalProjects} total projects`}
        />
        <StatCard
          label="Projects in Review"
          value={String(stats.reviewProjects)}
          helper="Awaiting approval or final feedback"
        />
        <StatCard
          label="Clients"
          value={String(stats.clientsCount)}
          helper="Live count from your workspace"
        />
        <StatCard
          label="Average Progress"
          value={`${stats.averageProgress}%`}
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
                <p className="mt-1">Create projects to start populating the dashboard.</p>
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
                {stats.activeProjects > 0
                  ? "Projects are moving"
                  : "No active projects yet"}
              </p>
              <p className="mt-1">
                {stats.activeProjects > 0
                  ? `${stats.activeProjects} active project(s) currently in progress.`
                  : "Seed or create projects to activate the workspace."}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
              <p className="font-medium text-white">
                {stats.reviewProjects > 0
                  ? `${stats.reviewProjects} project(s) in review`
                  : "No projects waiting for review"}
              </p>
              <p className="mt-1">
                {stats.reviewProjects > 0
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
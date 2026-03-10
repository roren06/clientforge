import { PageShell } from "@/components/layout/page-shell";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      description="Monitor client work, project health, approvals, and overall workspace activity from a single premium control center."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Projects" value="12" helper="+2 from last week" />
        <StatCard label="Pending Approvals" value="5" helper="2 require follow-up today" />
        <StatCard label="Clients" value="18" helper="3 recently onboarded" />
        <StatCard label="Completion Rate" value="91%" helper="Healthy delivery pace" />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-3xl border-white/10 bg-white/[0.03] text-white xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-400">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-white">Homepage redesign approved</p>
              <p className="mt-1">Acme Studio approved Deliverable V3 for Website Refresh.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-white">AI generated a weekly summary</p>
              <p className="mt-1">Project update draft was created for 4 active accounts.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-white">New client added</p>
              <p className="mt-1">Northstar Labs was added and assigned to the Growth Site project.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.03] text-white">
          <CardHeader>
            <CardTitle>Workspace Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-400">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="font-medium text-white">Delivery pace is strong</p>
              <p className="mt-1">No critical project blockers detected.</p>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
              <p className="font-medium text-white">3 due dates this week</p>
              <p className="mt-1">Review upcoming deadlines and approvals.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
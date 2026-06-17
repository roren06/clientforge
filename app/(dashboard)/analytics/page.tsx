"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageShell } from "@/components/layout/page-shell";

type ChartDatum = {
  name: string;
  value: number;
};

type ActivityDatum = {
  name: string;
  activity: number;
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
  projectStatusChart: ChartDatum[];
  deliverableStatusChart: ChartDatum[];
  activityTrend: ActivityDatum[];
};

const PROJECT_COLORS = ["#a78bfa", "#22d3ee", "#f59e0b", "#34d399"];
const DELIVERABLE_COLORS = [
  "#94a3b8",
  "#38bdf8",
  "#f59e0b",
  "#34d399",
  "#fb7185",
];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
    try {
      const res = await fetch("/api/analytics/overview", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch analytics.");
      }

      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Analytics load failed:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const approvalRate = useMemo(() => {
    if (!data) return 0;

    const totalReviewed =
      data.deliverablesApproved + data.deliverablesRevisionRequested;

    if (totalReviewed === 0) return 0;

    return Math.round((data.deliverablesApproved / totalReviewed) * 100);
  }, [data]);

  const hasProjectChartData = useMemo(
    () => data?.projectStatusChart.some((item) => item.value > 0) ?? false,
    [data]
  );
  const hasDeliverableChartData = useMemo(
    () => data?.deliverableStatusChart.some((item) => item.value > 0) ?? false,
    [data]
  );
  const hasActivityChartData = useMemo(
    () => data?.activityTrend.some((item) => item.activity > 0) ?? false,
    [data]
  );

  return (
    <PageShell
      title="Analytics"
      description="Overview of workspace performance and activity."
    >
      {loading || !data ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-gray-400">
          Loading analytics...
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-lg font-semibold text-white">
                  Workspace Performance Snapshot
                </p>
                <p className="mt-1 max-w-2xl text-sm text-gray-400">
                  Monitor project momentum, deliverable outcomes, and recent
                  workspace activity from one reporting view.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryPill
                  label="Active"
                  value={String(data.activeProjects)}
                />
                <SummaryPill
                  label="Review"
                  value={String(data.projectsInReview)}
                />
                <SummaryPill
                  label="Clients"
                  value={String(data.totalClients)}
                />
                <SummaryPill
                  label="Avg Progress"
                  value={`${data.averageProgress}%`}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Active Projects"
              value={data.activeProjects}
              helper="Projects currently moving forward"
            />
            <MetricCard
              label="Projects In Review"
              value={data.projectsInReview}
              helper="May need feedback or approval"
            />
            <MetricCard
              label="Completed Projects"
              value={data.completedProjects}
              helper="Finished based on current workflow"
            />
            <MetricCard
              label="Average Progress"
              value={`${data.averageProgress}%`}
              helper="Average across workspace projects"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 space-y-6">
              <ChartCard
                title="Project Status Distribution"
                description="Workspace projects grouped by current delivery stage."
              >
                {hasProjectChartData ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={data.projectStatusChart}
                      margin={{ top: 12, right: 4, left: -24, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="rgba(255,255,255,0.08)"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                        contentStyle={tooltipStyle}
                        labelStyle={{ color: "#f9fafb" }}
                      />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                        {data.projectStatusChart.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={PROJECT_COLORS[index % PROJECT_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No projects yet. Create projects to see delivery health." />
                )}
              </ChartCard>

              <ChartCard
                title="Activity Trend"
                description="Daily project and deliverable activity over the last seven days."
              >
                {hasActivityChartData ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart
                      data={data.activityTrend}
                      margin={{ top: 12, right: 4, left: -24, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="activityGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#22d3ee"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="#22d3ee"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        stroke="rgba(255,255,255,0.08)"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ stroke: "rgba(255,255,255,0.16)" }}
                        contentStyle={tooltipStyle}
                        labelStyle={{ color: "#f9fafb" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="activity"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        fill="url(#activityGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No activity logged in the last seven days." />
                )}
              </ChartCard>
            </div>

            <div className="space-y-6">
              <ChartCard
                title="Deliverable Outcomes"
                description="Approval workflow volume by deliverable status."
              >
                {hasDeliverableChartData ? (
                  <div className="space-y-5">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={data.deliverableStatusChart}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={62}
                          outerRadius={92}
                          paddingAngle={3}
                        >
                          {data.deliverableStatusChart.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={
                                DELIVERABLE_COLORS[
                                  index % DELIVERABLE_COLORS.length
                                ]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          labelStyle={{ color: "#f9fafb" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <ChartLegend
                      data={data.deliverableStatusChart}
                      colors={DELIVERABLE_COLORS}
                    />
                  </div>
                ) : (
                  <EmptyChart message="No deliverables yet. Upload or create deliverables to see outcomes." />
                )}
              </ChartCard>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-base font-semibold text-white">
                  Approval Rate
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Approved vs revision-requested deliverables.
                </p>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Current Rate
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Based on approved vs revision-requested deliverables
                      </p>
                    </div>

                    <p className="text-2xl font-semibold text-white">
                      {approvalRate}%
                    </p>
                  </div>

                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white/70 transition-all"
                      style={{ width: `${Math.max(0, Math.min(approvalRate, 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-base font-semibold text-white">
                  Activity Signal
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Recent workspace movement over the last 7 days.
                </p>

                <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5">
                  <p className="text-xs uppercase tracking-wide text-cyan-200/70">
                    Last 7 Days
                  </p>
                  <p className="mt-2 text-4xl font-semibold text-white">
                    {data.totalActivityLast7Days}
                  </p>
                  <p className="mt-2 text-sm text-cyan-100/80">
                    Logged events from project and deliverable activity.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
}

const tooltipStyle = {
  background: "rgba(15,23,42,0.96)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "14px",
  color: "#f9fafb",
};

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
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs text-gray-500">{helper}</p>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-gray-400">{description}</p>
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}

function ChartLegend({
  data,
  colors,
}: {
  data: ChartDatum[];
  colors: string[];
}) {
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div
          key={item.name}
          className="flex items-center justify-between gap-3 text-sm"
        >
          <div className="flex items-center gap-2 text-gray-300">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            {item.name}
          </div>
          <span className="font-medium text-white">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
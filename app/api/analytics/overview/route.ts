import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInternalAccess } from "@/lib/guards";
import {
  buildProjectStatusChart,
  countDeliverablesByStatus,
  countProjectsNeedingReview,
} from "@/lib/analytics-metrics";

const DELIVERABLE_STATUSES = [
  { status: "DRAFT", label: "Draft" },
  { status: "PENDING", label: "Pending" },
  { status: "IN_REVIEW", label: "In Review" },
  { status: "APPROVED", label: "Approved" },
  { status: "REVISION_REQUESTED", label: "Revision Requested" },
];

export async function GET() {
  const result = await requireInternalAccess();

  if (!result?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workspaceId = result.workspace.id;
    const activityStartDate = startOfDay(daysAgo(6));

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
      deliverableStatusGroups,
      recentActivityLogs,
      projectStatusChart,
    ] = await Promise.all([
      prisma.project.count({
        where: {
          workspaceId,
          status: "ACTIVE",
        },
      }),

      countProjectsNeedingReview(workspaceId),

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

      countDeliverablesByStatus(workspaceId, "IN_REVIEW"),

      countDeliverablesByStatus(workspaceId, "APPROVED"),

      countDeliverablesByStatus(workspaceId, "REVISION_REQUESTED"),

      prisma.activityLog.count({
        where: {
          workspaceId,
          createdAt: {
            gte: activityStartDate,
          },
        },
      }),

      prisma.deliverable.groupBy({
        by: ["status"],
        where: {
          project: {
            workspaceId,
          },
        },
        _count: {
          _all: true,
        },
      }),

      prisma.activityLog.findMany({
        where: {
          workspaceId,
          createdAt: {
            gte: activityStartDate,
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),

      buildProjectStatusChart(workspaceId),
    ]);

    const averageProgress = Math.round(
      averageProgressAggregate._avg.progress ?? 0
    );
    const deliverableStatusChart = toStatusChart(
      DELIVERABLE_STATUSES,
      deliverableStatusGroups
    );
    const activityTrend = buildActivityTrend(recentActivityLogs);

    return NextResponse.json({
      activeProjects,
      projectsInReview,
      plannedProjects,
      completedProjects,
      totalClients,
      averageProgress,
      deliverablesInReview,
      deliverablesApproved,
      deliverablesRevisionRequested,
      totalActivityLast7Days,
      projectStatusChart,
      deliverableStatusChart,
      activityTrend,
    });
  } catch (error) {
    console.error("Failed to fetch analytics overview:", error);

    return NextResponse.json(
      { error: "Failed to fetch analytics overview." },
      { status: 500 }
    );
  }
}

function toStatusChart(
  statuses: { status: string; label: string }[],
  groups: { status: string; _count: { _all: number } }[]
) {
  const counts = new Map(groups.map((group) => [group.status, group._count._all]));

  return statuses.map((status) => ({
    name: status.label,
    value: counts.get(status.status) ?? 0,
  }));
}

function buildActivityTrend(logs: { createdAt: Date }[]) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = startOfDay(daysAgo(6 - index));

    return {
      key: toDateKey(date),
      name: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      activity: 0,
    };
  });
  const dayIndexes = new Map(days.map((day, index) => [day.key, index]));

  for (const log of logs) {
    const index = dayIndexes.get(toDateKey(log.createdAt));

    if (index !== undefined) {
      days[index].activity += 1;
    }
  }

  return days.map(({ name, activity }) => ({ name, activity }));
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function toDateKey(date: Date) {
  return startOfDay(date).toISOString().slice(0, 10);
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInternalAccess } from "@/lib/guards";
import { countProjectsNeedingReview } from "@/lib/analytics-metrics";

export async function GET() {
  const result = await requireInternalAccess();

  try {
    const [clientsCount, projects, reviewProjects] = await Promise.all([
      prisma.client.count({
        where: {
          workspaceId: result.workspace.id,
        },
      }),
      prisma.project.findMany({
        where: {
          workspaceId: result.workspace.id,
        },
        include: {
          client: true,
          deliverables: {
            select: {
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      countProjectsNeedingReview(result.workspace.id),
    ]);

    const activeProjects = projects.filter(
      (project) => project.status === "ACTIVE"
    ).length;

    const reviewProjectsFromStatus = projects.filter(
      (project) => project.status === "REVIEW"
    ).length;

    const averageProgress =
      projects.length > 0
        ? Math.round(
            projects.reduce((sum, project) => sum + project.progress, 0) /
              projects.length
          )
        : 0;

    const recentActivity = projects.slice(0, 3).map((project) => ({
      id: project.id,
      title: project.title,
      clientName: project.client.name,
      status: getProjectDisplayStatus(project),
      progress: project.progress,
      deliverablesInReview: project.deliverables.filter(
        (deliverable) => deliverable.status === "IN_REVIEW"
      ).length,
      createdAt: project.createdAt,
    }));

    return NextResponse.json({
      stats: {
        clientsCount,
        totalProjects: projects.length,
        activeProjects,
        reviewProjects,
        reviewProjectsByStatus: reviewProjectsFromStatus,
        averageProgress,
      },
      recentActivity,
    });
  } catch (error) {
    console.error("Failed to load dashboard data:", error);

    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}

function getProjectDisplayStatus(project: {
  status: string;
  progress: number;
  deliverables: { status: string }[];
}) {
  if (project.deliverables.some((deliverable) => deliverable.status === "IN_REVIEW")) {
    return "REVIEW";
  }

  if (project.progress >= 100) {
    return "COMPLETED";
  }

  if (project.progress >= 70 && project.status !== "COMPLETED") {
    return "REVIEW";
  }

  if (project.progress > 0 && project.status === "PLANNING") {
    return "ACTIVE";
  }

  return project.status;
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const workspace = await prisma.workspace.findFirst();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const [clientsCount, projects] = await Promise.all([
      prisma.client.count({
        where: {
          workspaceId: workspace.id,
        },
      }),
      prisma.project.findMany({
        where: {
          workspaceId: workspace.id,
        },
        include: {
          client: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const activeProjects = projects.filter(
      (project) => project.status === "ACTIVE"
    ).length;

    const reviewProjects = projects.filter(
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
      status: project.status,
      progress: project.progress,
      createdAt: project.createdAt,
    }));

    return NextResponse.json({
      stats: {
        clientsCount,
        totalProjects: projects.length,
        activeProjects,
        reviewProjects,
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
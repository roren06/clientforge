import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserWithWorkspace } from "@/lib/workspace";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const result = await getCurrentUserWithWorkspace();
  const { id } = await context.params;

  if (!result || !result.workspace) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const linkedClientWhere = {
      workspaceId: result.workspace.id,
      userId: result.user.id,
    };

    const linkedClient =
      result.role === "CLIENT"
        ? await prisma.client.findFirst({
            where: linkedClientWhere,
            select: {
              id: true,
            },
          })
        : null;

    if (result.role === "CLIENT" && !linkedClient) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        workspaceId: result.workspace.id,
        ...(linkedClient ? { clientId: linkedClient.id } : {}),
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    const activity = await prisma.activityLog.findMany({
      where: {
        projectId: project.id,
        workspaceId: result.workspace.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      include: {
        user: true,
      },
    });

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("Failed to load activity:", error);

    return NextResponse.json(
      { error: "Failed to load activity." },
      { status: 500 }
    );
  }
}
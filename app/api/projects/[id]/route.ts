import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireInternalAccess } from "@/lib/guards";
import { logActivity } from "@/lib/activity";
import { parseJsonBody } from "@/lib/validation";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

const updateProjectSchema = z.object({
  status: z.enum(["PLANNING", "ACTIVE", "REVIEW", "COMPLETED"]).optional(),
  progress: z.coerce.number().int().min(0).max(100).optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const result = await requireInternalAccess();
  const { id } = await context.params;

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        workspaceId: result.workspace.id,
      },
      include: {
        client: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to fetch project detail:", error);

    return NextResponse.json(
      { error: "Failed to fetch project detail" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const result = await requireInternalAccess();
  const { id } = await context.params;

  try {
    const limited = await rateLimit(request, {
      key: "project-update",
      identifier: rateLimitKey(result.user.id, id),
      limit: 40,
      window: "10 m",
      message: "Too many project updates. Please try again shortly.",
    });

    if (limited) {
      return limited;
    }

    const parsed = await parseJsonBody(request, updateProjectSchema);

    if (!parsed.success) {
      return parsed.response;
    }

    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        workspaceId: result.workspace.id,
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { status, progress } = parsed.data;

    if (status === undefined && progress === undefined) {
      return NextResponse.json(
        { error: "No project updates provided." },
        { status: 400 }
      );
    }

    const project = await prisma.project.update({
      where: {
        id: existingProject.id,
      },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(progress !== undefined ? { progress } : {}),
      },
      include: {
        client: true,
      },
    });

    await logActivity({
      workspaceId: project.workspaceId,
      projectId: project.id,
      userId: result.user.id,
      type: "PROJECT_UPDATED",
      message:
        project.status === "COMPLETED" && project.progress === 100
          ? `Project "${project.title}" was marked completed.`
          : `Project "${project.title}" was updated.`,
    });

    return NextResponse.json({
      message: "Project updated successfully.",
      project,
    });
  } catch (error) {
    console.error("Failed to update project:", error);

    return NextResponse.json(
      { error: "Failed to update project." },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { NotificationType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireInternalAccess } from "@/lib/guards";
import { logActivity } from "@/lib/activity";
import { createWorkspaceNotifications } from "@/lib/notifications";
import { recalculateProjectProgress } from "@/lib/progress";
import { parseJsonBody } from "@/lib/validation";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

const createDeliverableSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(160),
  type: z.string().trim().min(1, "Type is required.").max(50),
  notes: z.string().trim().max(1000).optional().nullable(),
  fileUrl: z.string().trim().url("File URL must be a valid URL.").optional().nullable(),
  status: z
    .enum(["DRAFT", "IN_REVIEW", "APPROVED", "REVISION_REQUESTED"])
    .optional(),
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

    const deliverables = await prisma.deliverable.findMany({
      where: {
        projectId: project.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      deliverables,
      total: deliverables.length,
    });
  } catch (error) {
    console.error("Failed to fetch deliverables:", error);

    return NextResponse.json(
      { error: "Failed to fetch deliverables" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const result = await requireInternalAccess();
  const { id } = await context.params;

  try {
    const limited = await rateLimit(request, {
      key: "deliverable-create",
      identifier: rateLimitKey(result.user.id, id),
      limit: 40,
      window: "1 h",
      message: "Too many deliverable creation attempts. Please try again later.",
    });

    if (limited) {
      return limited;
    }

    const parsed = await parseJsonBody(request, createDeliverableSchema);

    if (!parsed.success) {
      return parsed.response;
    }

    const { title, type, notes, fileUrl, status } = parsed.data;

    const project = await prisma.project.findFirst({
      where: {
        id,
        workspaceId: result.workspace.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    const deliverable = await prisma.deliverable.create({
      data: {
        projectId: project.id,
        title,
        type,
        notes: notes ?? null,
        fileUrl: fileUrl ?? null,
        status: status ?? "DRAFT",
      },
      include: {
        project: true,
      },
    });

    await logActivity({
      workspaceId: deliverable.project.workspaceId,
      projectId: deliverable.projectId,
      userId: result.user.id,
      type: "DELIVERABLE_CREATED",
      message: `Deliverable "${deliverable.title}" was created.`,
    });

    await createWorkspaceNotifications({
      workspaceId: deliverable.project.workspaceId,
      actorId: result.user.id,
      projectId: deliverable.projectId,
      deliverableId: deliverable.id,
      activityLogId: null,
      type: NotificationType.DELIVERABLE_CREATED,
      title: "New deliverable created",
      message: `"${deliverable.title}" was added to the project.`,
      link: `/projects/${deliverable.projectId}`,
    });

    await recalculateProjectProgress(deliverable.projectId);

    return NextResponse.json(
      {
        message: "Deliverable created successfully.",
        deliverable,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create deliverable:", error);

    return NextResponse.json(
      { error: "Failed to create deliverable." },
      { status: 500 }
    );
  }
}
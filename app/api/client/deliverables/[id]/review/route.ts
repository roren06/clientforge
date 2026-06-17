import { NextResponse } from "next/server";
import { NotificationType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserWithWorkspace } from "@/lib/workspace";
import { logActivity } from "@/lib/activity";
import { createWorkspaceNotifications } from "@/lib/notifications";
import { recalculateProjectProgress } from "@/lib/progress";
import { parseJsonBody } from "@/lib/validation";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

const reviewDeliverableSchema = z.object({
  status: z.enum(["APPROVED", "REVISION_REQUESTED"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const result = await getCurrentUserWithWorkspace();
  const { id } = await context.params;

  if (!result || !result.workspace || result.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limited = await rateLimit(request, {
      key: "client-review",
      identifier: rateLimitKey(result.user.id, id),
      limit: 100,
      window: "10 m",
      message: "Too many review actions. Please try again shortly.",
    });

    if (limited) {
      return limited;
    }

    const parsed = await parseJsonBody(request, reviewDeliverableSchema);

    if (!parsed.success) {
      return parsed.response;
    }

    const { status } = parsed.data;

    const linkedClientWhere = {
      workspaceId: result.workspace.id,
      userId: result.user.id,
    };

    const linkedClient = await prisma.client.findFirst({
      where: linkedClientWhere,
      select: {
        id: true,
      },
    });

    if (!linkedClient) {
      return NextResponse.json(
        { error: "Deliverable not found." },
        { status: 404 }
      );
    }

    const deliverable = await prisma.deliverable.findFirst({
      where: {
        id,
        project: {
          workspaceId: result.workspace.id,
          clientId: linkedClient.id,
        },
      },
      include: {
        project: true,
      },
    });

    if (!deliverable) {
      return NextResponse.json(
        { error: "Deliverable not found." },
        { status: 404 }
      );
    }

    const updatedDeliverable = await prisma.deliverable.update({
      where: { id: deliverable.id },
      data: { status },
      include: {
        project: true,
      },
    });

    await logActivity({
      workspaceId: updatedDeliverable.project.workspaceId,
      projectId: updatedDeliverable.projectId,
      userId: result.user.id,
      type: "CLIENT_REVIEW_ACTION",
      message: `Client marked deliverable "${updatedDeliverable.title}" as ${status}.`,
    });

    await createWorkspaceNotifications({
      workspaceId: updatedDeliverable.project.workspaceId,
      actorId: result.user.id,
      projectId: updatedDeliverable.projectId,
      deliverableId: updatedDeliverable.id,
      activityLogId: null,
      type:
        status === "APPROVED"
          ? NotificationType.DELIVERABLE_APPROVED
          : NotificationType.DELIVERABLE_REVISION_REQUESTED,
      title:
        status === "APPROVED"
          ? "Deliverable approved"
          : "Revision requested",
      message:
        status === "APPROVED"
          ? `Client approved "${updatedDeliverable.title}".`
          : `Client requested revisions for "${updatedDeliverable.title}".`,
      link: `/projects/${updatedDeliverable.projectId}`,
    });

    await recalculateProjectProgress(updatedDeliverable.projectId);

    return NextResponse.json({
      message: "Client review submitted.",
      deliverable: updatedDeliverable,
    });
  } catch (error) {
    console.error("Failed to submit client review:", error);

    return NextResponse.json(
      { error: "Failed to submit client review." },
      { status: 500 }
    );
  }
}
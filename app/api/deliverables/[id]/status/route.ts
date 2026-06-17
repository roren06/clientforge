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

const updateDeliverableStatusSchema = z.object({
  status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "REVISION_REQUESTED"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const result = await requireInternalAccess();
  const { id } = await context.params;

  try {
    const limited = await rateLimit(request, {
      key: "deliverable-status",
      identifier: rateLimitKey(result.user.id, id),
      limit: 60,
      window: "10 m",
      message: "Too many status changes. Please try again shortly.",
    });

    if (limited) {
      return limited;
    }

    const parsed = await parseJsonBody(request, updateDeliverableStatusSchema);

    if (!parsed.success) {
      return parsed.response;
    }

    const { status } = parsed.data;

    const existingDeliverable = await prisma.deliverable.findFirst({
      where: {
        id,
        project: {
          workspaceId: result.workspace.id,
        },
      },
      include: {
        project: true,
      },
    });

    if (!existingDeliverable) {
      return NextResponse.json(
        { error: "Deliverable not found." },
        { status: 404 }
      );
    }

    const deliverable = await prisma.deliverable.update({
      where: { id: existingDeliverable.id },
      data: { status },
      include: {
        project: true,
      },
    });

    await logActivity({
      workspaceId: deliverable.project.workspaceId,
      projectId: deliverable.projectId,
      userId: result.user.id,
      type: "DELIVERABLE_STATUS_UPDATED",
      message: `Deliverable "${deliverable.title}" status changed to ${status}.`,
    });

    if (status === "IN_REVIEW") {
      await createWorkspaceNotifications({
        workspaceId: deliverable.project.workspaceId,
        actorId: result.user.id,
        projectId: deliverable.projectId,
        deliverableId: deliverable.id,
        activityLogId: null,
        type: NotificationType.DELIVERABLE_CREATED,
        title: "Deliverable ready for review",
        message: `"${deliverable.title}" is now in review.`,
        link: `/projects/${deliverable.projectId}`,
      });
    }

    await recalculateProjectProgress(deliverable.projectId);

    console.log("Status update logged for deliverable:", deliverable.id);

    return NextResponse.json({
      message: "Deliverable status updated.",
      deliverable,
    });
  } catch (error) {
    console.error("Failed to update deliverable status:", error);

    return NextResponse.json(
      { error: "Failed to update deliverable status." },
      { status: 500 }
    );
  }
}
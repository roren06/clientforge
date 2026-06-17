import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/guards";
import { logActivity } from "@/lib/activity";
import { parseJsonBody } from "@/lib/validation";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { canAccessDeliverable } from "@/lib/permissions";

const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment body is required.").max(2000),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const result = await requireWorkspaceAccess();
  const { id } = await context.params;

  try {
    const deliverable = await prisma.deliverable.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!deliverable) {
      return NextResponse.json(
        { error: "Deliverable not found." },
        { status: 404 }
      );
    }

    if (
      !canAccessDeliverable(
        {
          userId: result.user.id,
          workspaceId: result.workspace.id,
          role: result.role,
        },
        {
          workspaceId: deliverable.project.workspaceId,
          clientUserId: deliverable.project.client.userId,
        }
      )
    ) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        deliverableId: id,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      comments,
      total: comments.length,
    });
  } catch (error) {
    console.error("Failed to fetch comments:", error);

    return NextResponse.json(
      { error: "Failed to fetch comments." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const result = await requireWorkspaceAccess();
  const { id } = await context.params;

  try {
    const limited = await rateLimit(request, {
      key: "deliverable-comment",
      identifier: rateLimitKey(result.user.id, id),
      limit: 30,
      window: "10 m",
      message: "Too many comments. Please slow down and try again shortly.",
    });

    if (limited) {
      return limited;
    }

    const parsed = await parseJsonBody(request, createCommentSchema);

    if (!parsed.success) {
      return parsed.response;
    }

    const { body: commentBody } = parsed.data;

    const deliverable = await prisma.deliverable.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!deliverable) {
      return NextResponse.json(
        { error: "Deliverable not found." },
        { status: 404 }
      );
    }

    if (
      !canAccessDeliverable(
        {
          userId: result.user.id,
          workspaceId: result.workspace.id,
          role: result.role,
        },
        {
          workspaceId: deliverable.project.workspaceId,
          clientUserId: deliverable.project.client.userId,
        }
      )
    ) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        deliverableId: id,
        userId: result.user.id,
        body: commentBody,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await logActivity({
      workspaceId: deliverable.project.workspaceId,
      projectId: deliverable.projectId,
      userId: result.user.id,
      type: "DELIVERABLE_COMMENT_ADDED",
      message: `Comment added to deliverable "${deliverable.title}".`,
    });

    return NextResponse.json(
      {
        message: "Comment added successfully.",
        comment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create comment:", error);

    return NextResponse.json(
      { error: "Failed to create comment." },
      { status: 500 }
    );
  }
}
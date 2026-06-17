import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireInternalAccess } from "@/lib/guards";
import { logActivity } from "@/lib/activity";
import { parseJsonBody } from "@/lib/validation";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

const createProjectSchema = z.object({
  clientId: z.string().trim().min(1, "Client is required."),
  title: z.string().trim().min(1, "Project title is required.").max(160),
  description: z.string().trim().max(1200).optional(),
  status: z.enum(["PLANNING", "ACTIVE", "REVIEW", "COMPLETED"]).default("ACTIVE"),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  deadline: z.string().trim().optional().or(z.literal("")),
});

export async function GET() {
  const result = await requireInternalAccess();

  if (!result.workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const projects = await prisma.project.findMany({
    where: {
      workspaceId: result.workspace.id,
    },
    include: {
      client: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    total: projects.length,
    projects,
  });
}

export async function POST(request: Request) {
  const result = await requireInternalAccess();

  if (!result.workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  try {
    const limited = await rateLimit(request, {
      key: "project-create",
      identifier: rateLimitKey(result.user.id, result.workspace.id),
      limit: 20,
      window: "10 m",
      message: "Too many project creation attempts. Please try again shortly.",
    });

    if (limited) {
      return limited;
    }

    const parsed = await parseJsonBody(request, createProjectSchema);

    if (!parsed.success) {
      return parsed.response;
    }

    const { clientId, title, status, progress } = parsed.data;
    const description = parsed.data.description?.trim() || null;
    const deadline = parsed.data.deadline
      ? new Date(parsed.data.deadline)
      : null;

    if (deadline && Number.isNaN(deadline.getTime())) {
      return NextResponse.json(
        { error: "Deadline must be a valid date." },
        { status: 400 }
      );
    }

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        workspaceId: result.workspace.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found." },
        { status: 404 }
      );
    }

    const project = await prisma.project.create({
      data: {
        workspaceId: result.workspace.id,
        clientId: client.id,
        title,
        description,
        status,
        progress,
        deadline,
      },
      include: {
        client: true,
      },
    });

    await logActivity({
      workspaceId: result.workspace.id,
      projectId: project.id,
      userId: result.user.id,
      type: "PROJECT_CREATED",
      message: `Project "${project.title}" created for ${client.name}.`,
    });

    return NextResponse.json(
      {
        message: "Project created successfully.",
        project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create project:", error);

    return NextResponse.json(
      { error: "Failed to create project." },
      { status: 500 }
    );
  }
}
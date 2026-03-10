import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const workspace = await prisma.workspace.findFirst({
    include: {
      clients: true,
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const projects = await prisma.project.findMany({
    where: {
      workspaceId: workspace.id,
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
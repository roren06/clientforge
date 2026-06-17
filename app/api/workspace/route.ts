import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInternalAccess } from "@/lib/guards";

export async function GET() {
  const result = await requireInternalAccess();

  const workspace = await prisma.workspace.findUnique({
    where: {
      id: result.workspace.id,
    },
    include: {
      memberships: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json({
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      members: workspace.memberships.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
      memberCount: workspace.memberships.length,
    },
  });
}
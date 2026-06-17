import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { parseJsonBody } from "@/lib/validation";

const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(1, "Workspace name is required.").max(120),
  description: z.string().trim().max(500).optional().nullable(),
});

export async function PATCH(request: Request) {
  const result = await requireRole(["OWNER", "ADMIN"]);

  try {
    const parsed = await parseJsonBody(request, updateWorkspaceSchema);

    if (!parsed.success) {
      return parsed.response;
    }

    const { name, description } = parsed.data;

    const workspace = await prisma.workspace.update({
      where: {
        id: result.workspace.id,
      },
      data: {
        name,
        description: description || null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });

    return NextResponse.json({
      message: "Workspace updated successfully.",
      workspace,
    });
  } catch (error) {
    console.error("Failed to update workspace settings:", error);

    return NextResponse.json(
      { error: "Failed to update workspace settings." },
      { status: 500 }
    );
  }
}
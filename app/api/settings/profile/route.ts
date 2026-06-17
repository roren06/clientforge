import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/guards";
import { parseJsonBody } from "@/lib/validation";

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
});

export async function PATCH(request: Request) {
  const result = await requireWorkspaceAccess();

  try {
    const parsed = await parseJsonBody(request, updateProfileSchema);

    if (!parsed.success) {
      return parsed.response;
    }

    const { name } = parsed.data;

    const user = await prisma.user.update({
      where: {
        id: result.user.id,
      },
      data: {
        name,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Failed to update profile settings:", error);

    return NextResponse.json(
      { error: "Failed to update profile settings." },
      { status: 500 }
    );
  }
}
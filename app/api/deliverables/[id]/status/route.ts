import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInternalAccess } from "@/lib/guards";

const allowedStatuses = [
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "REVISION_REQUESTED",
];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await requireInternalAccess();

  const { id } = await context.params;

  try {
    const body = await request.json();
    const { status } = body;

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid deliverable status." },
        { status: 400 }
      );
    }

    const deliverable = await prisma.deliverable.update({
      where: { id },
      data: { status },
    });

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
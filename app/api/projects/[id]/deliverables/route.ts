import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const deliverables = await prisma.deliverable.findMany({
      where: {
        projectId: id,
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
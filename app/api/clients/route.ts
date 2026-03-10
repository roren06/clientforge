import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const workspace = await prisma.workspace.findFirst({
      include: {
        clients: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      clients: workspace.clients,
      total: workspace.clients.length,
    });
  } catch (error) {
    console.error("Failed to fetch clients:", error);

    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
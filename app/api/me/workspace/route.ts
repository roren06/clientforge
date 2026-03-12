import { NextResponse } from "next/server";
import { getCurrentUserWithWorkspace } from "@/lib/workspace";

export async function GET() {
  try {
    const result = await getCurrentUserWithWorkspace();

    if (!result) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      workspace: result.workspace
        ? {
            id: result.workspace.id,
            name: result.workspace.name,
            slug: result.workspace.slug,
            description: result.workspace.description,
          }
        : null,
      role: result.role,
    });
  } catch (error) {
    console.error("Failed to load workspace info:", error);

    return NextResponse.json(
      { error: "Failed to load workspace info" },
      { status: 500 }
    );
  }
}
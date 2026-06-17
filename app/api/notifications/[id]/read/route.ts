import { NextResponse } from "next/server";
import { getCurrentUserWithWorkspace } from "@/lib/workspace";
import { markNotificationAsRead } from "@/lib/notifications";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const result = await getCurrentUserWithWorkspace();
  const { id } = await context.params;

  if (!result || !result.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await markNotificationAsRead(id, result.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);

    return NextResponse.json(
      { error: "Failed to mark notification as read." },
      { status: 500 }
    );
  }
}
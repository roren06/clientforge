import { NextResponse } from "next/server";
import { getCurrentUserWithWorkspace } from "@/lib/workspace";
import { markAllNotificationsAsRead } from "@/lib/notifications";

export async function PATCH() {
  const result = await getCurrentUserWithWorkspace();

  if (!result || !result.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await markAllNotificationsAsRead(result.user.id, result.workspace.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);

    return NextResponse.json(
      { error: "Failed to mark all notifications as read." },
      { status: 500 }
    );
  }
}
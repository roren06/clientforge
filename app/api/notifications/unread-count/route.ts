import { NextResponse } from "next/server";
import { getCurrentUserWithWorkspace } from "@/lib/workspace";
import { getUnreadNotificationCount } from "@/lib/notifications";

export async function GET() {
  const result = await getCurrentUserWithWorkspace();

  if (!result || !result.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await getUnreadNotificationCount(
      result.user.id,
      result.workspace.id
    );

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to fetch unread notification count:", error);

    return NextResponse.json(
      { error: "Failed to fetch unread notification count." },
      { status: 500 }
    );
  }
}
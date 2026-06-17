import { NextResponse } from "next/server";
import { getCurrentUserWithWorkspace } from "@/lib/workspace";
import { getNotificationsForUser } from "@/lib/notifications";

export async function GET() {
  const result = await getCurrentUserWithWorkspace();

  if (!result || !result.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notifications = await getNotificationsForUser(
      result.user.id,
      result.workspace.id
    );

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);

    return NextResponse.json(
      { error: "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}
import { prisma } from "@/lib/prisma";

export async function logActivity({
  workspaceId,
  projectId,
  userId,
  type,
  message,
}: {
  workspaceId: string;
  projectId: string;
  userId?: string | null;
  type: string;
  message: string;
}) {
  const activity = await prisma.activityLog.create({
    data: {
      workspaceId,
      projectId,
      userId: userId ?? null,
      type,
      message,
    },
  });

  console.log("Activity created:", activity);

  return activity;
}
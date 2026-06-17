import { NotificationType, WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CreateWorkspaceNotificationInput = {
  workspaceId: string;
  actorId?: string | null;
  projectId?: string | null;
  deliverableId?: string | null;
  activityLogId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
};

export async function createWorkspaceNotifications(
  input: CreateWorkspaceNotificationInput
) {
  const members = await prisma.membership.findMany({
    where: {
      workspaceId: input.workspaceId,
      role: {
        in: [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER],
      },
    },
    select: {
      userId: true,
    },
  });

  const recipientIds = members
    .map((member) => member.userId)
    .filter((userId) => userId !== input.actorId);

  if (recipientIds.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: recipientIds.map((userId) => ({
      workspaceId: input.workspaceId,
      userId,
      actorId: input.actorId ?? null,
      projectId: input.projectId ?? null,
      deliverableId: input.deliverableId ?? null,
      activityLogId: input.activityLogId ?? null,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
    })),
  });
}

export async function getUnreadNotificationCount(
  userId: string,
  workspaceId: string
) {
  return prisma.notification.count({
    where: {
      userId,
      workspaceId,
      isRead: false,
    },
  });
}

export async function getNotificationsForUser(
  userId: string,
  workspaceId: string
) {
  return prisma.notification.findMany({
    where: {
      userId,
      workspaceId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      project: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      deliverable: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function markAllNotificationsAsRead(
  userId: string,
  workspaceId: string
) {
  return prisma.notification.updateMany({
    where: {
      userId,
      workspaceId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}
import { prisma } from "@/lib/prisma";

export async function countProjectsNeedingReview(workspaceId: string) {
  return prisma.project.count({
    where: {
      workspaceId,
      OR: [
        { status: "REVIEW" },
        {
          deliverables: {
            some: {
              status: "IN_REVIEW",
            },
          },
        },
      ],
    },
  });
}

export async function countDeliverablesByStatus(
  workspaceId: string,
  status: string
) {
  return prisma.deliverable.count({
    where: {
      project: {
        workspaceId,
      },
      status,
    },
  });
}

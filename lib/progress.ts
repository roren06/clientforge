import { prisma } from "@/lib/prisma";

function getDeliverableProgressWeight(status: string) {
  switch (status) {
    case "DRAFT":
      return 10;
    case "IN_REVIEW":
      return 70;
    case "APPROVED":
      return 100;
    case "REVISION_REQUESTED":
      return 50;
    default:
      return 0;
  }
}

export async function recalculateProjectProgress(projectId: string) {
  const deliverables = await prisma.deliverable.findMany({
    where: {
      projectId,
    },
    select: {
      status: true,
    },
  });

  if (deliverables.length === 0) {
    return prisma.project.update({
      where: { id: projectId },
      data: { progress: 0 },
    });
  }

  const total = deliverables.reduce((sum, deliverable) => {
    return sum + getDeliverableProgressWeight(deliverable.status);
  }, 0);

  const progress = Math.round(total / deliverables.length);

  return prisma.project.update({
    where: { id: projectId },
    data: { progress },
  });
}
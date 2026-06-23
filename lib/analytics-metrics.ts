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

function projectNeedsReview(project: {
  status: string;
  deliverables: { status: string }[];
}) {
  return (
    project.status === "REVIEW" ||
    project.deliverables.some((deliverable) => deliverable.status === "IN_REVIEW")
  );
}

export async function buildProjectStatusChart(workspaceId: string) {
  const projects = await prisma.project.findMany({
    where: { workspaceId },
    select: {
      status: true,
      deliverables: {
        select: {
          status: true,
        },
      },
    },
  });

  let planning = 0;
  let active = 0;
  let review = 0;
  let completed = 0;

  for (const project of projects) {
    if (project.status === "COMPLETED") {
      completed += 1;
      continue;
    }

    if (projectNeedsReview(project)) {
      review += 1;
      continue;
    }

    if (project.status === "PLANNING") {
      planning += 1;
      continue;
    }

    active += 1;
  }

  return [
    { name: "Planning", value: planning },
    { name: "Active", value: active },
    { name: "In Review", value: review },
    { name: "Completed", value: completed },
  ];
}

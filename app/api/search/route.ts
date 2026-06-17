import { NextRequest, NextResponse } from "next/server";
import { requireInternalAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const minQueryLength = 2;

export async function GET(request: NextRequest) {
  const result = await requireInternalAccess();
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < minQueryLength) {
    return NextResponse.json({ results: [] });
  }

  const workspaceId = result.workspace.id;

  try {
    const [clients, projects, deliverables] = await Promise.all([
      prisma.client.findMany({
        where: {
          workspaceId,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
      }),
      prisma.project.findMany({
        where: {
          workspaceId,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { client: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
        include: {
          client: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
      }),
      prisma.deliverable.findMany({
        where: {
          project: {
            workspaceId,
          },
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { type: { contains: query, mode: "insensitive" } },
            { notes: { contains: query, mode: "insensitive" } },
            { project: { title: { contains: query, mode: "insensitive" } } },
          ],
        },
        include: {
          project: {
            include: {
              client: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
      }),
    ]);

    const results = [
      ...clients.map((client) => ({
        id: client.id,
        type: "Client",
        title: client.name,
        description: client.company || client.email || "Client record",
        href: "/clients",
      })),
      ...projects.map((project) => ({
        id: project.id,
        type: "Project",
        title: project.title,
        description: `${project.client.name} · ${project.status}`,
        href: `/projects/${project.id}`,
      })),
      ...deliverables.map((deliverable) => ({
        id: deliverable.id,
        type: "Deliverable",
        title: deliverable.title,
        description: `${deliverable.project.title} · ${deliverable.status}`,
        href: `/projects/${deliverable.projectId}`,
      })),
    ].slice(0, 10);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search failed:", error);

    return NextResponse.json(
      { error: "Failed to search workspace." },
      { status: 500 }
    );
  }
}

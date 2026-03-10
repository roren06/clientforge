import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "lauren@example.com" },
    update: {},
    create: {
      name: "Lauren John S. Angeles",
      email: "lauren@example.com",
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "clientforge-demo" },
    update: {},
    create: {
      name: "ClientForge Demo",
      slug: "clientforge-demo",
      description: "Demo workspace for development",
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: "OWNER",
    },
  });

  const sampleClients = [
    {
      name: "Northstar Labs",
      email: "hello@northstarlabs.com",
      company: "Northstar Labs",
      status: "ACTIVE",
      notes: "Main retainer client for growth website work.",
    },
    {
      name: "Acme Studio",
      email: "team@acmestudio.com",
      company: "Acme Studio",
      status: "ACTIVE",
      notes: "Needs fast approval workflow and design feedback.",
    },
    {
      name: "Vertex Health",
      email: "contact@vertexhealth.com",
      company: "Vertex Health",
      status: "LEAD",
      notes: "Potential new client discussing portal redesign.",
    },
  ];

  for (const client of sampleClients) {
    await prisma.client.upsert({
      where: {
        workspaceId_email: {
          workspaceId: workspace.id,
          email: client.email,
        },
      },
      update: {
        name: client.name,
        company: client.company,
        status: client.status,
        notes: client.notes,
      },
      create: {
        workspaceId: workspace.id,
        name: client.name,
        email: client.email,
        company: client.company,
        status: client.status,
        notes: client.notes,
      },
    });
  }

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
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
  
  const clients = await prisma.client.findMany({
  where: { workspaceId: workspace.id },
});

const northstar = clients.find(c => c.name === "Northstar Labs");
const acme = clients.find(c => c.name === "Acme Studio");
const vertex = clients.find(c => c.name === "Vertex Health");

const sampleProjects = [
  {
    title: "Growth Website Redesign",
    description: "Redesign the client growth website with a more premium landing page and improved conversion flow.",
    clientId: northstar?.id,
    status: "ACTIVE",
    progress: 65,
    deadline: new Date("2026-06-15"),
  },
  {
    title: "Client Portal UI",
    description: "Design and build a client-facing portal experience with better navigation, approvals, and file review flow.",
    clientId: acme?.id,
    status: "REVIEW",
    progress: 90,
    deadline: new Date("2026-05-30"),
  },
  {
    title: "Healthcare Dashboard",
    description: "Plan the first version of an analytics dashboard for healthcare operations and reporting.",
    clientId: vertex?.id,
    status: "PLANNING",
    progress: 15,
    deadline: new Date("2026-07-20"),
  },
];

for (const project of sampleProjects) {
  if (!project.clientId) continue;

  const existingProject = await prisma.project.findFirst({
  where: {
    workspaceId: workspace.id,
    title: project.title,
  },
});

if (!existingProject) {
  await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      clientId: project.clientId,
      title: project.title,
      description: project.description,
      status: project.status,
      progress: project.progress,
      deadline: project.deadline,
    },
  });
}
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
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {

  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.updateMany({
    where: { email: "angeleslaurenjohn@gmail.com" },
    data: {
      email: "demoacc@gmail.com",
      name: "Demo Owner",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "demoacc@gmail.com" },
    update: {
      name: "Demo Owner",
      passwordHash,
    },
    create: {
      name: "Demo Owner",
      email: "demoacc@gmail.com",
      passwordHash,
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

  const clientUserPasswordHash = await bcrypt.hash("client123", 10);

const clientUser = await prisma.user.upsert({
  where: { email: "client@clientforge.app" },
  update: {
    name: "Client Test User",
    passwordHash: clientUserPasswordHash,
  },
  create: {
    name: "Client Test User",
    email: "client@clientforge.app",
    passwordHash: clientUserPasswordHash,
  },
});

await prisma.membership.upsert({
  where: {
    userId_workspaceId: {
      userId: clientUser.id,
      workspaceId: workspace.id,
    },
  },
  update: {
    role: "CLIENT",
  },
  create: {
    userId: clientUser.id,
    workspaceId: workspace.id,
    role: "CLIENT",
  },
});

  const sampleClients = [
    {
      name: "Northstar Labs",
      email: "hello@northstarlabs.com",
      userId: clientUser.id,
      company: "Northstar Labs",
      status: "ACTIVE",
      notes: "Main retainer client for growth website work.",
    },
    {
      name: "Acme Studio",
      email: "team@acmestudio.com",
      userId: null,
      company: "Acme Studio",
      status: "ACTIVE",
      notes: "Needs fast approval workflow and design feedback.",
    },
    {
      name: "Vertex Health",
      email: "contact@vertexhealth.com",
      userId: null,
      company: "Vertex Health",
      status: "LEAD",
      notes: "Potential new client discussing portal redesign.",
    },
  ];

  for (const client of sampleClients) {
    const updateData = {
      name: client.name,
      userId: client.userId,
      company: client.company,
      status: client.status,
      notes: client.notes,
    };

    const createData = {
      workspaceId: workspace.id,
      userId: client.userId,
      name: client.name,
      email: client.email,
      company: client.company,
      status: client.status,
      notes: client.notes,
    };

    await prisma.client.upsert({
      where: {
        workspaceId_email: {
          workspaceId: workspace.id,
          email: client.email,
        },
      },
      update: updateData,
      create: createData,
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

  if (existingProject) {
    await prisma.project.update({
      where: {
        id: existingProject.id,
      },
      data: {
        clientId: project.clientId,
        title: project.title,
        description: project.description,
        status: project.status,
        progress: project.progress,
        deadline: project.deadline,
      },
    });
  } else {
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

const projects = await prisma.project.findMany({
  where: { workspaceId: workspace.id },
});

const growthWebsite = projects.find((p) => p.title === "Growth Website Redesign");
const clientPortalUi = projects.find((p) => p.title === "Client Portal UI");
const healthcareDashboard = projects.find((p) => p.title === "Healthcare Dashboard");

const sampleDeliverables = [
  {
    projectId: growthWebsite?.id,
    title: "Homepage Mockup",
    type: "FIGMA",
    status: "APPROVED",
    notes: "Initial premium homepage concept ready for review.",
  },
  {
    projectId: growthWebsite?.id,
    title: "Landing Page Copy Draft",
    type: "DOC",
    status: "IN_REVIEW",
    notes: "Copywriting draft for hero, features, and CTA sections.",
  },
  {
    projectId: clientPortalUi?.id,
    title: "Portal UI Review PDF",
    type: "PDF",
    status: "REVISION_REQUESTED",
    notes: "UI review export waiting for final client feedback.",
  },
  {
    projectId: healthcareDashboard?.id,
    title: "Analytics Wireframe",
    type: "FIGMA",
    status: "DRAFT",
    notes: "Initial wireframe for reporting layout and KPI placement.",
  },
];

for (const deliverable of sampleDeliverables) {
  if (!deliverable.projectId) continue;

  const existingDeliverable = await prisma.deliverable.findFirst({
    where: {
      projectId: deliverable.projectId,
      title: deliverable.title,
    },
  });

  if (existingDeliverable) {
    await prisma.deliverable.update({
      where: { id: existingDeliverable.id },
      data: {
        type: deliverable.type,
        status: deliverable.status,
        notes: deliverable.notes,
      },
    });
  } else {
    await prisma.deliverable.create({
      data: {
        projectId: deliverable.projectId,
        title: deliverable.title,
        type: deliverable.type,
        status: deliverable.status,
        notes: deliverable.notes,
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
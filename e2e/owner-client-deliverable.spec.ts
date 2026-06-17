import { expect, type Page, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ownerEmail = "demoacc@gmail.com";
const ownerPassword = "password123";
const clientEmail = "client@clientforge.app";
const clientPassword = "client123";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Login" }).click();
}

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("owner uploads a deliverable and client approves it", async ({ browser }) => {
  const project = await prisma.project.findFirst({
    where: {
      title: "Growth Website Redesign",
      client: {
        userId: {
          not: null,
        },
      },
    },
    include: {
      deliverables: {
        where: {
          title: "Landing Page Copy Draft",
        },
        take: 1,
      },
    },
  });

  const deliverable = project?.deliverables[0];

  expect(project, "seeded Northstar project should exist").toBeTruthy();
  expect(deliverable, "seeded client-visible deliverable should exist").toBeTruthy();

  await prisma.deliverable.update({
    where: {
      id: deliverable!.id,
    },
    data: {
      status: "DRAFT",
    },
  });

  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();

  await login(ownerPage, ownerEmail, ownerPassword);
  await expect(ownerPage).toHaveURL(/\/dashboard/);

  await ownerPage.goto(`/projects/${project!.id}`);
  const ownerDeliverableCard = ownerPage.getByTestId(
    `deliverable-card-${deliverable!.id}`
  );
  await expect(ownerDeliverableCard.getByText("Landing Page Copy Draft")).toBeVisible();

  await ownerPage
    .getByTestId(`deliverable-file-input-${deliverable!.id}`)
    .setInputFiles({
      name: "clientforge-e2e-upload.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("ClientForge e2e upload"),
    });

  await expect(ownerPage.getByText("File uploaded successfully.")).toBeVisible();

  await ownerPage
    .getByTestId(`deliverable-status-${deliverable!.id}-IN_REVIEW`)
    .click();
  await expect(ownerPage.getByText("Status updated to IN_REVIEW.")).toBeVisible();

  await ownerContext.close();

  const clientContext = await browser.newContext();
  const clientPage = await clientContext.newPage();

  await login(clientPage, clientEmail, clientPassword);
  await clientPage.waitForURL(/\/portal/);
  await expect(
    clientPage.getByRole("heading", { name: "Growth Website Redesign" })
  ).toBeVisible();
  const portalDeliverableCard = clientPage.getByTestId(
    `portal-deliverable-card-${deliverable!.id}`
  );
  await expect(portalDeliverableCard.getByText("Landing Page Copy Draft")).toBeVisible();

  await clientPage
    .getByTestId(`client-review-${deliverable!.id}-APPROVED`)
    .click();

  await expect(portalDeliverableCard).toContainText("Approved");

  await clientContext.close();
});

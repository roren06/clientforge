import { test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.join(process.cwd(), "public", "screenshots");

const ownerEmail = "demoacc@gmail.com";
const ownerPassword = "password123";
const clientEmail = "client@clientforge.app";
const clientPassword = "client123";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL(/\/(dashboard|portal)/);
}

async function captureRoute(page: Page, route: string, filename: string) {
  await page.goto(route);
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: path.join(outputDir, filename),
    fullPage: false,
  });
}

test("capture README screenshots", async ({ browser }) => {
  fs.mkdirSync(outputDir, { recursive: true });

  const landingPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await landingPage.goto("/");
  await landingPage.waitForLoadState("networkidle");
  await landingPage.screenshot({
    path: path.join(outputDir, "landing.png"),
    fullPage: false,
  });

  const ownerPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await login(ownerPage, ownerEmail, ownerPassword);

  await captureRoute(ownerPage, "/dashboard", "owner-dashboard.png");
  await captureRoute(ownerPage, "/clients", "clients.png");
  await captureRoute(ownerPage, "/projects", "projects.png");
  await captureRoute(ownerPage, "/analytics", "analytics.png");
  await captureRoute(ownerPage, "/notifications", "notifications.png");

  await ownerPage.goto("/projects");
  await ownerPage.getByRole("link", { name: "Growth Website Redesign" }).first().click();
  await ownerPage.waitForLoadState("networkidle");
  await ownerPage.screenshot({
    path: path.join(outputDir, "project-detail.png"),
    fullPage: false,
  });

  const clientPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await login(clientPage, clientEmail, clientPassword);
  await captureRoute(clientPage, "/portal", "client-portal.png");

  await landingPage.close();
  await ownerPage.close();
  await clientPage.close();
});

/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,email]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - Made the column `email` on table `clients` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "clients_workspaceId_email_key" ON "clients"("workspaceId", "email");

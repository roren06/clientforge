import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { WorkspaceRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUserWithWorkspace } from "@/lib/workspace";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const result = await getCurrentUserWithWorkspace();
  const { id } = await context.params;

  if (!result?.workspace || !result.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["OWNER", "ADMIN"].includes(result.role)) {
    return NextResponse.json(
      { error: "Only owners and admins can invite clients." },
      { status: 403 }
    );
  }

  try {
    const limited = await rateLimit(request, {
      key: "client-invite",
      identifier: rateLimitKey(result.user.id, id),
      limit: 10,
      window: "10 m",
      message: "Too many client invites. Please try again shortly.",
    });

    if (limited) {
      return limited;
    }

    const client = await prisma.client.findFirst({
      where: {
        id,
        workspaceId: result.workspace.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            passwordHash: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found." },
        { status: 404 }
      );
    }

    if (!client.email) {
      return NextResponse.json(
        { error: "Add a client email before inviting portal access." },
        { status: 400 }
      );
    }

    if (client.userId && client.user?.passwordHash) {
      const temporaryPassword = generateTemporaryPassword();
      const passwordHash = await bcrypt.hash(temporaryPassword, 10);

      await prisma.user.update({
        where: { id: client.user.id },
        data: {
          passwordHash,
          mustChangePassword: true,
        },
      });

      return NextResponse.json({
        message:
          "New temporary password generated. The client must change it on next login.",
        clientId: client.id,
        email: client.user.email,
        temporaryPassword,
        status: "ACTIVE",
      });
    }

    const email = client.email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: true,
      },
    });
    const existingWorkspaceMembership = existingUser?.memberships.find(
      (membership) => membership.workspaceId === result.workspace!.id
    );

    if (
      existingWorkspaceMembership &&
      existingWorkspaceMembership.role !== WorkspaceRole.CLIENT
    ) {
      return NextResponse.json(
        {
          error:
            "This email already has internal workspace access. Use a separate client portal email.",
        },
        { status: 409 }
      );
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const issuedTemporaryPassword = !existingUser?.passwordHash;

    const user = existingUser
      ? await prisma.user.update({
          where: {
            id: existingUser.id,
          },
          data: {
            name: existingUser.name || client.name,
            passwordHash: existingUser.passwordHash ?? passwordHash,
            mustChangePassword: issuedTemporaryPassword
              ? true
              : existingUser.mustChangePassword,
          },
        })
      : await prisma.user.create({
          data: {
            name: client.name,
            email,
            passwordHash,
            mustChangePassword: true,
          },
        });

    await prisma.membership.upsert({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: result.workspace.id,
        },
      },
      update: {
        role: WorkspaceRole.CLIENT,
      },
      create: {
        userId: user.id,
        workspaceId: result.workspace.id,
        role: WorkspaceRole.CLIENT,
      },
    });

    await prisma.client.update({
      where: {
        id: client.id,
      },
      data: {
        userId: user.id,
      },
    });

    return NextResponse.json({
      message: existingUser
        ? "Client portal access linked."
        : "Client portal invite created.",
      clientId: client.id,
      email: user.email,
      temporaryPassword: issuedTemporaryPassword ? temporaryPassword : null,
      status: "ACTIVE",
    });
  } catch (error) {
    console.error("Failed to invite client:", error);

    return NextResponse.json(
      { error: "Failed to invite client." },
      { status: 500 }
    );
  }
}

function generateTemporaryPassword() {
  return `clientforge-${randomBytes(4).toString("hex")}`;
}

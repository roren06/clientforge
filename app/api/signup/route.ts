import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { WorkspaceRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  email: z.string().trim().email("Enter a valid email address.").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

function buildWorkspaceSlug(seed: string): string {
  const base = seed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "workspace"}-${suffix}`;
}

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(request, {
      key: "signup",
      limit: 5,
      window: "10 m",
      message: "Too many signup attempts. Please try again later.",
    });

    if (limited) {
      return limited;
    }

    const parsed = await parseJsonBody(request, signupSchema);

    if (!parsed.success) {
      return parsed.response;
    }

    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already in use." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const workspaceSlug = buildWorkspaceSlug(email.split("@")[0] || name);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: `${name}'s Workspace`,
          slug: workspaceSlug,
        },
      });

      await tx.membership.create({
        data: {
          userId: createdUser.id,
          workspaceId: workspace.id,
          role: WorkspaceRole.OWNER,
        },
      });

      return createdUser;
    });

    return NextResponse.json({
      message: "User created successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup failed:", error);

    return NextResponse.json(
      { error: "Failed to create account." },
      { status: 500 }
    );
  }
}
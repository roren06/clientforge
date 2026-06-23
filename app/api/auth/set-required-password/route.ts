import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/guards";
import { requiredPasswordChangeSchema } from "@/lib/password";
import { parseJsonBody } from "@/lib/validation";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const result = await requireWorkspaceAccess();

  try {
    const limited = await rateLimit(request, {
      key: "set-required-password",
      identifier: rateLimitKey(result.user.id),
      limit: 5,
      window: "10 m",
      message: "Too many password change attempts. Please try again later.",
    });

    if (limited) {
      return limited;
    }

    if (!result.user.mustChangePassword) {
      return NextResponse.json(
        { error: "Password change is not required for this account." },
        { status: 400 }
      );
    }

    const parsed = await parseJsonBody(request, requiredPasswordChangeSchema);

    if (!parsed.success) {
      return parsed.response;
    }

    const { newPassword } = parsed.data;
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: result.user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    return NextResponse.json({
      message: "Password updated successfully.",
      mustChangePassword: false,
    });
  } catch (error) {
    console.error("Failed to set required password:", error);

    return NextResponse.json(
      { error: "Failed to update password." },
      { status: 500 }
    );
  }
}

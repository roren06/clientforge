import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/guards";
import { changePasswordSchema } from "@/lib/password";
import { parseJsonBody } from "@/lib/validation";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export async function PATCH(request: Request) {
  const result = await requireWorkspaceAccess();

  try {
    const limited = await rateLimit(request, {
      key: "change-password",
      identifier: rateLimitKey(result.user.id),
      limit: 5,
      window: "10 m",
      message: "Too many password change attempts. Please try again later.",
    });

    if (limited) {
      return limited;
    }

    const parsed = await parseJsonBody(request, changePasswordSchema);

    if (!parsed.success) {
      return parsed.response;
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: result.user.id },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "This account does not have a password set." },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Failed to change password:", error);

    return NextResponse.json(
      { error: "Failed to change password." },
      { status: 500 }
    );
  }
}

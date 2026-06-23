import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { consumePasswordResetToken } from "@/lib/password-reset";
import { resetPasswordSchema } from "@/lib/password";
import { parseJsonBody } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(request, {
      key: "reset-password",
      limit: 5,
      window: "10 m",
      message: "Too many reset attempts. Please try again later.",
    });

    if (limited) {
      return limited;
    }

    const parsed = await parseJsonBody(request, resetPasswordSchema);

    if (!parsed.success) {
      return parsed.response;
    }

    const { token, newPassword } = parsed.data;

    const user = await consumePasswordResetToken(token);

    if (!user) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    return NextResponse.json({
      message: "Password reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("Failed to reset password:", error);

    return NextResponse.json(
      { error: "Failed to reset password." },
      { status: 500 }
    );
  }
}

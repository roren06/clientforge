import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { issuePasswordResetToken } from "@/lib/password-reset";
import { parseJsonBody } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").toLowerCase(),
});

const genericSuccessMessage =
  "If an account exists for that email, a reset link has been sent.";

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(request, {
      key: "forgot-password",
      limit: 5,
      window: "10 m",
      message: "Too many reset requests. Please try again later.",
    });

    if (limited) {
      return limited;
    }

    const parsed = await parseJsonBody(request, forgotPasswordSchema);

    if (!parsed.success) {
      return parsed.response;
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ message: genericSuccessMessage });
    }

    const token = await issuePasswordResetToken(user.id);
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      token,
    });

    return NextResponse.json({
      message: genericSuccessMessage,
      devResetUrl: emailResult.resetUrl,
    });
  } catch (error) {
    console.error("Failed to process forgot password request:", error);

    return NextResponse.json(
      { error: "Failed to process password reset request." },
      { status: 500 }
    );
  }
}

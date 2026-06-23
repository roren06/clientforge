import { getAppBaseUrl } from "@/lib/app-url";

type SendPasswordResetEmailInput = {
  to: string;
  token: string;
};

export async function sendPasswordResetEmail({
  to,
  token,
}: SendPasswordResetEmailInput) {
  const resetUrl = `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.PASSWORD_RESET_FROM_EMAIL || "ClientForge <onboarding@resend.dev>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[password-reset] Reset link for ${to}: ${resetUrl}`);
    }

    return {
      sent: false,
      resetUrl: process.env.NODE_ENV === "development" ? resetUrl : undefined,
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset your ClientForge password",
      html: `
        <p>You requested a password reset for ClientForge.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in one hour. If you did not request this, you can ignore this email.</p>
      `,
    }),
  });

  if (!response.ok) {
    console.error("Failed to send password reset email:", await response.text());
    throw new Error("Failed to send password reset email.");
  }

  return { sent: true, resetUrl: undefined };
}

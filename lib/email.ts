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
      console.info(
        `[password-reset] Email not configured. Reset link for ${to}:\n${resetUrl}`
      );
    } else {
      console.error(
        "[password-reset] RESEND_API_KEY is missing. Password reset email was not sent."
      );
    }

    return { sent: false };
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
        <p>Hi,</p>
        <p>You requested a password reset for your ClientForge account.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:9999px;font-weight:600;">
            Reset your password
          </a>
        </p>
        <p>Or copy this link into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in one hour. If you did not request this, you can ignore this email.</p>
      `,
    }),
  });

  if (!response.ok) {
    console.error("Failed to send password reset email:", await response.text());
    throw new Error("Failed to send password reset email.");
  }

  return { sent: true };
}

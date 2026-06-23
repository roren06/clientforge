import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function createPasswordResetTokenValue() {
  return randomBytes(32).toString("hex");
}

export async function issuePasswordResetToken(userId: string) {
  const token = createPasswordResetTokenValue();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.passwordResetToken.deleteMany({
    where: { userId },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function consumePasswordResetToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: {
      user: true,
    },
  });

  if (!record || record.expiresAt < new Date()) {
    return null;
  }

  await prisma.passwordResetToken.deleteMany({
    where: { userId: record.userId },
  });

  return record.user;
}

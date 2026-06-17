import type { Metadata } from "next";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { getAppBaseUrl } from "@/lib/app-url";


export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: {
    default: "ClientForge - Client Work From Kickoff To Sign-off",
    template: "%s | ClientForge",
  },
  description:
    "A premium client portal SaaS for managing clients, projects, deliverables, approvals, analytics, and scoped client access.",
  openGraph: {
    title: "ClientForge - Client Work From Kickoff To Sign-off",
    description:
      "Manage client work, deliverables, approvals, and portal access in one production-shaped workspace.",
    url: "/",
    siteName: "ClientForge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClientForge - Client Work From Kickoff To Sign-off",
    description:
      "A client portal SaaS for agencies and service teams, built with Next.js, Prisma, PostgreSQL, Cloudinary, and NextAuth.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}


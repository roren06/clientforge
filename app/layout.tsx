import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClientForge",
  description: "Premium client portal SaaS for freelancers, agencies, and small teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
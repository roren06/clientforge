import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ownerRoutes = [
  "/dashboard",
  "/clients",
  "/projects",
  "/analytics",
  "/notifications",
  "/settings",
];

function isOwnerRoute(pathname: string) {
  return ownerRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAllowedWhilePasswordChangeRequired(pathname: string) {
  return (
    pathname === "/portal/set-password" ||
    pathname.startsWith("/api/auth/set-required-password") ||
    pathname.startsWith("/api/auth/session") ||
    pathname === "/api/me/workspace"
  );
}

export async function middleware(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  const pathname = request.nextUrl.pathname;

  const token = await getToken({
    req: request,
    secret,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token.mustChangePassword) {
    if (!isAllowedWhilePasswordChangeRequired(pathname)) {
      return NextResponse.redirect(new URL("/portal/set-password", request.url));
    }

    return NextResponse.next();
  }

  if (token.role === "CLIENT" && isOwnerRoute(pathname)) {
    if (pathname === "/settings" || pathname.startsWith("/settings/")) {
      return NextResponse.redirect(new URL("/portal/settings", request.url));
    }

    return NextResponse.redirect(new URL("/portal", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/clients",
    "/clients/:path*",
    "/projects",
    "/projects/:path*",
    "/analytics",
    "/analytics/:path*",
    "/notifications",
    "/notifications/:path*",
    "/portal",
    "/portal/:path*",
    "/settings",
    "/settings/:path*",
  ],
};

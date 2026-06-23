import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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

  const token = await getToken({
    req: request,
    secret,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token.mustChangePassword) {
    const pathname = request.nextUrl.pathname;

    if (!isAllowedWhilePasswordChangeRequired(pathname)) {
      return NextResponse.redirect(new URL("/portal/set-password", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/projects/:path*",
    "/analytics/:path*",
    "/notifications/:path*",
    "/portal/:path*",
    "/settings/:path*",
  ],
};

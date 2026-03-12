export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/projects/:path*",
    "/analytics/:path*",
    "/notifications/:path*",
    "/settings/:path*",
  ],
};
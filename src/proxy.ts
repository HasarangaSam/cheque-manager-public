import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/cron/") || PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (!request.cookies.has(AUTH_COOKIE_NAME)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

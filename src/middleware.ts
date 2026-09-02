import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

// Public routes that bypass authentication
const PUBLIC_PATHS = new Set(["/login", "/register"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySessionToken(sessionToken);

  // Allow Vercel Cron endpoints to bypass user session auth (secured via CRON_SECRET inside the route handler)
  if (pathname.startsWith("/api/cron/")) {
    return NextResponse.next();
  }

  const isPublicPage = PUBLIC_PATHS.has(pathname);

  // Logged-in user tries to access /login or /register → send to dashboard
  if (isPublicPage && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Unauthenticated user tries to access a protected route → send to /login
  if (!isPublicPage && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public image/media assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

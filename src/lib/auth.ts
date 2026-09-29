import { cookies } from "next/headers";
import { getSessionForToken } from "@/lib/auth-db";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export { AUTH_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth-cookie";

// ---------------------------------------------------------------------------
// Session helpers (Server Components / Server Actions only)
// ---------------------------------------------------------------------------

/** Read and verify the active session from cookies. */
export async function getSession(): Promise<{ username: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return getSessionForToken(token);
}

/**
 * Guard helper for Server Actions.
 * Throws if the request has no valid session.
 */
export async function requireAuth(): Promise<{ username: string }> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: Please log in to perform this action");
  }
  return session;
}

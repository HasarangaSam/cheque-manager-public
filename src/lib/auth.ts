import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// Cookie / JWT configuration
// ---------------------------------------------------------------------------

export const AUTH_COOKIE_NAME = "auth_session";
const DEFAULT_SECRET = "cheque-manager-super-secret-key-32-chars-long-secure-token";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

// ---------------------------------------------------------------------------
// JWT Session
// ---------------------------------------------------------------------------

/** Sign a JWT session token with a 7-day expiration. */
export async function createSessionToken(username: string): Promise<string> {
  const secret = getSecretKey();
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/** Verify a JWT session token — Edge-compatible (no Node.js APIs). */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<{ username: string } | null> {
  if (!token) return null;
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.username === "string") {
      return { username: payload.username };
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Session helpers (Server Components / Server Actions only)
// ---------------------------------------------------------------------------

/** Read and verify the active session from cookies. */
export async function getSession(): Promise<{ username: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return verifySessionToken(token);
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

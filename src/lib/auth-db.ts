/**
 * auth-db.ts — Node.js-only (NOT Edge-compatible)
 * Contains all database-dependent auth operations.
 * Import from Server Actions and Server Components only.
 */

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const BCRYPT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------

/** Hash a plain-text password using bcrypt (12 rounds). */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Verify a plain-text password against a bcrypt hash. */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ---------------------------------------------------------------------------
// Credential verification
// ---------------------------------------------------------------------------

/**
 * Verify credentials against environment variables (developer/master credentials).
 * Returns the username if valid, null otherwise.
 */
export function verifyCredentialsFromEnv(
  username: string,
  password: string
): { username: string } | null {
  const envUsername = process.env.AUTH_USERNAME;
  const envPassword = process.env.AUTH_PASSWORD;

  if (
    envUsername &&
    envPassword &&
    username.trim().toLowerCase() === envUsername.trim().toLowerCase() &&
    password === envPassword
  ) {
    return { username: envUsername.trim() };
  }

  return null;
}

/**
 * Verify credentials against the User table.
 * Returns the user if valid, null otherwise.
 */
export async function verifyCredentialsFromDB(
  username: string,
  password: string
): Promise<{ id: number; username: string } | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
      select: { id: true, username: true, passwordHash: true },
    });

    if (!user) return null;

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) return null;

    return { id: user.id, username: user.username };
  } catch {
    return null;
  }
}

/**
 * Verify credentials against both environment variables and the database.
 * Returns the authenticated username if valid, null otherwise.
 */
export async function verifyUserCredentials(
  username: string,
  password: string
): Promise<{ username: string } | null> {
  // 1. Check developer / admin credentials from environment variables
  const envUser = verifyCredentialsFromEnv(username, password);
  if (envUser) return envUser;

  // 2. Fall back to database credentials
  const dbUser = await verifyCredentialsFromDB(username, password);
  if (dbUser) return { username: dbUser.username };

  return null;
}

/**
 * Check whether any user account exists in the database.
 * Used to determine if registration is still available.
 */
export async function hasAnyUser(): Promise<boolean> {
  try {
    const count = await prisma.user.count();
    return count > 0;
  } catch {
    return false;
  }
}

/**
 * Create the initial user account in the database.
 * Throws if a user already exists (single-user restriction).
 */
export async function createUser(
  username: string,
  password: string
): Promise<{ id: number; username: string }> {
  const existing = await prisma.user.findFirst();
  if (existing) {
    throw new Error("An account already exists. Registration is closed.");
  }

  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: {
      username: username.trim().toLowerCase(),
      passwordHash,
    },
    select: { id: true, username: true },
  });
}

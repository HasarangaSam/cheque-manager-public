"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth";
import {
  createSession,
  revokeSessionToken,
  verifyUserCredentials,
  createUser,
  hasAnyUser,
} from "@/lib/auth-db";

import { loginSchema, registerSchema, formatZodError } from "@/lib/validations";

export type AuthActionResponse = {
  success: boolean;
  error?: string;
};

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export async function loginAction(
  _prevState: AuthActionResponse | null,
  formData: FormData,
): Promise<AuthActionResponse> {
  const parseResult = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parseResult.success) {
    return {
      success: false,
      error: formatZodError(parseResult.error),
    };
  }

  const { username, password } = parseResult.data;
  const user = await verifyUserCredentials(username, password);

  if (!user) {
    return {
      success: false,
      error: "Invalid username or password. Please try again.",
    };
  }

  try {
    const session = await createSession(user.username);
    const cookieStore = await cookies();

    cookieStore.set(AUTH_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });
  } catch (err) {
    console.error("Login session creation error:", err);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }

  // redirect() must be called OUTSIDE the try/catch block.
  // It works by throwing a special Next.js error internally —
  // catching it would swallow the redirect.
  redirect("/");
}

// ---------------------------------------------------------------------------
// Register (one-time — only when no user exists)
// ---------------------------------------------------------------------------

export async function registerAction(
  _prevState: AuthActionResponse | null,
  formData: FormData,
): Promise<AuthActionResponse> {
  // Block if an account already exists
  const alreadyHasUser = await hasAnyUser();
  if (alreadyHasUser) {
    return {
      success: false,
      error: "Registration is closed. An account already exists.",
    };
  }

  const parseResult = registerSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parseResult.success) {
    return {
      success: false,
      error: formatZodError(parseResult.error),
    };
  }

  const { username, password } = parseResult.data;

  try {
    const user = await createUser(username, password);

    // Auto-login after registration
    const session = await createSession(user.username);
    const cookieStore = await cookies();

    cookieStore.set(AUTH_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create account.",
    };
  }

  // redirect() must be called OUTSIDE the try/catch — see loginAction above.
  redirect("/");
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    try {
      await revokeSessionToken(token);
    } catch (error) {
      console.error("Session revocation error:", error);
    }
  }

  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect("/login");
}

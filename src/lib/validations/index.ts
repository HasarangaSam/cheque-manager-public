import { z } from "zod";

export * from "./auth";
export * from "./customer";
export * from "./cheque";

/**
 * Extracts a concise, user-friendly error message from a ZodError
 */
export function formatZodError(error: z.ZodError): string {
  if (error.issues && error.issues.length > 0) {
    return error.issues[0].message;
  }
  return "Invalid input data";
}

/**
 * Extracts all field-level validation error messages as a key-value record
 */
export function getZodFieldErrors(
  error: z.ZodError
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.join(".") || "form";
    if (!result[field]) {
      result[field] = [];
    }
    result[field].push(issue.message);
  }
  return result;
}

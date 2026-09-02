import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string({ error: "Username is required." })
    .trim()
    .min(1, "Username is required."),
  password: z
    .string({ error: "Password is required." })
    .min(1, "Password is required."),
});

export const registerSchema = z
  .object({
    username: z
      .string({ error: "Username is required." })
      .trim()
      .min(3, "Username must be at least 3 characters.")
      .max(50, "Username must be at most 50 characters."),
    password: z
      .string({ error: "Password is required." })
      .min(8, "Password must be at least 8 characters.")
      .max(100, "Password must be at most 100 characters."),
    confirmPassword: z
      .string({ error: "Please confirm your password." })
      .min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

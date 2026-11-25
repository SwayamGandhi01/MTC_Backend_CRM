import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid work email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password is too long"),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

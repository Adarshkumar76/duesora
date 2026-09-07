import { z } from "zod";
import { sanitizeString, stripHtml, sanitizeEmail } from "../security/sanitize";

export const registerSchema = z
  .object({
    name: z
      .string()
      .transform((val) => stripHtml(val))
      .pipe(
        z
          .string()
          .min(2, "Name must be at least 2 characters")
          .max(120, "Name must not exceed 120 characters")
          .refine((val) => !/[<>]/.test(val), {
            message: "Name cannot contain HTML or script characters",
          }),
      ),
    email: z
      .string()
      .transform((val) => sanitizeEmail(val))
      .pipe(
        z
          .string()
          .email("Please provide a valid email address")
          .max(254, "Email must not exceed 254 characters")
          .refine((val) => !/[\r\n\0]/.test(val), {
            message: "Email contains invalid control characters",
          }),
      ),
    password: z
      .string()
      .refine((val) => !val.includes("\0"), {
        message: "Password cannot contain null bytes",
      })
      .pipe(
        z
          .string()
          .min(8, "Password must be at least 8 characters")
          .max(100, "Password must not exceed 100 characters"),
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptedTerms: z
      .boolean()
      .refine((val) => val === true, "You must accept the terms of service"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

import "server-only";
import { z } from "zod";

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    APP_URL: z.string().optional(),
    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL must be a non-empty string")
      .optional(),
    REDIS_URL: z
      .string()
      .min(1, "REDIS_URL must be a non-empty string")
      .optional(),
    AUTH_SECRET: z.string().optional(),
    NEXTAUTH_SECRET: z.string().optional(),
    ENCRYPTION_KEY: z.string().optional(),
    AUTH_GITHUB_ID: z.string().optional(),
    AUTH_GITHUB_SECRET: z.string().optional(),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    APP_URL:
      data.APP_URL ||
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"),
    DATABASE_URL:
      data.DATABASE_URL ||
      (data.NODE_ENV === "production"
        ? ""
        : "postgresql://duesora:duesora@localhost:5432/duesora"),
    REDIS_URL:
      data.REDIS_URL ||
      (data.NODE_ENV === "production" ? "" : "redis://localhost:6379"),
  }))
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production") {
      if (!data.DATABASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "DATABASE_URL is required in production environment",
          path: ["DATABASE_URL"],
        });
      }
      if (!data.REDIS_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "REDIS_URL is required in production environment",
          path: ["REDIS_URL"],
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formattedErrors = result.error.format();
    console.error("❌ Invalid environment variables:", JSON.stringify(formattedErrors, null, 2));
    throw new Error("Invalid environment configuration");
  }

  return result.data;
}

export const env = parseEnv();

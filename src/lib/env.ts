import "server-only";
import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL must be a non-empty string")
    .default("postgresql://duesora:duesora@localhost:5432/duesora"),
  REDIS_URL: z
    .string()
    .min(1, "REDIS_URL must be a non-empty string")
    .default("redis://localhost:6379"),
  AUTH_SECRET: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
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

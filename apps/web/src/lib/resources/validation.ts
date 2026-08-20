import { z } from "zod";

export const resourceTypeSchema = z.enum([
  "domain",
  "ssl_certificate",
  "subscription",
  "hosting",
  "cloud_service",
  "software_license",
  "contract",
  "warranty",
  "document",
  "custom",
]);

export const createResourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or less"),

  type: resourceTypeSchema,

  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or less")
    .nullable()
    .optional(),

  provider: z
    .string()
    .trim()
    .max(120, "Provider must be 120 characters or less")
    .nullable()
    .optional(),

  websiteUrl: z
    .string()
    .trim()
    .url("Website URL must be valid")
    .max(2048)
    .nullable()
    .optional(),
});

export type CreateResourceRequest = z.infer<typeof createResourceSchema>;

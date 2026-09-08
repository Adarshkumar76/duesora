import { z } from "zod";
import { stripHtml, sanitizeString, isSafeUrl } from "../security/sanitize";

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
    .transform((val) => stripHtml(val))
    .pipe(
      z
        .string()
        .min(1, "Name is required")
        .max(200, "Name must be 200 characters or less")
        .refine((val) => !/[<>]/.test(val), {
          message: "Name cannot contain HTML or script characters",
        }),
    ),

  type: resourceTypeSchema,

  description: z
    .string()
    .transform((val) => stripHtml(val))
    .pipe(z.string().max(2000, "Description must be 2000 characters or less"))
    .nullable()
    .optional(),

  provider: z
    .string()
    .transform((val) => stripHtml(val))
    .pipe(
      z
        .string()
        .max(120, "Provider must be 120 characters or less")
        .refine((val) => !/[<>]/.test(val), {
          message: "Provider cannot contain HTML tags",
        }),
    )
    .nullable()
    .optional(),

  websiteUrl: z
    .string()
    .transform((val) => sanitizeString(val))
    .pipe(
      z
        .string()
        .url("Website URL must be valid")
        .max(2048)
        .refine((val) => isSafeUrl(val), {
          message: "Website URL must use http or https protocol",
        }),
    )
    .nullable()
    .optional(),

  amountMinor: z.number().int().min(0).nullable().optional(),

  currency: z.string().length(3).default("USD"),

  billingCycle: z
    .enum(["yearly", "monthly", "quarterly", "one_time", "lifetime"])
    .default("yearly"),

  renewalDate: z.string().nullable().optional(),

  autoRenew: z.boolean().default(true),
});

export type CreateResourceRequest = z.infer<typeof createResourceSchema>;

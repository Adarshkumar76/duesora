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

export function normalizeWebsiteUrl(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return null;
  const trimmed = sanitizeString(raw);
  if (!trimmed) return null;

  const target = trimmed;
  // If it already has a protocol:
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//i.test(target)) {
    try {
      const u = new URL(target);
      if ((u.protocol === "http:" || u.protocol === "https:") && isSafeUrl(target)) {
        return target;
      }
      return null;
    } catch {
      return null;
    }
  }

  // If no protocol, test with https://
  try {
    const withHttps = `https://${target}`;
    const u = new URL(withHttps);
    if (u.hostname && (u.hostname.includes(".") || u.hostname === "localhost") && isSafeUrl(withHttps)) {
      return withHttps;
    }
  } catch {
    return null;
  }

  return null;
}

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
        .max(2048)
        .refine(
          (val) => {
            if (!val) return true;
            return normalizeWebsiteUrl(val) !== null;
          },
          {
            message: "Website URL must be a valid domain or http/https URL",
          }
        )
        .transform((val) => {
          if (!val) return null;
          return normalizeWebsiteUrl(val);
        })
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

  category: z
    .string()
    .transform((val) => stripHtml(val))
    .pipe(
      z
        .string()
        .max(60, "Category must be 60 characters or less")
        .refine((val) => !/[<>]/.test(val), {
          message: "Category cannot contain HTML tags",
        }),
    )
    .nullable()
    .optional(),

  ownerId: z.string().uuid("Invalid owner user ID").nullable().optional(),

  tags: z
    .array(
      z
        .string()
        .transform((val) => stripHtml(val))
        .pipe(
          z
            .string()
            .min(1, "Tag cannot be empty")
            .max(50, "Tag must be 50 characters or less")
            .refine((val) => !/[<>]/.test(val), {
              message: "Tag cannot contain HTML tags",
            }),
        ),
    )
    .max(20, "Cannot add more than 20 tags")
    .optional(),
});

export type CreateResourceRequest = z.infer<typeof createResourceSchema>;

export const updateResourceSchema = createResourceSchema
  .partial()
  .extend({
    status: z.enum(["active", "inactive", "expired", "archived"]).optional(),
    changeReason: z.string().max(255).optional(),
  });

export type UpdateResourceRequest = z.infer<typeof updateResourceSchema>;


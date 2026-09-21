import { z } from "zod";
import { isSafeUrl } from "@/lib/security/sanitize";

export const WEBHOOK_SUPPORTED_EVENTS = [
  "*",
  "resource.created",
  "resource.updated",
  "resource.deleted",
  "reminder.dispatched",
  "endpoint.test",
] as const;

export const createWebhookSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Webhook URL is required")
    .max(2048, "Webhook URL must not exceed 2048 characters")
    .refine((val) => isSafeUrl(val), {
      message: "Webhook URL must use a valid http or https protocol",
    }),
  description: z
    .string()
    .trim()
    .max(255, "Description must not exceed 255 characters")
    .optional()
    .nullable(),
  secret: z
    .string()
    .trim()
    .min(16, "Secret must be at least 16 characters")
    .max(255, "Secret must not exceed 255 characters")
    .optional()
    .nullable(),
  events: z
    .array(z.string().trim())
    .min(1, "At least one event must be selected")
    .optional()
    .default(["*"]),
  active: z.boolean().optional().default(true),
});

export const updateWebhookSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Webhook URL is required")
    .max(2048, "Webhook URL must not exceed 2048 characters")
    .refine((val) => isSafeUrl(val), {
      message: "Webhook URL must use a valid http or https protocol",
    })
    .optional(),
  description: z
    .string()
    .trim()
    .max(255, "Description must not exceed 255 characters")
    .optional()
    .nullable(),
  events: z
    .array(z.string().trim())
    .min(1, "At least one event must be selected")
    .optional(),
  active: z.boolean().optional(),
});

import { z } from "zod";
import { stripHtml } from "../security/sanitize";

export const tagColorTokens = [
  "slate",
  "red",
  "orange",
  "amber",
  "emerald",
  "teal",
  "cyan",
  "blue",
  "indigo",
  "purple",
  "pink",
  "rose",
] as const;

export const createTagSchema = z.object({
  name: z
    .string()
    .transform((val) => stripHtml(val).trim())
    .pipe(
      z
        .string()
        .min(1, "Tag name is required")
        .max(50, "Tag name must be 50 characters or less")
        .refine((val) => !/[<>]/.test(val), {
          message: "Tag name cannot contain HTML tags",
        }),
    ),
  colorToken: z.enum(tagColorTokens).default("slate"),
});

export type CreateTagRequest = z.infer<typeof createTagSchema>;

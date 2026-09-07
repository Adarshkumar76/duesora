import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { resources } from "@/db/schema";

export type CreateResourceInput = {
  workspaceId: string;
  name: string;
  type:
    | "domain"
    | "ssl_certificate"
    | "subscription"
    | "hosting"
    | "cloud_service"
    | "software_license"
    | "contract"
    | "warranty"
    | "document"
    | "custom";
  description?: string | null;
  provider?: string | null;
  websiteUrl?: string | null;
};

export async function createResource(input: CreateResourceInput) {
  const db = getDb();

  const [resource] = await db
    .insert(resources)
    .values({
      workspaceId: input.workspaceId,
      name: input.name,
      type: input.type,
      description: input.description ?? null,
      provider: input.provider ?? null,
      websiteUrl: input.websiteUrl ?? null,
    })
    .returning();

  return resource;
}

export async function listResources(workspaceId: string) {
  const db = getDb();

  return db
    .select()
    .from(resources)
    .where(eq(resources.workspaceId, workspaceId));
}

export async function getResourceById(
  workspaceId: string,
  resourceId: string
) {
  const db = getDb();

  const [resource] = await db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.id, resourceId),
        eq(resources.workspaceId, workspaceId)
      )
    )
    .limit(1);

  return resource ?? null;
}
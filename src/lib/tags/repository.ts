import { and, eq, sql, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { tags, resourceTags } from "@/db/schema";

export type TagItem = {
  id: string;
  workspaceId: string;
  name: string;
  colorToken: string;
  resourceCount?: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function listWorkspaceTags(workspaceId: string): Promise<TagItem[]> {
  const db = getDb();

  const results = await db
    .select({
      id: tags.id,
      workspaceId: tags.workspaceId,
      name: tags.name,
      colorToken: tags.colorToken,
      resourceCount: sql<number>`count(${resourceTags.resourceId})::int`,
      createdAt: tags.createdAt,
      updatedAt: tags.updatedAt,
    })
    .from(tags)
    .leftJoin(resourceTags, eq(tags.id, resourceTags.tagId))
    .where(eq(tags.workspaceId, workspaceId))
    .groupBy(tags.id)
    .orderBy(tags.name);

  return results;
}

export async function findOrCreateTagsByName(
  workspaceId: string,
  tagNames: string[],
  defaultColorToken = "slate"
): Promise<TagItem[]> {
  if (tagNames.length === 0) return [];
  const db = getDb();

  const uniqueNames = Array.from(
    new Set(tagNames.map((n) => n.trim()).filter((n) => n.length > 0))
  );

  if (uniqueNames.length === 0) return [];

  // Query existing tags in this workspace
  const existingTags = await db
    .select()
    .from(tags)
    .where(
      and(
        eq(tags.workspaceId, workspaceId),
        inArray(tags.name, uniqueNames)
      )
    );

  const existingMap = new Map(existingTags.map((t) => [t.name.toLowerCase(), t]));
  const missingNames = uniqueNames.filter(
    (name) => !existingMap.has(name.toLowerCase())
  );

  const createdTags: TagItem[] = [];
  if (missingNames.length > 0) {
    const inserted = await db
      .insert(tags)
      .values(
        missingNames.map((name) => ({
          workspaceId,
          name,
          colorToken: defaultColorToken,
        }))
      )
      .onConflictDoNothing()
      .returning();
    createdTags.push(...inserted);
  }

  // Fetch all matching tags after creation
  const allTags = await db
    .select()
    .from(tags)
    .where(
      and(
        eq(tags.workspaceId, workspaceId),
        inArray(tags.name, uniqueNames)
      )
    );

  return allTags;
}

export async function setResourceTags(
  resourceId: string,
  tagIds: string[]
): Promise<void> {
  const db = getDb();

  // Remove existing tags for this resource
  await db.delete(resourceTags).where(eq(resourceTags.resourceId, resourceId));

  if (tagIds.length > 0) {
    await db
      .insert(resourceTags)
      .values(
        tagIds.map((tagId) => ({
          resourceId,
          tagId,
        }))
      )
      .onConflictDoNothing();
  }
}

export async function getTagsForResource(resourceId: string): Promise<TagItem[]> {
  const db = getDb();

  const results = await db
    .select({
      id: tags.id,
      workspaceId: tags.workspaceId,
      name: tags.name,
      colorToken: tags.colorToken,
      createdAt: tags.createdAt,
      updatedAt: tags.updatedAt,
    })
    .from(tags)
    .innerJoin(resourceTags, eq(tags.id, resourceTags.tagId))
    .where(eq(resourceTags.resourceId, resourceId))
    .orderBy(tags.name);

  return results;
}

export async function getTagsForResources(
  resourceIds: string[]
): Promise<Map<string, TagItem[]>> {
  const map = new Map<string, TagItem[]>();
  if (resourceIds.length === 0) return map;

  const db = getDb();

  const rows = await db
    .select({
      resourceId: resourceTags.resourceId,
      tag: {
        id: tags.id,
        workspaceId: tags.workspaceId,
        name: tags.name,
        colorToken: tags.colorToken,
        createdAt: tags.createdAt,
        updatedAt: tags.updatedAt,
      },
    })
    .from(resourceTags)
    .innerJoin(tags, eq(resourceTags.tagId, tags.id))
    .where(inArray(resourceTags.resourceId, resourceIds))
    .orderBy(tags.name);

  for (const row of rows) {
    const list = map.get(row.resourceId) ?? [];
    list.push(row.tag);
    map.set(row.resourceId, list);
  }

  return map;
}

export async function createTag(
  workspaceId: string,
  name: string,
  colorToken = "slate"
): Promise<TagItem> {
  const db = getDb();

  const [tag] = await db
    .insert(tags)
    .values({
      workspaceId,
      name: name.trim(),
      colorToken,
    })
    .returning();

  return tag;
}

export async function deleteWorkspaceTag(
  workspaceId: string,
  tagId: string
): Promise<boolean> {
  const db = getDb();

  const [deleted] = await db
    .delete(tags)
    .where(and(eq(tags.id, tagId), eq(tags.workspaceId, workspaceId)))
    .returning();

  return Boolean(deleted);
}

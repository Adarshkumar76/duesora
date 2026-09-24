import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { resources, resourceTags, tags } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { findOrCreateTagsByName } from "@/lib/tags/repository";
import { recordAuditEvent } from "@/lib/audit/service";
import { emitWorkspaceWebhook } from "@/lib/webhooks/dispatcher";

export type BulkResourceAction =
  | {
      action: "bulk_tag";
      resourceIds: string[];
      tags: string[];
      mode?: "add" | "remove" | "replace";
    }
  | {
      action: "bulk_owner";
      resourceIds: string[];
      ownerId: string | null;
    }
  | {
      action: "bulk_status";
      resourceIds: string[];
      status: "active" | "inactive" | "expired" | "archived";
    }
  | {
      action: "bulk_delete";
      resourceIds: string[];
    };

export interface BulkActionResult {
  success: boolean;
  action: BulkResourceAction["action"];
  affectedCount: number;
  affectedIds: string[];
  message: string;
}

export async function bulkPerformResourceAction(
  userId: string,
  workspaceId: string,
  input: BulkResourceAction
): Promise<BulkActionResult> {
  // 1. Authorization: user must have at least "member" role
  await requireWorkspaceRole(userId, workspaceId, "member");

  if (!input.resourceIds || input.resourceIds.length === 0) {
    return {
      success: true,
      action: input.action,
      affectedCount: 0,
      affectedIds: [],
      message: "No resource IDs provided",
    };
  }

  const db = getDb();

  // 2. Fetch existing resources in this workspace (strictly prevent IDOR)
  const existingResources = await db
    .select({ id: resources.id, name: resources.name })
    .from(resources)
    .where(
      and(
        eq(resources.workspaceId, workspaceId),
        inArray(resources.id, input.resourceIds)
      )
    );

  if (existingResources.length === 0) {
    return {
      success: true,
      action: input.action,
      affectedCount: 0,
      affectedIds: [],
      message: "No matching resources found in this workspace",
    };
  }

  const validIds = existingResources.map((r) => r.id);

  // 3. Process the specified bulk action
  switch (input.action) {
    case "bulk_status": {
      await db
        .update(resources)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(resources.workspaceId, workspaceId),
            inArray(resources.id, validIds)
          )
        );

      recordAuditEvent({
        workspaceId,
        actorId: userId,
        action: "resource.bulk_status_changed",
        entityType: "resource",
        entityId: validIds[0],
        entityName: `${validIds.length} resources`,
        details: {
          count: validIds.length,
          resourceIds: validIds,
          newStatus: input.status,
        },
      }).catch(() => {});

      emitWorkspaceWebhook(workspaceId, "resource.updated", {
        bulk: true,
        action: "bulk_status",
        resourceIds: validIds,
        newStatus: input.status,
      }).catch(() => {});

      return {
        success: true,
        action: "bulk_status",
        affectedCount: validIds.length,
        affectedIds: validIds,
        message: `Updated status to "${input.status}" for ${validIds.length} resource${
          validIds.length > 1 ? "s" : ""
        }.`,
      };
    }

    case "bulk_owner": {
      await db
        .update(resources)
        .set({
          ownerId: input.ownerId ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(resources.workspaceId, workspaceId),
            inArray(resources.id, validIds)
          )
        );

      recordAuditEvent({
        workspaceId,
        actorId: userId,
        action: "resource.bulk_owner_assigned",
        entityType: "resource",
        entityId: validIds[0],
        entityName: `${validIds.length} resources`,
        details: {
          count: validIds.length,
          resourceIds: validIds,
          newOwnerId: input.ownerId,
        },
      }).catch(() => {});

      emitWorkspaceWebhook(workspaceId, "resource.updated", {
        bulk: true,
        action: "bulk_owner",
        resourceIds: validIds,
        newOwnerId: input.ownerId,
      }).catch(() => {});

      return {
        success: true,
        action: "bulk_owner",
        affectedCount: validIds.length,
        affectedIds: validIds,
        message: input.ownerId
          ? `Assigned owner to ${validIds.length} resource${
              validIds.length > 1 ? "s" : ""
            }.`
          : `Removed owner from ${validIds.length} resource${
              validIds.length > 1 ? "s" : ""
            }.`,
      };
    }

    case "bulk_tag": {
      const mode = input.mode || "add";

      if (mode === "remove") {
        if (input.tags.length > 0) {
          const matchingTags = await db
            .select({ id: tags.id })
            .from(tags)
            .where(
              and(
                eq(tags.workspaceId, workspaceId),
                inArray(tags.name, input.tags)
              )
            );

          if (matchingTags.length > 0) {
            const tagIdsToRemove = matchingTags.map((t) => t.id);
            await db
              .delete(resourceTags)
              .where(
                and(
                  inArray(resourceTags.resourceId, validIds),
                  inArray(resourceTags.tagId, tagIdsToRemove)
                )
              );
          }
        }
      } else if (mode === "replace") {
        // Clear existing tags
        await db
          .delete(resourceTags)
          .where(inArray(resourceTags.resourceId, validIds));

        // Insert new tags if any
        if (input.tags.length > 0) {
          const tagItems = await findOrCreateTagsByName(
            workspaceId,
            input.tags
          );
          const pairs = validIds.flatMap((resId) =>
            tagItems.map((t) => ({
              resourceId: resId,
              tagId: t.id,
            }))
          );
          if (pairs.length > 0) {
            await db
              .insert(resourceTags)
              .values(pairs)
              .onConflictDoNothing();
          }
        }
      } else {
        // Mode === "add"
        if (input.tags.length > 0) {
          const tagItems = await findOrCreateTagsByName(
            workspaceId,
            input.tags
          );
          const pairs = validIds.flatMap((resId) =>
            tagItems.map((t) => ({
              resourceId: resId,
              tagId: t.id,
            }))
          );
          if (pairs.length > 0) {
            await db
              .insert(resourceTags)
              .values(pairs)
              .onConflictDoNothing();
          }
        }
      }

      recordAuditEvent({
        workspaceId,
        actorId: userId,
        action: "resource.bulk_tagged",
        entityType: "resource",
        entityId: validIds[0],
        entityName: `${validIds.length} resources`,
        details: {
          count: validIds.length,
          resourceIds: validIds,
          tags: input.tags,
          mode,
        },
      }).catch(() => {});

      return {
        success: true,
        action: "bulk_tag",
        affectedCount: validIds.length,
        affectedIds: validIds,
        message: `Updated tags (${mode}) for ${validIds.length} resource${
          validIds.length > 1 ? "s" : ""
        }.`,
      };
    }

    case "bulk_delete": {
      await db
        .delete(resources)
        .where(
          and(
            eq(resources.workspaceId, workspaceId),
            inArray(resources.id, validIds)
          )
        );

      recordAuditEvent({
        workspaceId,
        actorId: userId,
        action: "resource.bulk_deleted",
        entityType: "resource",
        entityId: validIds[0],
        entityName: `${validIds.length} resources`,
        details: {
          count: validIds.length,
          resourceIds: validIds,
          deletedNames: existingResources.map((r) => r.name),
        },
      }).catch(() => {});

      emitWorkspaceWebhook(workspaceId, "resource.deleted", {
        bulk: true,
        resourceIds: validIds,
      }).catch(() => {});

      return {
        success: true,
        action: "bulk_delete",
        affectedCount: validIds.length,
        affectedIds: validIds,
        message: `Deleted ${validIds.length} resource${
          validIds.length > 1 ? "s" : ""
        }.`,
      };
    }

    default: {
      throw new Error("INVALID_BULK_ACTION");
    }
  }
}

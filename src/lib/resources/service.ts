import {
  createResource,
  getResourceById,
  listResources,
  deleteResource,
  updateResource,
  type CreateResourceInput,
  type UpdateResourceInput,
  type ListResourcesOptions,
} from "./repository";

import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { emitWorkspaceWebhook } from "@/lib/webhooks/dispatcher";

export { getResourceById };

export async function getWorkspaceResource(
  userId: string,
  workspaceId: string,
  resourceId: string
) {
  await requireWorkspaceRole(userId, workspaceId, "viewer");

  return getResourceById(workspaceId, resourceId);
}

export async function listWorkspaceResources(
  userId: string,
  workspaceId: string,
  options?: ListResourcesOptions
) {
  await requireWorkspaceRole(userId, workspaceId, "viewer");

  return options !== undefined
    ? listResources(workspaceId, options)
    : listResources(workspaceId);
}

export async function createWorkspaceResource(
  userId: string,
  input: CreateResourceInput
) {
  await requireWorkspaceRole(
    userId,
    input.workspaceId,
    "member"
  );

  const resource = await createResource(input);

  // Emit outbound webhook event asynchronously
  emitWorkspaceWebhook(input.workspaceId, "resource.created", resource as unknown as Record<string, unknown>).catch(() => {});

  return resource;
}

export async function deleteWorkspaceResource(
  userId: string,
  workspaceId: string,
  resourceId: string
) {
  await requireWorkspaceRole(userId, workspaceId, "member");

  const success = await deleteResource(workspaceId, resourceId);

  if (success) {
    emitWorkspaceWebhook(workspaceId, "resource.deleted", { resourceId, deleted: true }).catch(() => {});
  }

  return success;
}

export async function updateWorkspaceResource(
  userId: string,
  workspaceId: string,
  resourceId: string,
  input: UpdateResourceInput
) {
  await requireWorkspaceRole(userId, workspaceId, "member");

  const updated = await updateResource(workspaceId, resourceId, input);

  if (updated) {
    emitWorkspaceWebhook(workspaceId, "resource.updated", updated as unknown as Record<string, unknown>).catch(() => {});
  }

  return updated;
}
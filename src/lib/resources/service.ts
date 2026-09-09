import {
  createResource,
  getResourceById,
  listResources,
  deleteResource,
  type CreateResourceInput,
  type ListResourcesOptions,
} from "./repository";

import { requireWorkspaceRole } from "@/lib/auth/workspace";

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

  return createResource(input);
}

export async function deleteWorkspaceResource(
  userId: string,
  workspaceId: string,
  resourceId: string
) {
  await requireWorkspaceRole(userId, workspaceId, "member");

  return deleteResource(workspaceId, resourceId);
}
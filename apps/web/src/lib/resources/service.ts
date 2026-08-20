import {
  createResource,
  getResourceById,
  listResources,
  type CreateResourceInput,
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
  workspaceId: string
) {
  await requireWorkspaceRole(userId, workspaceId, "viewer");

  return listResources(workspaceId);
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
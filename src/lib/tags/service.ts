import { requireWorkspaceRole } from "@/lib/auth/workspace";
import {
  listWorkspaceTags as listTagsRepo,
  createTag as createTagRepo,
  deleteWorkspaceTag as deleteTagRepo,
  type TagItem,
} from "./repository";

export async function listWorkspaceTags(
  userId: string,
  workspaceId: string
): Promise<TagItem[]> {
  await requireWorkspaceRole(userId, workspaceId, "viewer");
  return listTagsRepo(workspaceId);
}

export async function createWorkspaceTag(
  userId: string,
  workspaceId: string,
  name: string,
  colorToken = "slate"
): Promise<TagItem> {
  await requireWorkspaceRole(userId, workspaceId, "member");
  return createTagRepo(workspaceId, name, colorToken);
}

export async function deleteWorkspaceTag(
  userId: string,
  workspaceId: string,
  tagId: string
): Promise<boolean> {
  await requireWorkspaceRole(userId, workspaceId, "member");
  return deleteTagRepo(workspaceId, tagId);
}

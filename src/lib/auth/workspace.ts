import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { memberships } from "@/db/schema";
import { hasMinimumRole, type WorkspaceRole } from "./permissions";

export async function getWorkspaceMembership(
  userId: string,
  workspaceId: string
) {
  const db = getDb();

  const [membership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.workspaceId, workspaceId)
      )
    )
    .limit(1);

  return membership ?? null;
}

export async function requireWorkspaceRole(
  userId: string,
  workspaceId: string,
  requiredRole: WorkspaceRole
) {
  const membership = await getWorkspaceMembership(userId, workspaceId);

  if (!membership) {
    throw new Error("FORBIDDEN");
  }

  if (!hasMinimumRole(membership.role, requiredRole)) {
    throw new Error("FORBIDDEN");
  }

  return membership;
}
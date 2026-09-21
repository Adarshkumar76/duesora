import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { memberships, workspaces, users } from "@/db/schema";
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

export async function listUserWorkspaces(userId: string) {
  const db = getDb();

  return db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      type: workspaces.type,
      defaultCurrency: workspaces.defaultCurrency,
      timezone: workspaces.timezone,
      role: memberships.role,
      joinedAt: memberships.createdAt,
    })
    .from(memberships)
    .innerJoin(workspaces, eq(memberships.workspaceId, workspaces.id))
    .where(eq(memberships.userId, userId));
}

export async function listWorkspaceMembers(userId: string, workspaceId: string) {
  await requireWorkspaceRole(userId, workspaceId, "viewer");
  const db = getDb();

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: memberships.role,
      joinedAt: memberships.createdAt,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.workspaceId, workspaceId))
    .orderBy(users.name);
}
import crypto from "crypto";
import { getDb } from "@/db";
import {
  workspaces,
  memberships,
  users,
  workspaceInvitations,
} from "@/db/schema";
import { and, eq, gt, isNull, desc } from "drizzle-orm";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { type WorkspaceRole } from "@/lib/auth/permissions";
import { sendTeamInvitationEmail } from "@/lib/notifications/email";
import { recordAuditEvent } from "@/lib/audit/service";
import { getAppBaseUrl } from "@/lib/url";

export interface TeamMemberItem {
  id: string;
  name: string | null;
  email: string;
  role: WorkspaceRole;
  joinedAt: Date;
}

export interface WorkspaceInvitationItem {
  id: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  invitedBy: string;
  inviterName?: string | null;
  expiresAt: Date;
  createdAt: Date;
}

export interface WorkspaceTeamOverview {
  members: TeamMemberItem[];
  invitations: WorkspaceInvitationItem[];
  currentUserRole: WorkspaceRole;
}

/**
 * Creates a new invitation or refreshes an existing unaccepted invitation.
 */
export async function createWorkspaceInvitation({
  workspaceId,
  callerUserId,
  email,
  role,
  appUrl,
}: {
  workspaceId: string;
  callerUserId: string;
  email: string;
  role: "admin" | "member" | "viewer";
  appUrl?: string;
}): Promise<{ invitationId: string; token: string; inviteUrl: string }> {
  // 1. Caller must have admin or owner permission
  await requireWorkspaceRole(callerUserId, workspaceId, "admin");

  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();

  // 2. Check if user with this email is already a member
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingUser) {
    const [existingMembership] = await db
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(
          eq(memberships.workspaceId, workspaceId),
          eq(memberships.userId, existingUser.id)
        )
      )
      .limit(1);

    if (existingMembership) {
      throw new Error("ALREADY_MEMBER");
    }
  }

  // 3. Fetch workspace and inviter details for the email notification
  const [workspace] = await db
    .select({ name: workspaces.name })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    throw new Error("WORKSPACE_NOT_FOUND");
  }

  const [inviter] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, callerUserId))
    .limit(1);

  // 4. Generate token and 7-day expiration
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // 5. Upsert invitation
  const [existingInvite] = await db
    .select({ id: workspaceInvitations.id })
    .from(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.workspaceId, workspaceId),
        eq(workspaceInvitations.email, normalizedEmail)
      )
    )
    .limit(1);

  let invitationId: string;

  if (existingInvite) {
    invitationId = existingInvite.id;
    await db
      .update(workspaceInvitations)
      .set({
        token,
        role,
        invitedBy: callerUserId,
        expiresAt,
        acceptedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(workspaceInvitations.id, existingInvite.id));
  } else {
    const [inserted] = await db
      .insert(workspaceInvitations)
      .values({
        workspaceId,
        email: normalizedEmail,
        role,
        token,
        invitedBy: callerUserId,
        expiresAt,
      })
      .returning({ id: workspaceInvitations.id });

    invitationId = inserted.id;
  }

  const cleanAppUrl = getAppBaseUrl(appUrl);
  const inviteUrl = `${cleanAppUrl}/invite/${token}`;

  // 6. Send invitation email asynchronously
  await sendTeamInvitationEmail({
    to: normalizedEmail,
    inviterName: inviter?.name || inviter?.email || "A team member",
    workspaceName: workspace.name,
    role,
    inviteToken: token,
    expiresAt,
    appUrl: cleanAppUrl,
  }).catch((err) => {
    console.error("Failed sending team invitation email:", err);
  });

  recordAuditEvent({
    workspaceId,
    actorId: callerUserId,
    action: "member.invited",
    entityType: "invitation",
    entityId: invitationId,
    entityName: normalizedEmail,
    details: { role },
  }).catch(() => {});

  return {
    invitationId,
    token,
    inviteUrl,
  };
}

/**
 * Lists all active members and pending invitations for a workspace.
 */
export async function listWorkspaceTeam(
  workspaceId: string,
  callerUserId: string
): Promise<WorkspaceTeamOverview> {
  const callerMembership = await requireWorkspaceRole(callerUserId, workspaceId, "viewer");
  const db = getDb();
  const now = new Date();

  // 1. Fetch active members
  const memberRows = await db
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
    .orderBy(desc(memberships.role), users.name);

  // 2. Fetch active pending invitations
  const inviteRows = await db
    .select({
      id: workspaceInvitations.id,
      email: workspaceInvitations.email,
      role: workspaceInvitations.role,
      token: workspaceInvitations.token,
      invitedBy: workspaceInvitations.invitedBy,
      inviterName: users.name,
      expiresAt: workspaceInvitations.expiresAt,
      createdAt: workspaceInvitations.createdAt,
    })
    .from(workspaceInvitations)
    .leftJoin(users, eq(workspaceInvitations.invitedBy, users.id))
    .where(
      and(
        eq(workspaceInvitations.workspaceId, workspaceId),
        isNull(workspaceInvitations.acceptedAt),
        gt(workspaceInvitations.expiresAt, now)
      )
    )
    .orderBy(desc(workspaceInvitations.createdAt));

  return {
    members: memberRows.map((m) => ({
      ...m,
      role: m.role as WorkspaceRole,
    })),
    invitations: inviteRows.map((i) => ({
      ...i,
      role: i.role as WorkspaceRole,
    })),
    currentUserRole: callerMembership.role as WorkspaceRole,
  };
}

/**
 * Revokes an unaccepted invitation.
 */
export async function revokeInvitation(
  workspaceId: string,
  invitationId: string,
  callerUserId: string
): Promise<void> {
  await requireWorkspaceRole(callerUserId, workspaceId, "admin");
  const db = getDb();

  await db
    .delete(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.id, invitationId),
        eq(workspaceInvitations.workspaceId, workspaceId)
      )
    );

  recordAuditEvent({
    workspaceId,
    actorId: callerUserId,
    action: "invitation.revoked",
    entityType: "invitation",
    entityId: invitationId,
  }).catch(() => {});
}

/**
 * Updates a member's role (admin, member, viewer).
 */
export async function updateMemberRole(
  workspaceId: string,
  targetUserId: string,
  newRole: "admin" | "member" | "viewer",
  callerUserId: string
): Promise<void> {
  const callerMembership = await requireWorkspaceRole(callerUserId, workspaceId, "admin");
  const db = getDb();

  const [targetMembership] = await db
    .select({
      id: memberships.id,
      role: memberships.role,
    })
    .from(memberships)
    .where(
      and(
        eq(memberships.workspaceId, workspaceId),
        eq(memberships.userId, targetUserId)
      )
    )
    .limit(1);

  if (!targetMembership) {
    throw new Error("MEMBER_NOT_FOUND");
  }

  // Prevent demoting the workspace owner
  if (targetMembership.role === "owner") {
    throw new Error("CANNOT_MODIFY_OWNER");
  }

  // Only owners can promote or change another admin
  if (targetMembership.role === "admin" && callerMembership.role !== "owner" && callerUserId !== targetUserId) {
    throw new Error("FORBIDDEN");
  }

  await db
    .update(memberships)
    .set({
      role: newRole,
      updatedAt: new Date(),
    })
    .where(eq(memberships.id, targetMembership.id));

  recordAuditEvent({
    workspaceId,
    actorId: callerUserId,
    action: "member.role_updated",
    entityType: "member",
    entityId: targetUserId,
    details: {
      previousRole: targetMembership.role,
      newRole,
    },
  }).catch(() => {});
}

/**
 * Removes a member from a workspace or allows a member to leave.
 */
export async function removeMemberFromWorkspace(
  workspaceId: string,
  targetUserId: string,
  callerUserId: string
): Promise<void> {
  const db = getDb();

  const [targetMembership] = await db
    .select({
      id: memberships.id,
      role: memberships.role,
    })
    .from(memberships)
    .where(
      and(
        eq(memberships.workspaceId, workspaceId),
        eq(memberships.userId, targetUserId)
      )
    )
    .limit(1);

  if (!targetMembership) {
    throw new Error("MEMBER_NOT_FOUND");
  }

  // Cannot remove workspace owner
  if (targetMembership.role === "owner") {
    throw new Error("CANNOT_REMOVE_OWNER");
  }

  // If user is removing someone else, must be admin or owner
  if (callerUserId !== targetUserId) {
    const callerMembership = await requireWorkspaceRole(callerUserId, workspaceId, "admin");
    // Non-owner admin cannot remove another admin
    if (targetMembership.role === "admin" && callerMembership.role !== "owner") {
      throw new Error("FORBIDDEN");
    }
  }

  await db.delete(memberships).where(eq(memberships.id, targetMembership.id));

  recordAuditEvent({
    workspaceId,
    actorId: callerUserId,
    action: "member.removed",
    entityType: "member",
    entityId: targetUserId,
  }).catch(() => {});
}

/**
 * Retrieves invitation metadata for the public accept view.
 */
export async function getInvitationByToken(token: string) {
  const db = getDb();
  const now = new Date();

  const [row] = await db
    .select({
      id: workspaceInvitations.id,
      email: workspaceInvitations.email,
      role: workspaceInvitations.role,
      expiresAt: workspaceInvitations.expiresAt,
      acceptedAt: workspaceInvitations.acceptedAt,
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      workspaceSlug: workspaces.slug,
      inviterName: users.name,
    })
    .from(workspaceInvitations)
    .innerJoin(workspaces, eq(workspaceInvitations.workspaceId, workspaces.id))
    .leftJoin(users, eq(workspaceInvitations.invitedBy, users.id))
    .where(eq(workspaceInvitations.token, token))
    .limit(1);

  if (!row) {
    return { valid: false, reason: "Invitation not found" };
  }

  if (row.acceptedAt) {
    return { valid: false, reason: "Invitation has already been accepted" };
  }

  if (row.expiresAt < now) {
    return { valid: false, reason: "Invitation has expired" };
  }

  return {
    valid: true,
    invitation: {
      id: row.id,
      email: row.email,
      role: row.role as WorkspaceRole,
      expiresAt: row.expiresAt,
      workspace: {
        id: row.workspaceId,
        name: row.workspaceName,
        slug: row.workspaceSlug,
      },
      inviterName: row.inviterName || "A team member",
    },
  };
}

/**
 * Accepts an invitation and adds the user to the workspace.
 */
export async function acceptWorkspaceInvitation(
  token: string,
  userId: string
): Promise<{ success: boolean; workspaceId: string; workspaceSlug: string }> {
  const db = getDb();
  const now = new Date();

  const [invitation] = await db
    .select({
      id: workspaceInvitations.id,
      workspaceId: workspaceInvitations.workspaceId,
      email: workspaceInvitations.email,
      role: workspaceInvitations.role,
      expiresAt: workspaceInvitations.expiresAt,
      acceptedAt: workspaceInvitations.acceptedAt,
      workspaceSlug: workspaces.slug,
    })
    .from(workspaceInvitations)
    .innerJoin(workspaces, eq(workspaceInvitations.workspaceId, workspaces.id))
    .where(eq(workspaceInvitations.token, token))
    .limit(1);

  if (!invitation) {
    throw new Error("INVITATION_NOT_FOUND");
  }

  if (invitation.acceptedAt) {
    throw new Error("ALREADY_ACCEPTED");
  }

  if (invitation.expiresAt < now) {
    throw new Error("INVITATION_EXPIRED");
  }

  // Check if user is already a member
  const [existingMembership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.workspaceId, invitation.workspaceId),
        eq(memberships.userId, userId)
      )
    )
    .limit(1);

  if (!existingMembership) {
    // Add user as member
    await db.insert(memberships).values({
      workspaceId: invitation.workspaceId,
      userId,
      role: invitation.role,
    });
  }

  // Mark invitation accepted
  await db
    .update(workspaceInvitations)
    .set({
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(workspaceInvitations.id, invitation.id));

  return {
    success: true,
    workspaceId: invitation.workspaceId,
    workspaceSlug: invitation.workspaceSlug,
  };
}

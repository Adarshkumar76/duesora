import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, workspaces, memberships } from "@/db/schema";
import { sanitizeEmail } from "@/lib/security/sanitize";

export function generateSlug(name: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  const suffix = crypto.randomUUID().slice(0, 6);
  return `${sanitized || "workspace"}-${suffix}`;
}

export interface HandleSocialSignInParams {
  provider: string;
  email: string;
  name?: string | null;
}

export interface SocialSignInResult {
  userId: string;
  workspaceId: string;
}

export async function handleSocialSignIn({
  provider,
  email,
  name,
}: HandleSocialSignInParams): Promise<SocialSignInResult> {
  const sanitizedEmail = sanitizeEmail(email);
  const db = getDb();

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, sanitizedEmail))
    .limit(1);

  if (!existingUser) {
    const userName = name || (provider === "github" ? "GitHub User" : "Google User");
    const workspaceSlug = generateSlug(userName);
    const workspaceName = `${userName}'s Workspace`;

    const result = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          email: sanitizedEmail,
          name: userName,
          status: "active",
          emailVerifiedAt: new Date(),
        })
        .returning({ id: users.id });

      const [newWorkspace] = await tx
        .insert(workspaces)
        .values({
          name: workspaceName,
          slug: workspaceSlug,
          type: "personal",
          defaultCurrency: "INR",
          timezone: "Asia/Kolkata",
        })
        .returning({ id: workspaces.id });

      await tx.insert(memberships).values({
        userId: newUser.id,
        workspaceId: newWorkspace.id,
        role: "owner",
      });

      return { userId: newUser.id, workspaceId: newWorkspace.id };
    });

    return result;
  }

  // Check if existing user has an associated workspace
  const [membership] = await db
    .select({ workspaceId: memberships.workspaceId })
    .from(memberships)
    .where(eq(memberships.userId, existingUser.id))
    .limit(1);

  if (!membership) {
    const workspaceSlug = generateSlug(existingUser.name || "workspace");
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        name: `${existingUser.name || "User"}'s Workspace`,
        slug: workspaceSlug,
        type: "personal",
        defaultCurrency: "INR",
        timezone: "Asia/Kolkata",
      })
      .returning({ id: workspaces.id });

    await db.insert(memberships).values({
      userId: existingUser.id,
      workspaceId: newWorkspace.id,
      role: "owner",
    });

    return { userId: existingUser.id, workspaceId: newWorkspace.id };
  }

  return { userId: existingUser.id, workspaceId: membership.workspaceId };
}

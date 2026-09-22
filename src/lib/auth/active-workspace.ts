import { cookies } from "next/headers";
import { listUserWorkspaces } from "./workspace";
import type { WorkspaceRole } from "./permissions";

export const ACTIVE_WORKSPACE_COOKIE = "duesora_active_workspace";

export interface ActiveWorkspace {
  id: string;
  name: string;
  slug: string;
  type: string;
  defaultCurrency: string;
  timezone: string;
  role: WorkspaceRole;
  joinedAt: Date | string | null;
}

/**
 * Resolves the currently active workspace for a user.
 * Checks the `duesora_active_workspace` cookie first, validates membership,
 * then falls back to session workspace or the user's first available workspace.
 */
export async function resolveActiveWorkspace(
  userId: string,
  sessionWorkspaceId?: string | null
): Promise<{
  activeWorkspace: ActiveWorkspace;
  userWorkspaces: ActiveWorkspace[];
}> {
  const rawWorkspaces = await listUserWorkspaces(userId);
  const userWorkspaces: ActiveWorkspace[] = rawWorkspaces.map((w) => ({
    ...w,
    role: w.role as WorkspaceRole,
    type: w.type || "team",
    defaultCurrency: w.defaultCurrency || "USD",
    timezone: w.timezone || "UTC",
  }));

  if (userWorkspaces.length === 0) {
    const fallback: ActiveWorkspace = {
      id: sessionWorkspaceId || "default-workspace",
      name: "Personal Workspace",
      slug: "personal-workspace",
      type: "personal",
      defaultCurrency: "USD",
      timezone: "UTC",
      role: "owner",
      joinedAt: new Date(),
    };
    return { activeWorkspace: fallback, userWorkspaces: [fallback] };
  }

  // 1. Check duesora_active_workspace cookie
  try {
    const cookieStore = await cookies();
    const cookieWorkspaceId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
    if (cookieWorkspaceId) {
      const matched = userWorkspaces.find((w) => w.id === cookieWorkspaceId);
      if (matched) {
        return { activeWorkspace: matched, userWorkspaces };
      }
    }
  } catch {
    // In contexts where cookies() is unavailable (e.g. testing or static render), safely ignore
  }

  // 2. Fall back to session workspace
  if (sessionWorkspaceId) {
    const sessionMatch = userWorkspaces.find((w) => w.id === sessionWorkspaceId);
    if (sessionMatch) {
      return { activeWorkspace: sessionMatch, userWorkspaces };
    }
  }

  // 3. Fall back to first available membership
  return { activeWorkspace: userWorkspaces[0], userWorkspaces };
}

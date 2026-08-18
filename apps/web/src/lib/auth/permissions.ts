export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

const roleRank: Record<WorkspaceRole, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

export function hasMinimumRole(
  currentRole: WorkspaceRole,
  requiredRole: WorkspaceRole
) {
  return roleRank[currentRole] >= roleRank[requiredRole];
}
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  UserPlus,
  Mail,
  Trash2,
  Copy,
  Check,
  Clock,
  Loader2,
  X,
  AlertCircle,
  Crown,
} from "lucide-react";
import type { TeamMemberItem, WorkspaceInvitationItem } from "@/lib/team/service";
import type { WorkspaceRole } from "@/lib/auth/permissions";

interface TeamManagementProps {
  workspaceId: string;
  initialMembers: TeamMemberItem[];
  initialInvitations: WorkspaceInvitationItem[];
  currentUserRole: WorkspaceRole;
}

export function TeamManagement({
  workspaceId,
  initialMembers,
  initialInvitations,
  currentUserRole,
}: TeamManagementProps) {
  const [members, setMembers] = useState<TeamMemberItem[]>(initialMembers);
  const [invitations, setInvitations] = useState<WorkspaceInvitationItem[]>(initialInvitations);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const canManageTeam = currentUserRole === "owner" || currentUserRole === "admin";

  const refreshTeam = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setMembers(json.data.members || []);
          setInvitations(json.data.invitations || []);
        }
      }
    } catch {}
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed sending invitation");
      }

      setSuccessMessage(`Invitation successfully sent to ${inviteEmail}!`);
      setInviteEmail("");
      setIsInviteOpen(false);
      await refreshTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed sending invitation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    setActionLoadingId(invitationId);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || "Failed revoking invitation");
      }

      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed revoking invitation");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: "admin" | "member" | "viewer") => {
    setActionLoadingId(memberId);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || "Failed updating role");
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed updating role");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string | null) => {
    if (!confirm(`Are you sure you want to remove ${memberName || "this member"} from the workspace?`)) {
      return;
    }

    setActionLoadingId(memberId);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || "Failed removing member");
      }

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed removing member");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyLink = (token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteUrl = `${origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const getRoleBadge = (role: WorkspaceRole) => {
    switch (role) {
      case "owner":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "admin":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "member":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "viewer":
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30";
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
      <CardHeader className="pb-4 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Team & Access Management
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Invite colleagues, assign workspace roles, and control permission levels.
              </CardDescription>
            </div>
          </div>

          {canManageTeam && (
            <Button
              onClick={() => setIsInviteOpen(true)}
              size="sm"
              className="rounded-xl text-xs font-semibold h-8.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Member</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Section 1: Active Members */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>Active Members</span>
              <span className="px-1.5 py-0.2 rounded-full bg-muted text-foreground text-[10px]">
                {members.length}
              </span>
            </h4>
          </div>

          <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40">
            {members.map((member) => {
              const isOwner = member.role === "owner";
              const canEditThisMember =
                canManageTeam && !isOwner && (currentUserRole === "owner" || member.role !== "admin");

              return (
                <div
                  key={member.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {member.name ? member.name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {member.name || member.email.split("@")[0]}
                        </span>
                        {isOwner && (
                          <span title="Workspace Owner">
                            <Crown className="w-3.5 h-3.5 text-purple-500" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground block">{member.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-[11px] text-muted-foreground hidden md:inline">
                      Joined {formatDate(member.joinedAt)}
                    </span>

                    {/* Role Selection or Badge */}
                    {canEditThisMember ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.id, e.target.value as "admin" | "member" | "viewer")
                        }
                        disabled={actionLoadingId === member.id}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-border/80 bg-background text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getRoleBadge(
                          member.role
                        )}`}
                      >
                        {member.role}
                      </span>
                    )}

                    {/* Remove Member */}
                    {canEditThisMember && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        disabled={actionLoadingId === member.id}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Remove member"
                      >
                        {actionLoadingId === member.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Pending Invitations */}
        {invitations.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>Pending Invitations</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]">
                {invitations.length}
              </span>
            </h4>

            <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40">
              {invitations.map((invite) => (
                <div
                  key={invite.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground block">
                        {invite.email}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Expires {formatDate(invite.expiresAt)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getRoleBadge(
                        invite.role
                      )}`}
                    >
                      {invite.role}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(invite.token)}
                      className="rounded-xl text-xs h-8 px-2.5 border-border/70 cursor-pointer"
                      title="Copy invitation link"
                    >
                      {copiedToken === invite.token ? (
                        <>
                          <Check className="w-3 h-3 mr-1 text-emerald-600" />
                          <span className="text-emerald-600 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1 text-muted-foreground" />
                          <span>Link</span>
                        </>
                      )}
                    </Button>

                    {canManageTeam && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeInvitation(invite.id)}
                        disabled={actionLoadingId === invite.id}
                        className="rounded-xl text-xs h-8 px-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="Revoke invitation"
                      >
                        {actionLoadingId === invite.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>Revoke</span>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Invite Member Modal Dialog */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in-0">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Invite New Team Member</h3>
                  <p className="text-xs text-muted-foreground">Send an invite link to collaborate.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Colleague&apos;s Email Address</label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="rounded-xl text-xs h-9"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Role & Access Level</label>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as "admin" | "member" | "viewer")
                  }
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-border bg-background text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="admin">Admin — Full resource, monitoring & settings access</option>
                  <option value="member">Member — Manage resources, renew & monitor assets</option>
                  <option value="viewer">Viewer — Read-only access to dashboard & assets</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInviteOpen(false)}
                  className="rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !inviteEmail.trim()}
                  size="sm"
                  className="rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Invitation</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}

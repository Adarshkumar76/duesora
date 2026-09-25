"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, LogOut, Loader2, AlertCircle, X } from "lucide-react";

interface WorkspaceDangerZoneProps {
  workspaceId: string;
  workspaceName: string;
  userRole?: string;
}

export function WorkspaceDangerZone({
  workspaceId,
  workspaceName,
  userRole = "member",
}: WorkspaceDangerZoneProps) {
  const isOwner = userRole === "owner";

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmNameInput, setConfirmNameInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const handleDeleteWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmNameInput.trim() !== workspaceName.trim()) {
      setDeleteError(`Name does not match "${workspaceName}".`);
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to delete workspace");
      }

      window.location.href = json.redirectUrl || "/dashboard";
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete workspace");
      setDeleting(false);
    }
  };

  const handleLeaveWorkspace = async () => {
    setLeaving(true);
    setLeaveError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/leave`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to leave workspace");
      }

      window.location.href = json.redirectUrl || "/dashboard";
    } catch (err: unknown) {
      setLeaveError(err instanceof Error ? err.message : "Failed to leave workspace");
      setLeaving(false);
    }
  };

  return (
    <>
      <Card className="rounded-2xl border border-destructive/30 bg-destructive/5 dark:bg-destructive/10 shadow-xs">
        <CardHeader className="pb-4 border-b border-destructive/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-destructive/15 flex items-center justify-center text-destructive">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-destructive">
                Danger Zone
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Irreversible workspace operations, membership termination, and permanent data deletion.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          {/* Owner: Delete Workspace */}
          {isOwner ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-destructive/20 bg-background/80">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">
                  Delete This Workspace
                </h4>
                <p className="text-xs text-muted-foreground max-w-lg">
                  Permanently delete <span className="font-semibold text-foreground">{workspaceName}</span> and all associated resources, renewals, domains, monitors, cost history, and audit logs. This action cannot be undone.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  setIsDeleteModalOpen(true);
                  setConfirmNameInput("");
                  setDeleteError(null);
                }}
                className="rounded-xl shadow-xs gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Workspace</span>
              </Button>
            </div>
          ) : (
            /* Member: Leave Workspace */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-destructive/20 bg-background/80">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">
                  Leave This Workspace
                </h4>
                <p className="text-xs text-muted-foreground max-w-lg">
                  Revoke your membership and detach your account from <span className="font-semibold text-foreground">{workspaceName}</span>. You will lose access to its resources and alerts.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  setIsLeaveModalOpen(true);
                  setLeaveError(null);
                }}
                className="rounded-xl shadow-xs gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave Workspace</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Workspace Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-destructive/40 shadow-xl p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold">Delete Workspace</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This action <span className="font-bold text-destructive">CANNOT</span> be undone. All resources, tracking data, monitors, invoices, and webhooks will be immediately erased.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteWorkspace} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Please type <span className="font-bold font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">{workspaceName}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmNameInput}
                  onChange={(e) => setConfirmNameInput(e.target.value)}
                  placeholder={workspaceName}
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border/70 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-destructive/30 focus:border-destructive text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleting}
                  className="rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={confirmNameInput.trim() !== workspaceName.trim() || deleting}
                  className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>I understand, delete this workspace</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Workspace Confirmation Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-xl p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <LogOut className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-base font-bold">Leave Workspace</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to leave <span className="font-semibold text-foreground">{workspaceName}</span>? You will lose access to all its resources and team collaboration features.
            </p>

            {leaveError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{leaveError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsLeaveModalOpen(false)}
                disabled={leaving}
                className="rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleLeaveWorkspace}
                disabled={leaving}
                className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
              >
                {leaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Leaving...</span>
                  </>
                ) : (
                  <span>Leave Workspace</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

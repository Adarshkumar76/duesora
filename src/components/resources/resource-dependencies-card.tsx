"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitFork, AlertTriangle, Plus, Trash2, Loader2, ArrowUpRight, ArrowDownLeft, X } from "lucide-react";
import Link from "next/link";
import type { ResourceDependencyItem } from "@/lib/resources/dependencies";

interface ResourceCandidate {
  id: string;
  name: string;
  type: string;
}

interface ResourceDependenciesCardProps {
  workspaceId: string;
  resourceId: string;
  initialDependsOn: ResourceDependencyItem[];
  initialDependents: ResourceDependencyItem[];
  allWorkspaceResources: ResourceCandidate[];
  userRole?: string;
}

export function ResourceDependenciesCard({
  workspaceId,
  resourceId,
  initialDependsOn,
  initialDependents,
  allWorkspaceResources,
  userRole = "member",
}: ResourceDependenciesCardProps) {
  const canEdit = userRole !== "viewer";

  const [dependsOn, setDependsOn] = useState<ResourceDependencyItem[]>(initialDependsOn);
  const [dependents] = useState<ResourceDependencyItem[]>(initialDependents);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exclude current resource and already added upstream dependencies
  const availableCandidates = allWorkspaceResources.filter(
    (r) => r.id !== resourceId && !dependsOn.some((d) => d.dependsOnResourceId === r.id)
  );

  const handleAddDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/resources/${resourceId}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dependsOnResourceId: selectedTargetId,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to link dependency");
      }

      const candidate = allWorkspaceResources.find((r) => r.id === selectedTargetId);
      const newDep: ResourceDependencyItem = {
        ...json.data,
        dependsOnResource: candidate
          ? {
              id: candidate.id,
              name: candidate.name,
              type: candidate.type,
              status: "active",
              provider: null,
            }
          : undefined,
      };

      setDependsOn((prev) => [...prev, newDep]);
      setIsAddModalOpen(false);
      setSelectedTargetId("");
      setNotes("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to link dependency");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/resources/${resourceId}/dependencies?dependencyId=${dependencyId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || "Failed to remove link");
      }

      setDependsOn((prev) => prev.filter((d) => d.id !== dependencyId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove dependency");
    }
  };

  return (
    <>
      <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <GitFork className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Dependencies & Blast Radius
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upstream service prerequisites and downstream dependents.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dependencies"
                className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <GitFork className="w-3.5 h-3.5 text-purple-500" />
                <span className="hidden sm:inline">Network Map</span>
              </Link>

              {canEdit && availableCandidates.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddModalOpen(true);
                    setError(null);
                  }}
                  className="rounded-xl text-xs gap-1.5 h-8 font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Link Prerequisite</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-6">
          {/* Downstream: Blast Radius Warning */}
          {dependents.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Blast Radius: {dependents.length} Downstream Dependents</span>
              </div>
              <p className="text-xs text-muted-foreground">
                If this resource expires or is decommissioned, the following dependent services will be impacted:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {dependents.map((dep) => (
                  <Link
                    key={dep.id}
                    href={`/resources/${dep.resourceId}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-border/80 text-xs font-medium hover:border-primary transition-colors"
                  >
                    <ArrowDownLeft className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>{dep.dependentResource?.name || "Dependent Resource"}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      ({dep.dependentResource?.type.replace("_", " ")})
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Upstream: Depends On */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
              <span>Depends On (Prerequisites)</span>
            </h4>

            {dependsOn.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                This resource has no linked upstream prerequisites.
              </p>
            ) : (
              <div className="divide-y divide-border/40 rounded-xl border border-border/60 overflow-hidden">
                {dependsOn.map((dep) => (
                  <div
                    key={dep.id}
                    className="flex items-center justify-between p-3 bg-muted/10 hover:bg-muted/30 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <GitFork className="w-3 h-3" />
                      </div>
                      <div className="truncate">
                        <Link
                          href={`/resources/${dep.dependsOnResourceId}`}
                          className="font-semibold text-foreground hover:underline"
                        >
                          {dep.dependsOnResource?.name || "Upstream Resource"}
                        </Link>
                        {dep.notes && (
                          <p className="text-[11px] text-muted-foreground truncate">{dep.notes}</p>
                        )}
                      </div>
                    </div>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDependency(dep.id)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Remove dependency link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Dependency Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-xl p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <GitFork className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-bold">Link Upstream Prerequisite</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Declare an asset that this resource relies upon (e.g. Domain depends on Registrar, SSL cert depends on Domain).
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleAddDependency} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Select Prerequisite Asset</label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border/70 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                >
                  <option value="">-- Choose a resource --</option>
                  {availableCandidates.map((cand) => (
                    <option key={cand.id} value={cand.id}>
                      {cand.name} ({cand.type.replace("_", " ")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Relationship Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Ingress hostname mapped to this SSL cert"
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border/70 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={loading}
                  className="rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!selectedTargetId || loading}
                  className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Linking...</span>
                    </>
                  ) : (
                    <span>Add Link</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

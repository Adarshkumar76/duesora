"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, Plus, Trash2, Copy, Check, Shield, AlertCircle, X, Loader2 } from "lucide-react";
import type { ApiKeyItem } from "@/lib/auth/api-key";

interface ApiKeysManagerProps {
  workspaceId: string;
  initialKeys: ApiKeyItem[];
  userRole?: string;
}

export function ApiKeysManager({
  workspaceId,
  initialKeys,
  userRole = "member",
}: ApiKeysManagerProps) {
  const canManage = userRole === "owner" || userRole === "admin";

  const [keys, setKeys] = useState<ApiKeyItem[]>(initialKeys);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermission, setNewKeyPermission] = useState("read");
  const [newKeyExpiry, setNewKeyExpiry] = useState("never");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One-time key display modal
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName.trim(),
          permissions: newKeyPermission,
          expiry: newKeyExpiry,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to create API key");
      }

      setKeys((prev) => [...prev, json.data]);
      setGeneratedRawKey(json.data.rawKey);
      setIsCreateModalOpen(false);
      setNewKeyName("");
      setNewKeyPermission("read");
      setNewKeyExpiry("never");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? Any automated scripts using it will stop working immediately.")) {
      return;
    }

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/api-keys/${keyId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || "Failed to revoke API key");
      }

      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to revoke API key");
    }
  };

  const handleCopyKey = () => {
    if (!generatedRawKey) return;
    navigator.clipboard.writeText(generatedRawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Developer API Keys
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bearer tokens for programmatic asset registration, CI/CD pipelines, and script automation.
                </p>
              </div>
            </div>

            {canManage && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setError(null);
                }}
                className="rounded-xl text-xs gap-1.5 h-8.5 font-semibold cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generate Key</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          {keys.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <KeyRound className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                No API keys generated yet. Create one to authenticate external tools.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/40 rounded-xl border border-border/60 overflow-hidden">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-background gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{k.name}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                        <Shield className="w-2.5 h-2.5" />
                        {k.permissions === "read_write" ? "Read & Write" : "Read-only"}
                      </span>
                      {k.expiresAt ? (
                        new Date(k.expiresAt) < new Date() ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20">
                            Expired ({new Date(k.expiresAt).toLocaleDateString()})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Expires: {new Date(k.expiresAt).toLocaleDateString()}
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border/60">
                          Never expires
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                      <span>Prefix: {k.keyPrefix}...</span>
                      <span>•</span>
                      <span>Created: {new Date(k.createdAt).toLocaleDateString()}</span>
                      {k.lastUsedAt && (
                        <>
                          <span>•</span>
                          <span>Last used: {new Date(k.lastUsedAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {canManage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeKey(k.id)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2.5 rounded-xl text-xs gap-1.5 self-end sm:self-auto cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revoke</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Key Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-xl p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <KeyRound className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold">Generate Developer API Key</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Key Name / Identifier</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. GitHub Actions Deployment Bot"
                  required
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border/70 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Permissions Scope</label>
                <select
                  value={newKeyPermission}
                  onChange={(e) => setNewKeyPermission(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border/70 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                >
                  <option value="read">Read Only (Query resources & renewals)</option>
                  <option value="read_write">Read & Write (Create and renew resources)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Expiration</label>
                <select
                  value={newKeyExpiry}
                  onChange={(e) => setNewKeyExpiry(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border/70 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                >
                  <option value="never">Never (No expiration)</option>
                  <option value="1_day">1 Day (24 hours)</option>
                  <option value="1_month">1 Month (30 days)</option>
                  <option value="3_months">3 Months (90 days)</option>
                  <option value="1_year">1 Year (365 days)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  The API key will automatically be invalidated after this duration.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={creating}
                  className="rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newKeyName.trim() || creating}
                  className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <span>Generate API Key</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* One-Time Key Reveal Modal */}
      {generatedRawKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-primary/40 shadow-xl p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Check className="w-5 h-5" />
              <h3 className="text-base font-bold">API Key Generated Successfully</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Please copy your API key now. For your security, <strong className="text-foreground">it will never be displayed again</strong>.
            </p>

            <div className="p-3 rounded-xl bg-muted/60 border border-border/80 flex items-center justify-between gap-2">
              <code className="text-xs font-mono text-foreground break-all select-all">
                {generatedRawKey}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyKey}
                className="rounded-xl text-xs shrink-0 gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setGeneratedRawKey(null)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

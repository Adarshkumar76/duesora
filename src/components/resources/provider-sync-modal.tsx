"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Globe,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Key,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProviderDiscoveryResult } from "@/lib/providers/types";

export interface ProviderSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function ProviderSyncModal({ isOpen, onClose, workspaceId }: ProviderSyncModalProps) {
  const router = useRouter();

  const [apiToken, setApiToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [discoveryResult, setDiscoveryResult] = useState<ProviderDiscoveryResult | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [importSuccess, setImportSuccess] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiToken.trim()) {
      setErrorMsg("Please enter your Cloudflare API Token.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setDiscoveryResult(null);
    setImportSuccess(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "cloudflare",
          apiToken: apiToken.trim(),
          action: "discover",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to discover Cloudflare domains");
      }

      const result: ProviderDiscoveryResult = json.data;
      setDiscoveryResult(result);

      // Pre-select all new domains
      const newDomainNames = new Set<string>();
      result.items.forEach((item) => {
        if (!item.alreadyTracked) {
          newDomainNames.add(item.name);
        }
      });
      setSelectedDomains(newDomainNames);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error executing discovery");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectDomain = (name: string) => {
    setSelectedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!discoveryResult) return;
    const newItems = discoveryResult.items.filter((i) => !i.alreadyTracked);
    if (selectedDomains.size === newItems.length) {
      setSelectedDomains(new Set());
    } else {
      setSelectedDomains(new Set(newItems.map((i) => i.name)));
    }
  };

  const handleImport = async () => {
    if (!discoveryResult || selectedDomains.size === 0) return;

    setImporting(true);
    setErrorMsg(null);

    const itemsToImport = discoveryResult.items
      .filter((item) => selectedDomains.has(item.name))
      .map((item) => ({
        name: item.name,
        type: "domain" as const,
        status: item.status,
        provider: "Cloudflare",
        websiteUrl: item.websiteUrl || `https://${item.name}`,
      }));

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "cloudflare",
          apiToken: apiToken.trim(),
          action: "import",
          itemsToImport,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to import discovered domains");
      }

      setImportSuccess(json.data?.importedCount || itemsToImport.length);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setDiscoveryResult(null);
    setApiToken("");
    setErrorMsg(null);
    setImportSuccess(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-2xl bg-card border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
                Cloudflare Domain Discovery
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Sync active domains and DNS zones directly from your Cloudflare account.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-destructive/10 text-destructive text-xs border border-destructive/20 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {importSuccess !== null ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {importSuccess} {importSuccess === 1 ? "Domain" : "Domains"} Successfully Added!
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Your Cloudflare domains are now actively tracked with automatic renewal monitors and TLS inspection.
              </p>
              <div className="pt-2">
                <Button
                  onClick={handleClose}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 px-4 cursor-pointer"
                >
                  View Tracked Domains
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Token Input Form */}
              <form onSubmit={handleDiscover} className="space-y-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-muted-foreground" />
                      Cloudflare API Token
                    </label>
                    <a
                      href="https://dash.cloudflare.com/profile/api-tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <span>Create Token</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                      placeholder="Paste your read-only Zone.Read API token here"
                      className="w-full pl-3 pr-10 py-2 rounded-xl border border-input bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                      aria-label="Toggle token visibility"
                    >
                      {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                    Requires only &ldquo;Zone &gt; Zone &gt; Read&rdquo; permissions. Your token is never stored permanently.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading || !apiToken.trim()}
                    className="h-8 text-xs gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white cursor-pointer"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <Cloud className="w-3.5 h-3.5" />
                    <span>{loading ? "Connecting to Cloudflare..." : "Discover Domains"}</span>
                  </Button>
                </div>
              </form>

              {/* Discovery Results */}
              {discoveryResult && (
                <div className="space-y-3 pt-3 border-t border-border/60 animate-in fade-in-0 duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
                        <span>Discovered Zones</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {discoveryResult.totalFound} found ({discoveryResult.newCount} new)
                        </span>
                      </h3>
                    </div>

                    {discoveryResult.newCount > 0 && (
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {selectedDomains.size === discoveryResult.newCount
                          ? "Deselect All"
                          : "Select All New"}
                      </button>
                    )}
                  </div>

                  {discoveryResult.items.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-border/60">
                      No active DNS zones found for this Cloudflare account.
                    </div>
                  ) : (
                    <div className="border border-border/80 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 text-[11px] uppercase tracking-wider sticky top-0">
                          <tr>
                            <th className="py-2 px-3 w-8"></th>
                            <th className="py-2 px-3">Domain</th>
                            <th className="py-2 px-3">Plan</th>
                            <th className="py-2 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {discoveryResult.items.map((item) => {
                            const isSelected = selectedDomains.has(item.name);
                            return (
                              <tr
                                key={item.externalId}
                                className={`hover:bg-muted/30 transition-colors ${
                                  item.alreadyTracked ? "opacity-60 bg-muted/10" : ""
                                }`}
                              >
                                <td className="py-2 px-3">
                                  {!item.alreadyTracked ? (
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleSelectDomain(item.name)}
                                      className="rounded border-input text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>{item.name}</span>
                                    {item.alreadyTracked && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded font-normal bg-muted text-muted-foreground border border-border/50">
                                        Tracked
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-muted-foreground">
                                  {String(item.metadata?.plan || "Free")}
                                </td>
                                <td className="py-2 px-3">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Import Button */}
                  {discoveryResult.newCount > 0 && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground">
                        {selectedDomains.size} of {discoveryResult.newCount} new domains selected
                      </span>
                      <Button
                        type="button"
                        onClick={handleImport}
                        disabled={importing || selectedDomains.size === 0}
                        className="h-8 text-xs gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                      >
                        {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Import {selectedDomains.size} Domains</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-border/60 bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 text-xs rounded-xl"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

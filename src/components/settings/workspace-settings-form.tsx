"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Coins,
  Globe,
  Loader2,
  Check,
  AlertCircle,
  User,
  Mail,
  Shield,
} from "lucide-react";

interface WorkspaceSettingsFormProps {
  workspace: {
    id: string;
    name: string;
    slug?: string | null;
    defaultCurrency?: string | null;
    timezone?: string | null;
    role: string;
  };
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function WorkspaceSettingsForm({ workspace, user }: WorkspaceSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(workspace.name);
  const [currency, setCurrency] = useState(workspace.defaultCurrency || "USD");
  const [timezone, setTimezone] = useState(workspace.timezone || "UTC");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = workspace.role === "owner" || workspace.role === "admin";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          defaultCurrency: currency,
          timezone: timezone.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update settings");
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace General Settings Card */}
      <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Workspace Preferences
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure your workspace name, default reporting currency, and timezone.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Workspace settings saved successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Workspace Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Workspace Name</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium text-foreground disabled:opacity-60"
                  required
                />
              </div>

              {/* Workspace Slug */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Workspace Slug</label>
                <input
                  type="text"
                  disabled
                  value={workspace.slug || "personal"}
                  className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border/60 rounded-xl font-mono text-muted-foreground cursor-not-allowed"
                />
              </div>

              {/* Default Reporting Currency */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Primary Currency</span>
                </label>
                <select
                  disabled={!canEdit}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-foreground cursor-pointer disabled:opacity-60"
                >
                  <option value="USD">USD ($) - United States Dollar</option>
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  All dashboard charts and spend metrics will normalize to this currency.
                </p>
              </div>

              {/* Timezone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Timezone</span>
                </label>
                <select
                  disabled={!canEdit}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-foreground cursor-pointer disabled:opacity-60"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
              </div>
            </div>

            {canEdit && (
              <div className="pt-3 flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl text-xs font-semibold h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Account Profile Details Card */}
      <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <User className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Your Account Profile
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Details for your active session and workspace authorization.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 divide-y divide-border/40 text-sm">
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Full Name</span>
            <span className="font-semibold text-foreground">{user.name || "—"}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Email Address</span>
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{user.email}</span>
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Workspace Role</span>
            <span className="font-semibold capitalize text-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>{workspace.role}</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BellRing, Check, Loader2, AlertCircle, Plus, X } from "lucide-react";

const STANDARD_PRESETS = [60, 45, 30, 14, 7, 3, 1, 0];

interface ReminderSettingsProps {
  workspaceId: string;
  userRole?: string;
  initialReminderDays?: number[];
}

export function ReminderSettings({
  workspaceId,
  userRole = "member",
  initialReminderDays = [30, 14, 7, 3, 1, 0],
}: ReminderSettingsProps) {
  const router = useRouter();
  const [selectedDays, setSelectedDays] = useState<number[]>(
    Array.from(new Set(initialReminderDays)).sort((a, b) => b - a)
  );
  const [customDayInput, setCustomDayInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = userRole === "owner" || userRole === "admin";

  const toggleDay = (day: number) => {
    if (!canEdit) return;
    setSelectedDays((prev) => {
      const exists = prev.includes(day);
      const updated = exists ? prev.filter((d) => d !== day) : [...prev, day];
      return updated.sort((a, b) => b - a);
    });
  };

  const handleAddCustomDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const val = parseInt(customDayInput.trim(), 10);
    if (isNaN(val) || val < 0 || val > 365) return;
    if (!selectedDays.includes(val)) {
      setSelectedDays((prev) => [...prev, val].sort((a, b) => b - a));
    }
    setCustomDayInput("");
  };

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderDays: selectedDays,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update reminder settings");
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Renewal Alert Lead Times
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose how many days in advance Duesora dispatches in-app alerts, emails, and chat notifications prior to renewal.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 shrink-0" />
            <span>Reminder alert schedule updated successfully.</span>
          </div>
        )}

        {/* Selected Horizon Chips */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">
            Active Alert Horizons ({selectedDays.length} active)
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedDays.map((days) => (
              <span
                key={days}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
              >
                <span>{days === 0 ? "Day of renewal (0d)" : `${days} days before`}</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => toggleDay(days)}
                    className="hover:text-destructive cursor-pointer ml-0.5"
                    title={`Remove ${days}d alert`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Preset Selector */}
        {canEdit && (
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-foreground">
              Toggle Standard Preset Intervals
            </label>
            <div className="flex flex-wrap gap-2">
              {STANDARD_PRESETS.map((preset) => {
                const active = selectedDays.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => toggleDay(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                      active
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs font-semibold"
                        : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {preset === 0 ? "0d (Renewal day)" : `${preset} days`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Day Input */}
        {canEdit && (
          <form onSubmit={handleAddCustomDay} className="flex items-center gap-2 pt-1 max-w-xs">
            <input
              type="number"
              min={0}
              max={365}
              placeholder="Custom days (e.g. 90)"
              value={customDayInput}
              onChange={(e) => setCustomDayInput(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-background border border-border/70 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-foreground"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={!customDayInput.trim()}
              className="h-8 px-3 rounded-xl text-xs cursor-pointer gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </Button>
          </form>
        )}

        {/* Save button */}
        {canEdit && (
          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || selectedDays.length === 0}
              className="rounded-xl text-xs font-semibold h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Reminder Schedule</span>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

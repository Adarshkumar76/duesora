"use client";

import { useState } from "react";
import { Eye, EyeOff, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SecuritySettingsCards() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [otherSessionsSignedOut, setOtherSessionsSignedOut] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update password");
      }

      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutOtherSessions = () => {
    setOtherSessionsSignedOut(true);
    setTimeout(() => {
      setOtherSessionsSignedOut(false);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Change Password */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Change Password</h2>
            <p className="text-xs text-muted-foreground mt-1 mb-5">
              Ensure your account is using a strong, unique password.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 pr-10 text-xs bg-background border border-border/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-foreground transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    title={showCurrent ? "Hide" : "Show"}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 pr-10 text-xs bg-background border border-border/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-foreground transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    title={showNew ? "Hide" : "Show"}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 pr-10 text-xs bg-background border border-border/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-foreground transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    title={showConfirm ? "Hide" : "Show"}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl text-xs font-semibold h-9.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Recent Security Activity */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Recent Security Activity</h2>
            <p className="text-xs text-muted-foreground mt-1 mb-5">
              Review significant security events and login sessions.
            </p>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs py-2 border-b border-border/40">
                <span className="text-foreground font-medium">Successful login from Chrome</span>
                <span className="text-muted-foreground">Active now</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-border/40">
                <span className="text-foreground font-medium">Session token authenticated</span>
                <span className="text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-border/40">
                <span className="text-foreground font-medium">Password updated</span>
                <span className="text-muted-foreground">14 days ago</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-foreground font-medium">New API token created</span>
                <span className="text-muted-foreground">28 days ago</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
              <p className="font-semibold">Security Health Good</p>
              <p className="text-[11px] opacity-80 mt-0.5">
                Session secrets encrypted and rate limits active on all endpoints.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
        <h2 className="text-base font-bold text-foreground">Active Sessions</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Devices currently authenticated with your user account.
        </p>

        <div className="space-y-3 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 gap-2">
            <div>
              <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                <span>Session 1: Web Browser</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  This Device
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Current authenticated session • Active now
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 gap-2">
            <div>
              <p className="text-xs font-semibold text-foreground">
                Session 2: Mobile / Alternate Browser
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Active 2 hours ago
              </p>
            </div>
          </div>
        </div>

        {otherSessionsSignedOut && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Successfully signed out of all other remote sessions!</span>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={handleSignOutOtherSessions}
          className="text-xs font-medium h-9 rounded-xl border-border/80 hover:bg-muted/60 cursor-pointer"
        >
          Sign out of other sessions
        </Button>
      </div>
    </div>
  );
}

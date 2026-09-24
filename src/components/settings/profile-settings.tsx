"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  KeyRound,
  Shield,
  Loader2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

interface ProfileSettingsProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  userRole?: string;
}

export function ProfileSettings({ user, userRole = "member" }: ProfileSettingsProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate password confirmation if changing password
    if (isChangingPassword) {
      if (!currentPassword) {
        setError("Please enter your current password to set a new password.");
        return;
      }
      if (newPassword.length < 8) {
        setError("New password must be at least 8 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("The new password and confirmation do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      const payload: Record<string, string> = {};
      if (name.trim() !== (user.name || "")) {
        payload.name = name.trim();
      }
      if (isChangingPassword && newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      if (Object.keys(payload).length === 0) {
        setError("No changes detected to save.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update profile settings.");
      }

      setSuccessMessage(json.message || "Profile updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
      router.refresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              User Profile & Security
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update your display name, review account details, and manage password security.
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

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-foreground"
              />
            </div>

            {/* Email Address (Read-only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[10px] font-normal text-muted-foreground">Primary login ID</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={user.email || ""}
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-muted/40 border border-border/60 rounded-xl text-muted-foreground cursor-not-allowed"
                />
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              </div>
            </div>
          </div>

          {/* Account Role Badge */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Current Workspace Authorization</span>
            </div>
            <span className="font-semibold capitalize text-foreground px-2 py-0.5 rounded-lg bg-background border border-border/60">
              {userRole}
            </span>
          </div>

          {/* Password Security Section */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Password & Authentication</span>
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Keep your account secure with a strong password (minimum 8 characters).
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsChangingPassword(!isChangingPassword);
                  setError(null);
                }}
                className="h-7 text-xs rounded-lg cursor-pointer"
              >
                {isChangingPassword ? "Cancel Password Change" : "Change Password"}
              </Button>
            </div>

            {isChangingPassword && (
              <div className="mt-4 p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3.5 animate-in fade-in-0 duration-200">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full px-3.5 py-1.5 text-xs bg-background border border-border/70 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">
                      New Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-3.5 py-1.5 text-xs bg-background border border-border/70 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3.5 py-1.5 text-xs bg-background border border-border/70 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-foreground"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2 flex justify-end">
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
                <span>Save Profile Changes</span>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

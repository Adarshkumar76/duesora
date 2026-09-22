"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Check } from "lucide-react";

interface InviteAcceptCardProps {
  token: string;
  isLoggedIn: boolean;
  workspaceName: string;
}

export function InviteAcceptCard({
  token,
  isLoggedIn,
  workspaceName,
}: InviteAcceptCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to accept invitation");
      }

      setAccepted(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
      setLoading(false);
    }
  };

  if (accepted) {
    return (
      <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-500/30 flex items-center justify-center gap-2">
        <Check className="w-4 h-4" />
        <span>Welcome to {workspaceName}! Redirecting to dashboard...</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    const callbackUrl = `/invite/${token}`;
    return (
      <div className="space-y-3 pt-2">
        <a
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="w-full rounded-xl text-sm font-semibold h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer inline-flex items-center justify-center transition-colors"
        >
          <span>Sign In to Accept</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </a>
        <a
          href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="w-full rounded-xl text-sm font-semibold h-11 border border-border/80 bg-background hover:bg-muted/40 text-foreground cursor-pointer inline-flex items-center justify-center transition-colors"
        >
          <span>Create New Account</span>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
          {error}
        </div>
      )}

      <Button
        onClick={handleAccept}
        disabled={loading}
        className="w-full rounded-xl text-sm font-semibold h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <span>Joining Workspace...</span>
          </>
        ) : (
          <>
            <span>Accept & Enter Workspace</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </>
        )}
      </Button>
    </div>
  );
}

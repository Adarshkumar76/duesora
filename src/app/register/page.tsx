"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";

function getSafeCallbackUrl(raw: string | null): string {
  if (!raw) return "/dashboard";
  // Prevent open redirect (e.g. //evil.com or https://evil.com)
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\")) {
    return raw;
  }
  return "/dashboard";
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlError = searchParams.get("error");
  const displayError =
    error ||
    (urlError === "Configuration"
      ? "OAuth provider not configured yet. Set AUTH_GITHUB_ID & AUTH_GITHUB_SECRET or AUTH_GOOGLE_ID & AUTH_GOOGLE_SECRET in your .env.local file to enable social signup."
      : urlError === "OAuthSignin" || urlError === "OAuthCallback"
      ? "Social sign-in was interrupted. Please try again."
      : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setError("You must accept the terms of service and privacy principles.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          acceptedTerms,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      // Automatically sign the user in with their newly created account
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (loginRes?.error) {
        // Fallback to login page if auto-login didn't redirect
        router.push(
          callbackUrl !== "/dashboard"
            ? `/login?registered=true&callbackUrl=${encodeURIComponent(callbackUrl)}`
            : "/login?registered=true"
        );
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border border-border rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] bg-card text-left">
      <CardHeader className="space-y-2 text-center pb-5">
        <div className="flex justify-center mb-1">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <Logo size={32} color="#0F766E" className="transition-transform group-hover:scale-105 duration-150" />
          </Link>
        </div>
        <CardTitle className="text-xl sm:text-2xl font-serif font-normal tracking-tight text-foreground">
          Create your Duesora account
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground">
          Self-hosted renewal &amp; asset management
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {displayError && (
          <div
            role="alert"
            className="flex items-center gap-2.5 p-3 rounded-[6px] text-xs bg-destructive/10 text-destructive border border-destructive/20 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        {/* 1-Click Social Sign-Up */}
        <SocialAuthButtons callbackUrl={callbackUrl} disabled={loading} />

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
            <span className="bg-card px-2.5 text-muted-foreground font-semibold">
              Or with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium text-foreground">
              Full name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              disabled={loading}
              className="h-9.5 text-xs rounded-[6px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-foreground">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
              className="h-9.5 text-xs rounded-[6px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={loading}
                  className="h-9.5 text-xs rounded-[6px] pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-medium text-foreground">
                Confirm
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
                className="h-9.5 text-xs rounded-[6px]"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1">
            <input
              id="acceptedTerms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              required
              disabled={loading}
              className="mt-0.5 w-3.5 h-3.5 rounded-[3px] border-border text-primary focus:ring-primary cursor-pointer accent-teal-700"
            />
            <Label htmlFor="acceptedTerms" className="text-[11px] text-muted-foreground leading-normal cursor-pointer">
              I agree to the terms of service and privacy principles.
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-9.5 rounded-[6px] text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer mt-1"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Creating workspace...
              </>
            ) : (
              "Create Account →"
            )}
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/60">
          Already have an account?{" "}
          <Link
            href={
              callbackUrl !== "/dashboard"
                ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : "/login"
            }
            className="font-medium text-primary hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-teal-900/10 selection:text-teal-900 dark:selection:bg-teal-200/20 dark:selection:text-teal-200">
      <Suspense fallback={<div className="text-xs font-mono text-muted-foreground">Loading workspace...</div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}

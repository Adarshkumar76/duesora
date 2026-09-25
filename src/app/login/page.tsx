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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlError = searchParams.get("error");
  const displayError =
    error ||
    (urlError === "Configuration"
      ? "OAuth provider not configured yet. Set AUTH_GITHUB_ID & AUTH_GITHUB_SECRET or AUTH_GOOGLE_ID & AUTH_GOOGLE_SECRET in your .env.local file to enable social login."
      : urlError === "OAuthSignin" || urlError === "OAuthCallback"
      ? "Social sign-in was interrupted. Please try again."
      : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        const errLower = res.error.toLowerCase();
        if (
          res.status === 429 ||
          res.error.includes("429") ||
          errLower.includes("too_many_requests") ||
          errLower.includes("toomanyrequests") ||
          errLower.includes("too many requests") ||
          errLower.includes("rate limit")
        ) {
          setError("Too many login attempts. Rate limit exceeded (5 requests/minute). Please wait 60 seconds before trying again.");
        } else {
          setError("Invalid email or password. Please try again.");
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error("Sign-in error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      const msgLower = msg.toLowerCase();
      if (
        msg.includes("429") ||
        msgLower.includes("too many requests") ||
        msgLower.includes("too_many_requests") ||
        msgLower.includes("toomanyrequests") ||
        msg.includes("Failed to construct 'URL'") ||
        msg.includes("Invalid URL")
      ) {
        setError("Too many login attempts. Rate limit exceeded (5 requests/minute). Please wait 60 seconds before trying again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/70 shadow-2xl bg-card">
      <CardHeader className="space-y-3 text-center pb-6">
        <div className="flex justify-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo size={44} withGlow />
          </Link>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Welcome back
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Sign in to your Duesora workspace to manage your assets and renewals
        </CardDescription>
      </CardHeader>

      <CardContent>
        {displayError && (
          <div
            role="alert"
            className="flex items-center gap-2.5 p-3.5 mb-5 rounded-lg text-sm bg-destructive/10 text-destructive border border-destructive/20 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        {/* 1-Click Social Sign-In */}
        <SocialAuthButtons callbackUrl={callbackUrl} disabled={loading} />

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/80" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-card px-2.5 text-muted-foreground font-semibold">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-10 font-medium"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Don&apos;t have an account yet?{" "}
          <Link
            href={callbackUrl !== "/dashboard" ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/register"}
            className="font-medium text-primary hover:underline underline-offset-4"
          >
            Create an account
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

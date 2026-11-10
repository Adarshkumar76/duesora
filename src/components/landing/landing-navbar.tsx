"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Coffee, Menu, X, ArrowRight, BookOpen } from "lucide-react";
import { BUY_ME_A_COFFEE_URL, GITHUB_REPO_URL } from "@/lib/constants";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useTranslation } from "@/components/i18n/i18n-provider";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function subscribeTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getThemeSnapshot(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ||
    localStorage.getItem("theme") === "dark"
    ? "dark"
    : "light";
}

function getServerThemeSnapshot(): "light" | "dark" {
  return "light";
}

interface LandingNavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export function LandingNavbar({ user }: LandingNavbarProps) {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (stored === "dark" || (!stored && prefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new Event("storage"));
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand Logo & Version Marker */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo size={24} color="#0F766E" className="transition-transform group-hover:scale-105 duration-150" />
            <span className="font-semibold tracking-tight text-sm text-foreground">
              Duesora
            </span>
          </Link>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono font-medium bg-muted text-muted-foreground border border-border">
            v1.0 · open-source
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            {t("landing.features")}
          </a>
          <a href="#categories" className="hover:text-foreground transition-colors">
            {t("landing.categories")}
          </a>
          <a href="#self-host" className="hover:text-foreground transition-colors">
            {t("landing.selfHost")}
          </a>
          <Link href="/api/docs" className="hover:text-foreground transition-colors">
            Documentation
          </Link>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>{t("landing.github")}</span>
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Buy Me a Coffee */}
          <a
            href={BUY_ME_A_COFFEE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 h-8 rounded-[6px] border border-border bg-card text-foreground text-xs font-medium hover:bg-muted/70 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <Coffee className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{t("landing.support")}</span>
          </a>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="w-8 h-8 rounded-[6px] border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>

          {user ? (
            <Link href="/dashboard">
              <Button
                size="sm"
                className="h-8 rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                <span>{t("landing.goToDashboard")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="h-8 rounded-[6px] text-xs font-medium cursor-pointer">
                  {t("landing.signIn")}
                </Button>
              </Link>

              <Link href="/register">
                <Button
                  size="sm"
                  className="h-8 rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                >
                  <span>{t("landing.getStarted")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Open Mobile Menu"
            className="md:hidden p-1.5 rounded-[6px] border border-border text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card px-4 py-3 space-y-2.5 animate-subtle-fade">
          <div className="flex items-center justify-between py-1 border-b border-border/50 pb-2">
            <span className="text-xs font-medium text-muted-foreground">Language</span>
            <LanguageSwitcher />
          </div>

          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-medium text-muted-foreground hover:text-foreground py-1"
          >
            {t("landing.features")}
          </a>
          <a
            href="#categories"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-medium text-muted-foreground hover:text-foreground py-1"
          >
            {t("landing.categories")}
          </a>
          <a
            href="#self-host"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-medium text-muted-foreground hover:text-foreground py-1"
          >
            {t("landing.selfHost")}
          </a>
          <Link
            href="/api/docs"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground py-1"
          >
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>Documentation</span>
          </Link>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground py-1"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub Repository</span>
          </a>
          <a
            href={BUY_ME_A_COFFEE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-medium text-foreground py-1"
          >
            <Coffee className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{t("landing.support")}</span>
          </a>
          {user ? (
            <div className="pt-2 border-t border-border/60">
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full rounded-[6px] text-xs font-semibold">
                  {t("landing.goToDashboard")}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="pt-2 border-t border-border/60 flex flex-col gap-1.5">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full rounded-[6px] text-xs font-medium">
                  {t("landing.signIn")}
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full rounded-[6px] text-xs font-semibold">
                  {t("landing.getStarted")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

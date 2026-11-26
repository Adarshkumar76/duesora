"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Menu, X, ArrowRight, BookOpen } from "lucide-react";

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
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo size={22} color="#0F766E" className="transition-transform group-hover:scale-105 duration-150" />
            <span className="font-semibold tracking-tight text-sm text-foreground">
              Duesora
            </span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          <a href="#track" className="hover:text-foreground transition-colors">
            What to Track
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#self-host" className="hover:text-foreground transition-colors">
            Self-Host
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </a>
          <Link href="/api/docs" className="hover:text-foreground transition-colors">
            API Docs
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
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
              <Moon className="w-3.5 h-3.5 text-foreground" />
            )}
          </button>

          {user ? (
            <Link href="/dashboard">
              <Button
                size="sm"
                className="h-8 rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="h-8 rounded-[6px] text-xs font-medium cursor-pointer">
                  Sign In
                </Button>
              </Link>

              <Link href="/register">
                <Button
                  size="sm"
                  className="h-8 rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                >
                  <span>Get Started</span>
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
          <a
            href="#track"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-medium text-muted-foreground hover:text-foreground py-1"
          >
            What to Track
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-medium text-muted-foreground hover:text-foreground py-1"
          >
            How It Works
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-medium text-muted-foreground hover:text-foreground py-1"
          >
            Features
          </a>
          <a
            href="#self-host"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-medium text-muted-foreground hover:text-foreground py-1"
          >
            Self-Host
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-medium text-muted-foreground hover:text-foreground py-1"
          >
            FAQ
          </a>
          <Link
            href="/api/docs"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground py-1"
          >
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>API Documentation</span>
          </Link>

          {user ? (
            <div className="pt-2 border-t border-border/60">
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full rounded-[6px] text-xs font-semibold">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <div className="pt-2 border-t border-border/60 flex flex-col gap-1.5">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full rounded-[6px] text-xs font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full rounded-[6px] text-xs font-semibold">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

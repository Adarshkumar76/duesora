import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-teal-900/10 selection:text-teal-900 dark:selection:bg-teal-200/20 dark:selection:text-teal-200">
      {/* Top Header */}
      <header className="border-b border-border bg-background/95 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo size={24} color="#0F766E" className="transition-transform group-hover:scale-105 duration-150" />
            <span className="font-semibold tracking-tight text-sm text-foreground">Duesora</span>
          </Link>

          <Link href="/dashboard">
            <Button size="sm" variant="outline" className="h-8 rounded-[6px] text-xs font-medium cursor-pointer">
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Main 404 Experience */}
      <main className="flex-1 flex items-center justify-center px-4 py-16 text-center">
        <div className="max-w-md w-full space-y-6">
          <div className="space-y-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-[4px] bg-muted text-muted-foreground border border-border">
              404 · Not Found
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Page not found
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The page you are looking for doesn&apos;t exist, has been moved, or the URL was entered incorrectly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <Link href="/" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto h-9 px-4 rounded-[6px] text-xs font-medium border-border text-foreground hover:bg-muted gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Home</span>
              </Button>
            </Link>

            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                size="sm"
                className="w-full sm:w-auto h-9 px-4 rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go to Dashboard</span>
              </Button>
            </Link>
          </div>

          <div className="pt-6 border-t border-border/80 text-xs text-muted-foreground">
            Looking for API references?{" "}
            <Link href="/api/docs" className="text-primary hover:underline underline-offset-4 font-medium">
              Browse API Documentation
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, Home, Compass, Coffee, ShieldAlert, Sparkles, BookOpen } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BUY_ME_A_COFFEE_URL } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/15 relative overflow-hidden">
      {/* Background Subtle Grid & Ambient Glows */}
      <div
        className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,oklch(var(--border)/0.2)_1px,transparent_1px),linear-gradient(to_bottom,oklch(var(--border)/0.2)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-30"
      />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo size={30} withGlow className="transition-transform group-hover:scale-105 duration-200" />
            <span className="font-extrabold tracking-tight text-lg">Duesora</span>
          </Link>

          <div className="flex items-center gap-3">
            <a
              href={BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FFDD00]/15 text-[#FFDD00] hover:bg-[#FFDD00]/25 border border-[#FFDD00]/30 transition-colors shadow-sm"
              title="Support Duesora on Buy Me a Coffee"
            >
              <Coffee className="w-3.5 h-3.5 text-[#FFDD00]" />
              <span className="hidden sm:inline">Buy Me a Coffee</span>
            </a>

            <Link href="/dashboard">
              <Button size="sm" variant="outline" className="text-xs">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main 404 Experience */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16 relative z-10">
        <div className="max-w-2xl w-full text-center flex flex-col items-center">

          {/* Aesthetic Vector SVG Radar Graphic */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto flex items-center justify-center mb-6 select-none">
            {/* Ambient Radial Backlight */}
            <div className="absolute inset-4 bg-gradient-to-tr from-primary/20 via-sky-500/10 to-violet-500/20 rounded-full blur-2xl opacity-70 pointer-events-none" />

            {/* Radar Coordinates Vector */}
            <svg
              className="w-full h-full text-muted-foreground/35 relative"
              viewBox="0 0 320 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Concentric Coordinate Rings */}
              <circle cx="160" cy="160" r="142" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" opacity="0.35" />
              <circle cx="160" cy="160" r="108" stroke="currentColor" strokeWidth="1" opacity="0.45" />
              <circle cx="160" cy="160" r="74" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.65" />
              <circle cx="160" cy="160" r="40" stroke="currentColor" strokeWidth="1.5" className="text-primary/50" />

              {/* Crosshair Grids */}
              <line x1="160" y1="12" x2="160" y2="308" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity="0.35" />
              <line x1="12" y1="160" x2="308" y2="160" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity="0.35" />

              {/* Precision Corner Brackets */}
              <path d="M42 66 V42 H66" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M278 66 V42 H254" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M42 254 V278 H66" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M278 254 V278 H254" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

              {/* Signal Lost Beacon */}
              <circle cx="218" cy="102" r="6" className="fill-rose-500 animate-ping" opacity="0.6" />
              <circle cx="218" cy="102" r="4" className="fill-rose-500" />
              <line x1="160" y1="160" x2="218" y2="102" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="text-rose-500/70" />

              {/* Lost Marker Tag */}
              <rect x="228" y="90" width="58" height="22" rx="4" className="fill-card stroke-border/80" strokeWidth="1" />
              <text x="236" y="105" fontSize="10" fontFamily="monospace" fontWeight="600" fill="currentColor" opacity="0.9">
                NOT_FOUND
              </text>

              {/* Origin Center Point */}
              <circle cx="160" cy="160" r="5" className="fill-primary" />
            </svg>

            {/* Stylized Giant Typography Display */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="font-extrabold text-7xl sm:text-8xl tracking-tight bg-gradient-to-b from-foreground via-foreground/65 to-foreground/15 bg-clip-text text-transparent select-none drop-shadow-sm font-mono">
                404
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/80 bg-card/60 backdrop-blur-sm text-xs text-muted-foreground mb-4">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-mono uppercase tracking-wider font-medium text-foreground/80">Coordinate Not Found</span>
          </div>

          {/* Headings */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Page doesn&apos;t exist or was moved
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base max-w-md mb-8 leading-relaxed">
            The URL or resource you are looking for isn&apos;t cataloged in Duesora. It may have expired, been deleted, or had its route changed.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <Link href="/" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 font-medium px-6 shadow-sm">
                <Home className="w-4 h-4" />
                Go to Home
              </Button>
            </Link>

            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 font-medium px-6">
                <Compass className="w-4 h-4" />
                Open Dashboard
              </Button>
            </Link>
          </div>

          {/* Helpful Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mt-12 text-left">
            <Link
              href="/"
              className="p-3.5 rounded-xl border border-border/60 bg-card/40 hover:bg-card/90 transition-all group"
            >
              <div className="flex items-center gap-2 font-medium text-xs text-foreground group-hover:text-primary transition-colors">
                <Home className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                <span>Overview</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Explore Duesora&apos;s capabilities</p>
            </Link>

            <Link
              href="/login"
              className="p-3.5 rounded-xl border border-border/60 bg-card/40 hover:bg-card/90 transition-all group"
            >
              <div className="flex items-center gap-2 font-medium text-xs text-foreground group-hover:text-primary transition-colors">
                <Sparkles className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                <span>Sign In</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Access your existing workspace</p>
            </Link>

            <a
              href="https://github.com/Adarshkumar76/duesora/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl border border-border/60 bg-card/40 hover:bg-card/90 transition-all group"
            >
              <div className="flex items-center gap-2 font-medium text-xs text-foreground group-hover:text-primary transition-colors">
                <svg className="w-3.5 h-3.5 fill-current text-muted-foreground group-hover:text-primary" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>Report Issue</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Found a broken link or bug?</p>
            </a>
          </div>

        </div>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-border/50 py-4 px-4 text-center text-xs text-muted-foreground relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Duesora — Know what you own. Know what&apos;s due.</span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { Coffee } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BUY_ME_A_COFFEE_URL } from "@/lib/constants";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-border/70 bg-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={32} withGlow />
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

            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs">
                Sign In
              </Button>
            </Link>

            <Link href="/register">
              <Button size="sm" className="text-xs font-medium">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero / Main Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl border-border/60 shadow-xl shadow-black/5 bg-card">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="flex justify-center mb-6">
              <Logo size={96} withGlow className="drop-shadow-sm transition-transform hover:scale-105 duration-200" />
            </div>

            <Badge variant="secondary" className="mb-4">
              Free & Open Source
            </Badge>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Duesora
            </h1>

            <p className="text-lg text-muted-foreground mb-2 font-medium">
              Know what you own. Know what&apos;s due.
            </p>

            <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
              Track renewals, expirations, recurring costs, ownership, domains,
              SSL certificates, SaaS subscriptions, licenses, and other important
              resources in one self-hosted dashboard.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto font-medium">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In to Workspace
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
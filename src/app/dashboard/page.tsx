import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { workspaces } from "@/db/schema";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Globe,
  ShieldCheck,
  Plus,
  LogOut,
  FolderLock,
  Layers,
  Calendar,
  Coffee,
} from "lucide-react";
import { BUY_ME_A_COFFEE_URL } from "@/lib/constants";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const workspaceId = (session.user as { workspaceId?: string | null }).workspaceId;
  let workspaceName = "Personal Workspace";

  if (workspaceId) {
    const db = getDb();
    const [found] = await db
      .select({ name: workspaces.name, defaultCurrency: workspaces.defaultCurrency })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (found) {
      workspaceName = found.name;
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-border/70 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <Logo size={32} withGlow />
              <span className="font-extrabold tracking-tight text-lg">Duesora</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-border/70">
              <Badge variant="outline" className="text-xs font-normal">
                {workspaceName}
              </Badge>
            </div>
          </div>

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

            <div className="hidden md:flex flex-col text-right text-xs">
              <span className="font-medium text-foreground">{session.user.name || "User"}</span>
              <span className="text-muted-foreground">{session.user.email}</span>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4 mr-1.5" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-card via-card to-secondary/30 p-6 rounded-2xl border border-border/70 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <Badge className="bg-primary/20 text-primary border-primary/30">
                Phase 1 Active
              </Badge>
              <span className="text-xs text-muted-foreground">Workspace Tenant Isolated</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {session.user.name || "friend"}!
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your inventory is ready. Start tracking domains, TLS certificates, subscriptions, and recurring costs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button className="font-medium shadow-md">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Resource
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs flex items-center justify-between">
                <span>Tracked Resources</span>
                <Layers className="w-4 h-4 text-muted-foreground" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold">0</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-muted-foreground">Domains, SaaS, and licenses</span>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs flex items-center justify-between">
                <span>Active Domains</span>
                <Globe className="w-4 h-4 text-muted-foreground" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold">0</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-muted-foreground">Monitored for DNS & expiry</span>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs flex items-center justify-between">
                <span>SSL / TLS Certs</span>
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold">0</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-muted-foreground">Auto-checked certificate health</span>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs flex items-center justify-between">
                <span>Upcoming Renewals</span>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold">0</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-muted-foreground">Due in the next 30 days</span>
            </CardContent>
          </Card>
        </div>

        {/* Empty State / Get Started Guide */}
        <Card className="border-dashed border-border/80">
          <CardContent className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-primary">
              <FolderLock className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight">Your workspace is clean and ready</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                No resources added yet. Add a domain, SSL certificate, or SaaS subscription to see real-time renewal alerts and cost breakdowns.
              </p>
            </div>
            <Button variant="outline" className="mt-2">
              <Plus className="w-4 h-4 mr-1.5" />
              Register your first asset
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

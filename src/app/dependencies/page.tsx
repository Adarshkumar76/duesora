import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { resolveActiveWorkspace } from "@/lib/auth/active-workspace";
import { getWorkspaceDependencyGraph } from "@/lib/resources/dependencies";
import { VisualDependencyGraph } from "@/components/resources/visual-dependency-graph";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  GitFork,
  AlertTriangle,
  Layers,
  Flame,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DependenciesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
    return null;
  }

  // 1. Resolve active workspace
  const sessionWorkspaceId = (session.user as { workspaceId?: string | null }).workspaceId;
  const { activeWorkspace, userWorkspaces } = await resolveActiveWorkspace(
    session.user.id,
    sessionWorkspaceId
  );

  // 2. Fetch workspace dependency graph
  const graph = await getWorkspaceDependencyGraph(activeWorkspace.id);

  const handleSignOut = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background flex flex-row">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          user={session.user}
          currentWorkspace={activeWorkspace}
          workspaces={userWorkspaces}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Page Title & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <GitFork className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    Dependency Network & Blast Radius
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Visualize service connections, prerequisites, and simulate cascading failure impact.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/resources"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "rounded-xl text-xs gap-1.5 h-9 font-medium",
                })}
              >
                <span>Browse Resources</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Mapped Services</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">
                    {graph.stats.totalNodes}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <GitFork className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Dependency Links</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">
                    {graph.stats.totalEdges}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Single Points of Failure</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">
                    {graph.stats.spofCount}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Max Blast Radius</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">
                    {graph.stats.maxBlastRadius}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      {graph.stats.maxBlastRadius === 1 ? "downstream" : "downstream"}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Single Point of Failure Alert (if any exist) */}
          {graph.stats.spofCount > 0 && (
            <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-300">
                  {graph.stats.spofCount} Single Point{graph.stats.spofCount === 1 ? "" : "s"} of Failure Detected
                </h4>
                <p className="text-xs text-muted-foreground">
                  The highlighted services have multiple downstream dependents relying directly or indirectly on them. Ensure auto-renew and automated monitors are configured on these services to avoid cascading outages.
                </p>
              </div>
            </div>
          )}

          {/* Interactive Visual Graph Canvas */}
          <VisualDependencyGraph
            initialGraph={graph}
            workspaceId={activeWorkspace.id}
            height={680}
          />
        </main>
      </div>
    </div>
  );
}

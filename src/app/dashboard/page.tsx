import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RenewalsChart } from "@/components/dashboard/renewals-chart";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { RecentActivityTable } from "@/components/dashboard/recent-activity-table";
import { listUserWorkspaces } from "@/lib/auth/workspace";
import { getWorkspaceDashboardData } from "@/lib/dashboard/service";
import { Button } from "@/components/ui/button";
import { Plus, Coffee, Sparkles } from "lucide-react";
import { BUY_ME_A_COFFEE_URL } from "@/lib/constants";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // 1. Fetch user's workspaces
  const userWorkspaces = await listUserWorkspaces(session.user.id);
  const sessionWorkspaceId = (session.user as { workspaceId?: string | null }).workspaceId;

  // Active workspace fallback: from session or first available membership
  const activeWorkspace =
    userWorkspaces.find((w) => w.id === sessionWorkspaceId) ||
    userWorkspaces[0] || {
      id: sessionWorkspaceId || "default-workspace",
      name: "Personal Workspace",
      role: "owner",
    };

  // 2. Fetch aggregated dashboard data for this workspace
  let dashboardData;
  try {
    dashboardData = await getWorkspaceDashboardData(session.user.id, activeWorkspace.id);
  } catch {
    dashboardData = {
      workspace: { id: activeWorkspace.id, name: activeWorkspace.name, currency: "USD" },
      kpis: { totalResources: 0, renewalsDue: 0, totalSpend: 0, expiringSoon: 0 },
      renewalsOverview: [],
      topCategories: [],
      recentActivity: [],
    };
  }

  // Server action for sign out
  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  const kpis = dashboardData.kpis;
  const isWorkspaceEmpty = kpis.totalResources === 0;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background flex flex-row">
      {/* Sidebar */}
      <div className="hidden md:block shrink-0">
        <AppSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <AppHeader
          user={session.user}
          currentWorkspace={activeWorkspace}
          workspaces={userWorkspaces}
          onSignOut={handleSignOut}
        />

        {/* Dashboard Main View */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Page Heading & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Overview of your resources and renewals for{" "}
                <span className="font-semibold text-foreground">
                  {activeWorkspace.name}
                </span>
              </p>
            </div>

            {/* Dashboard Action Buttons */}
            <div className="flex items-center gap-2.5">
              {/* Buy Me a Coffee Badge / Button */}
              <a
                href={BUY_ME_A_COFFEE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors shadow-2xs"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Buy Me a Coffee</span>
              </a>

              {/* Add Resource CTA */}
              <Link href="/resources/new">
                <Button
                  size="sm"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5 text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Resource</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Empty workspace welcome banner if 0 resources exist */}
          {isWorkspaceEmpty && (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-foreground">
                    Get started with your first resource
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-xl">
                    Add your domains, subscriptions, SSL certificates, or cloud hosting to track renewals, manage costs, and receive proactive alerts.
                  </p>
                </div>
              </div>
              <Link href="/resources/new">
                <Button
                  size="sm"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs shrink-0 gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Resource
                </Button>
              </Link>
            </div>
          )}

          {/* Row 1: KPI Stat Cards */}
          <KpiCards kpis={kpis} currency={dashboardData.workspace.currency} />

          {/* Row 2: Charts Grid (Renewals Overview & Top Categories) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 flex">
              <div className="w-full">
                <RenewalsChart
                  data={dashboardData.renewalsOverview}
                  currency={dashboardData.workspace.currency}
                />
              </div>
            </div>
            <div className="lg:col-span-5 flex">
              <div className="w-full">
                <CategoryDonut
                  categories={dashboardData.topCategories}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Recent Activity Table */}
          <RecentActivityTable
            items={dashboardData.recentActivity}
          />
        </main>
      </div>
    </div>
  );
}

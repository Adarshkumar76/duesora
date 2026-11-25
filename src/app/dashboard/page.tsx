import type { Metadata } from "next";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RenewalsChart } from "@/components/dashboard/renewals-chart";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { RecentActivityTable } from "@/components/dashboard/recent-activity-table";
import { resolveActiveWorkspace } from "@/lib/auth/active-workspace";
import { getWorkspaceDashboardData } from "@/lib/dashboard/service";
import { getWorkspaceBudgetStatus } from "@/lib/budgets/service";
import { BudgetProgressCard } from "@/components/dashboard/budget-progress-card";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // 1. Resolve user's active workspace (via cookie or fallback)
  const sessionWorkspaceId = (session.user as { workspaceId?: string | null }).workspaceId;
  const { activeWorkspace, userWorkspaces } = await resolveActiveWorkspace(
    session.user.id,
    sessionWorkspaceId
  );

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

  // 3. Fetch workspace budget status
  let budgetStatus = null;
  try {
    budgetStatus = await getWorkspaceBudgetStatus(session.user.id, activeWorkspace.id);
  } catch {
    // fallback
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
      <AppSidebar />

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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
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
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              {/* Calendar Quick Action */}
              <Link href="/calendar">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-[6px] text-xs font-medium border-border hover:bg-muted text-foreground gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>View Calendar</span>
                </Button>
              </Link>

              {/* Add Resource CTA */}
              <Link href="/resources/new">
                <Button
                  size="sm"
                  className="h-9 px-3.5 rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Resource</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Empty workspace welcome banner if 0 resources exist */}
          {isWorkspaceEmpty && (
            <div className="rounded-[8px] border border-border bg-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-[6px] bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 text-left">
                  <h2 className="text-sm font-semibold text-foreground">
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
                  className="h-8.5 px-3 rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs shrink-0 gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Resource</span>
                </Button>
              </Link>
            </div>
          )}

          {/* Row 1: KPI Stat Cards */}
          <KpiCards kpis={kpis} currency={dashboardData.workspace.currency} />

          {/* Row 1.5: Budget Velocity & Spend Alerts */}
          {budgetStatus && (
            <BudgetProgressCard
              status={budgetStatus}
              workspaceId={activeWorkspace.id}
            />
          )}

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

import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RenewalsChart } from "@/components/dashboard/renewals-chart";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { RecentActivityTable } from "@/components/dashboard/recent-activity-table";
import { listUserWorkspaces } from "@/lib/auth/workspace";
import { getWorkspaceDashboardData } from "@/lib/dashboard/service";

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
      kpis: { totalResources: 32, renewalsDue: 12, totalSpend: 1248.75, expiringSoon: 5 },
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

  // Fallback to sample values matching mockup if workspace is newly initialized
  const kpis =
    dashboardData.kpis.totalResources > 0
      ? dashboardData.kpis
      : { totalResources: 32, renewalsDue: 12, totalSpend: 1248.75, expiringSoon: 5 };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background flex flex-row">
      {/* Sidebar matching mockup */}
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
          {/* Page Heading matching mockup */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Overview of your resources and renewals
            </p>
          </div>

          {/* Row 1: KPI Stat Cards */}
          <KpiCards kpis={kpis} currency={dashboardData.workspace.currency} />

          {/* Row 2: Charts Grid (Renewals Overview & Top Categories) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 flex">
              <div className="w-full">
                <RenewalsChart
                  data={
                    dashboardData.renewalsOverview.length === 12
                      ? dashboardData.renewalsOverview
                      : undefined
                  }
                />
              </div>
            </div>
            <div className="lg:col-span-5 flex">
              <div className="w-full">
                <CategoryDonut
                  categories={
                    dashboardData.topCategories.length > 0
                      ? dashboardData.topCategories
                      : undefined
                  }
                />
              </div>
            </div>
          </div>

          {/* Row 3: Recent Activity Table */}
          <RecentActivityTable
            items={
              dashboardData.recentActivity.length > 0
                ? dashboardData.recentActivity
                : undefined
            }
          />
        </main>
      </div>
    </div>
  );
}
